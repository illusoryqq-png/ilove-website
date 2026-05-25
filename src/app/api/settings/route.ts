import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";

export async function GET() {
  try {
    const allSettings = await db.select().from(settings);
    
    // Преобразуем в объект (берём первую строку, так как таблица имеет одну запись)
    const row = allSettings[0];
    const settingsMap: Record<string, string> = {
      soundcloud_url: row?.soundcloud_url || "",
    };
    
    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = request.headers.get("x-admin-password");
    
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD not set in environment");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    
    if (authHeader !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { soundcloud_url: string };
    const { soundcloud_url } = body;

    if (!soundcloud_url) {
      return NextResponse.json({ error: "soundcloud_url is required" }, { status: 400 });
    }

    // Обновляем первую (единственную) запись в таблице
    await db.update(settings).set({ soundcloud_url });

    return NextResponse.json({ success: true, message: "Setting updated" });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json({ error: "Failed to update setting", details: String(error) }, { status: 500 });
  }
}