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
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${file.name.split(".").pop()}`;

    // 1. Загрузка в Storage
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filename, buffer, { contentType: file.type });
    if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(filename);

    // 2. Запись в базу
    const [inserted] = await db.insert(photos).values({
      filename,
      url: publicUrl,
      caption,
      rotation: parseInt(rotation) || 0,
    }).returning();

    return NextResponse.json({ success: true, url: publicUrl, photo: inserted }, { status: 201 });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
