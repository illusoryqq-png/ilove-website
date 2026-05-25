import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { desc } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

// Инициализация Supabase клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const runtime = "nodejs"; // Явно указываем среду

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
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = request.headers.get("x-admin-password");
    
    if (authHeader !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string) || "";
    const rotation = (formData.get("rotation") as string) || "0";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Читаем файл в Buffer (в памяти)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // Загрузка ПРЯМО из буфера в Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from("photos")
      .getPublicUrl(filename);

    // Записываем в БД
    const [newPhoto] = await db
      .insert(photos)
      .values({ 
        filename, 
        url: publicUrl,
        caption, 
        rotation 
      })
      .returning();

    return NextResponse.json({ photo: newPhoto }, { status: 201 });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload photo" }, { status: 500 });
  }
}
