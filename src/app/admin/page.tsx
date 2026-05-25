"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Photo {
  id: number;
  filename: string;
  url: string;
  caption: string | null;
  rotation: string | null;
  createdAt: string;
}

const ROTATIONS = ["-6", "4", "-3", "7", "-5", "3", "-7", "5"];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [token, setToken] = useState("");

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [soundcloudUrl, setSoundcloudUrl] = useState("");
  const [soundcloudSaving, setSoundcloudSaving] = useState(false);
  const [soundcloudMsg, setSoundcloudMsg] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadRotation, setUploadRotation] = useState("0");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Check session storage for saved token
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchData = useCallback(async (t: string) => {
    try {
      const [photosRes, settingsRes] = await Promise.all([
        fetch("/api/photos", { headers: { "x-admin-password": t } }),
        fetch("/api/settings"),
      ]);
      const photosData = await photosRes.json() as { photos: Photo[] };
      const settingsData = await settingsRes.json() as { settings: { soundcloud_url?: string } };
      setPhotos(photosData.photos || []);
      setSoundcloudUrl(settingsData.settings?.soundcloud_url || "");
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData(token);
    }
  }, [isAuthenticated, token, fetchData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { success?: boolean; token?: string; error?: string };
      if (data.success && data.token) {
        setToken(data.token);
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_token", data.token);
      } else {
        setLoginError(data.error || "Неверный пароль");
      }
    } catch {
      setLoginError("Ошибка подключения");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setToken("");
    sessionStorage.removeItem("admin_token");
    setPassword("");
  }

  function handleFileChange(file: File) {
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadMsg("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("caption", uploadCaption);
      formData.append("rotation", uploadRotation);

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "x-admin-password": token },
        body: formData,
      });
      const data = await res.json() as { photo?: Photo; error?: string };
      if (data.photo) {
        setUploadMsg("✓ Фото успешно загружено!");
        setUploadFile(null);
        setUploadCaption("");
        setUploadRotation("0");
        setUploadPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchData(token);
      } else {
        setUploadMsg(`✗ Ошибка: ${data.error || "Не удалось загрузить"}`);
      }
    } catch {
      setUploadMsg("✗ Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(id: number) {
    if (!confirm("Удалить это фото?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/photos/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": token },
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveSoundcloud(e: React.FormEvent) {
    e.preventDefault();
    setSoundcloudSaving(true);
    setSoundcloudMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": token,
        },
        body: JSON.stringify({ key: "soundcloud_url", value: soundcloudUrl }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setSoundcloudMsg("✓ Плейлист обновлён!");
      } else {
        setSoundcloudMsg(`✗ ${data.error || "Ошибка"}`);
      }
    } catch {
      setSoundcloudMsg("✗ Ошибка сохранения");
    } finally {
      setSoundcloudSaving(false);
    }
  }

  // ===== LOGIN SCREEN =====
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#0a0a0a" }}
      >
        {/* Glow */}
        <div
          className="fixed pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(ellipse, rgba(233,30,99,0.08) 0%, transparent 70%)",
          }}
        />

        <div
          className="relative w-full max-w-sm rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="font-handwriting text-white text-3xl">Админ-панель</h1>
            <p className="font-caveat text-white/30 text-sm mt-1">Введите пароль для входа</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="admin-input"
              placeholder="Пароль..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {loginError && (
              <p className="font-caveat text-red-400 text-sm text-center">{loginError}</p>
            )}
            <button
              type="submit"
              className="admin-btn w-full"
              disabled={loginLoading}
            >
              {loginLoading ? "Проверяю..." : "Войти"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="font-caveat text-white/20 text-sm hover:text-white/40 transition-colors"
            >
              ← Вернуться на главную
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ===== ADMIN PANEL =====
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(233,30,99,0.15)",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💝</span>
            <div>
              <h1 className="font-handwriting text-white text-2xl leading-none">
                Панель управления
              </h1>
              <p className="font-caveat text-pink-300/40 text-xs">Anniversary Website Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="font-caveat text-white/40 text-sm hover:text-white/70 transition-colors"
            >
              ← Посмотреть сайт
            </a>
            <button
              onClick={handleLogout}
              className="admin-btn admin-btn-danger text-sm py-2 px-4"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ===== PHOTO UPLOAD ===== */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <h2 className="font-handwriting text-white text-3xl mb-6 flex items-center gap-3">
            <span>📸</span> Загрузить фото
          </h2>

          <form onSubmit={handleUpload} className="space-y-5">
            {/* Drop zone */}
            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFileChange(f);
              }}
            >
              {uploadPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }}
                  />
                  <span className="font-caveat text-pink-300 text-sm">
                    {uploadFile?.name} ({((uploadFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-5xl mb-3">🖼️</div>
                  <p className="font-caveat text-white/50 text-xl">
                    Перетащите фото сюда или нажмите для выбора
                  </p>
                  <p className="font-caveat text-white/25 text-sm mt-1">
                    JPG, PNG, WebP · до 10 MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
              />
            </div>

            {/* Caption + Rotation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-caveat text-white/50 text-sm mb-1 block">
                  Подпись (необязательно)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Наш первый день вместе..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                />
              </div>
              <div>
                <label className="font-caveat text-white/50 text-sm mb-1 block">
                  Угол наклона (полароид)
                </label>
                <select
                  className="admin-input"
                  value={uploadRotation}
                  onChange={(e) => setUploadRotation(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="0">Авто (случайный)</option>
                  {ROTATIONS.map((r) => (
                    <option key={r} value={r}>
                      {parseFloat(r) > 0 ? `+${r}°` : `${r}°`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {uploadMsg && (
              <p
                className="font-caveat text-lg text-center"
                style={{ color: uploadMsg.startsWith("✓") ? "#4ade80" : "#f87171" }}
              >
                {uploadMsg}
              </p>
            )}

            <button
              type="submit"
              className="admin-btn w-full py-3"
              disabled={!uploadFile || uploading}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="spinner inline-block"
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                    }}
                  />
                  Загружаю...
                </span>
              ) : (
                "📤 Загрузить фото"
              )}
            </button>
          </form>
        </section>

        {/* ===== PHOTO GALLERY MANAGEMENT ===== */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <h2 className="font-handwriting text-white text-3xl mb-6 flex items-center gap-3">
            <span>🗂️</span> Все фото ({photos.length})
          </h2>

          {photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🌸</div>
              <p className="font-caveat text-white/30 text-xl">Нет загруженных фотографий</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "16px",
              }}
            >
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || "Photo"}
                    style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                  />
                  {/* Overlay on hover */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
                  >
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="admin-btn admin-btn-danger text-xs py-1.5 px-3"
                      disabled={deletingId === photo.id}
                    >
                      {deletingId === photo.id ? "Удаляю..." : "🗑️ Удалить"}
                    </button>
                  </div>
                  {photo.caption && (
                    <div
                      className="px-2 py-1.5"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <p className="font-caveat text-white/60 text-xs truncate">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== SOUNDCLOUD SETTINGS ===== */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <h2 className="font-handwriting text-white text-3xl mb-2 flex items-center gap-3">
            <span>🎵</span> Плейлист SoundCloud
          </h2>
          <p className="font-caveat text-white/30 text-sm mb-6">
            Вставьте URL или iframe-код плейлиста SoundCloud
          </p>

          <form onSubmit={handleSaveSoundcloud} className="space-y-4">
            <div>
              <label className="font-caveat text-white/50 text-sm mb-1 block">
                Embed URL или полный iframe код
              </label>
              <textarea
                className="admin-input"
                rows={4}
                placeholder="https://w.soundcloud.com/player/?url=..."
                value={soundcloudUrl}
                onChange={(e) => setSoundcloudUrl(e.target.value)}
                style={{ resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
              />
            </div>

            {/* Preview */}
            {soundcloudUrl && (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <iframe
                  width="100%"
                  height="200"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={soundcloudUrl.includes("<iframe") ?
                    soundcloudUrl.match(/src="([^"]+)"/)?.[1] || soundcloudUrl
                    : soundcloudUrl}
                />
              </div>
            )}

            {soundcloudMsg && (
              <p
                className="font-caveat text-lg text-center"
                style={{ color: soundcloudMsg.startsWith("✓") ? "#4ade80" : "#f87171" }}
              >
                {soundcloudMsg}
              </p>
            )}

            <button
              type="submit"
              className="admin-btn py-3 px-8"
              disabled={soundcloudSaving}
            >
              {soundcloudSaving ? "Сохраняю..." : "💾 Сохранить плейлист"}
            </button>
          </form>

          {/* Help */}
          <div
            className="mt-6 rounded-xl p-4"
            style={{ background: "rgba(233,30,99,0.05)", border: "1px solid rgba(233,30,99,0.1)" }}
          >
            <p className="font-caveat text-pink-300/70 text-sm mb-2 font-semibold">
              💡 Как получить embed URL:
            </p>
            <ol className="font-caveat text-white/40 text-sm space-y-1 list-decimal list-inside">
              <li>Откройте трек или плейлист на SoundCloud</li>
              <li>Нажмите «Поделиться» → «Встроить»</li>
              <li>Скопируйте весь iframe код или только src URL</li>
              <li>Вставьте сюда и нажмите сохранить</li>
            </ol>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Фотографий", value: photos.length, emoji: "📸" },
            { label: "Дней вместе", value: Math.floor((Date.now() - new Date("2024-05-25").getTime()) / 86400000), emoji: "❤️" },
            { label: "Воспоминаний", value: photos.length + 1, emoji: "✨" },
          ].map(({ label, value, emoji }) => (
            <div
              key={label}
              className="rounded-2xl p-5 text-center"
              style={{
                background: "rgba(233,30,99,0.05)",
                border: "1px solid rgba(233,30,99,0.1)",
              }}
            >
              <div className="text-3xl mb-2">{emoji}</div>
              <div className="font-handwriting text-white text-4xl">{value}</div>
              <div className="font-caveat text-white/40 text-sm mt-1">{label}</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
