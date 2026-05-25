import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { desc } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

// Инициализация Supabase клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const allPhotos = await db.select().from(photos).orderBy(desc(photos.createdAt));
    return NextResponse.json({ photos: allPhotos });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Проверка пароля (как у тебя и было)
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = request.headers.get("x-admin-password");
    if (authHeader !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string || "";
    const rotation = formData.get("rotation") as string || "0";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Подготовка файла
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // 3. Загрузка в Supabase Storage (бакет "photos")
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      return NextResponse.json({ error: "Failed to upload to cloud storage" }, { status: 500 });
    }

    // 4. Получение публичного URL
    const { data: { publicUrl } } = supabase.storage
      .from("photos")
      .getPublicUrl(filename);

    // 5. Запись в базу данных через Drizzle
    const [newPhoto] = await db
      .insert(photos)
      .values({ 
        filename, 
        url: publicUrl, // Вот тут теперь ссылка из облака
        caption, 
        rotation 
      })
      .returning();

    return NextResponse.json({ photo: newPhoto }, { status: 201 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
