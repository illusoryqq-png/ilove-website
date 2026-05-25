import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const allPhotos = await db.select().from(photos);
    return NextResponse.json(allPhotos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filename, buffer, { contentType: file.type });

    if (uploadError) {
      throw new Error(`Storage Error: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("photos")
      .getPublicUrl(filename);

    const [inserted] = await db.insert(photos).values({
      filename,
      url: publicUrl,
      caption,
      rotation: rotation,
    }).returning();

    return NextResponse.json({ success: true, url: publicUrl, photo: inserted }, { status: 201 });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}