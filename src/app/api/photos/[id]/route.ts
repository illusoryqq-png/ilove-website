import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = request.headers.get("x-admin-password");
    if (authHeader !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const photoId = parseInt(id, 10);
    if (isNaN(photoId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const [photo] = await db.select().from(photos).where(eq(photos.id, photoId));
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    const filename = photo.url.split("/").pop();
    if (filename) {
      await supabase.storage.from("photos").remove([filename]);
    }
    await db.delete(photos).where(eq(photos.id, photoId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}