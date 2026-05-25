"use client";

import { useEffect, useState, useCallback } from "react";

interface Photo {
  id: number;
  filename: string;
  url: string;
  caption: string | null;
  rotation: string | null;
  createdAt: string;
}

interface Settings {
  soundcloud_url?: string;
}

// Предзаданные углы наклона для полароидов
const ROTATIONS = [-6, 4, -3, 7, -5, 3, -7, 5, -4, 6, -2, 8];

function DaysCounter() {
  const [days, setDays] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Точка отсчёта: 25 мая 2024 = 731 день к 25 мая 2026
    // Начало отношений = 25 мая 2024 (2 года назад от 25 мая 2026)
    const startDate = new Date("2024-05-25T00:00:00");

    const update = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      if (diff < 0) {
        setDays(0);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setDays(d);
      setHours(h);
      setMinutes(m);
      setSeconds(s);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="text-center py-16 px-4 relative">
      {/* Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["✦", "✧", "⋆", "✦", "✧", "⋆", "✦", "✧"].map((s, i) => (
          <span
            key={i}
            className="sparkle absolute text-pink-400/60"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              fontSize: `${10 + (i % 3) * 6}px`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <p className="font-caveat text-pink-300/80 text-2xl mb-2 tracking-wider">
        мы вместе уже
      </p>

      <div className="font-handwriting glow-text text-white mb-4" style={{ fontSize: "clamp(5rem, 18vw, 12rem)", lineHeight: 1 }}>
        {days}
      </div>

      <p className="font-handwriting text-pink-200/90 text-4xl md:text-5xl mb-8">
        дней <span className="heartbeat text-red-400">♥</span>
      </p>

      {/* Time breakdown */}
      <div className="flex justify-center gap-6 mt-4">
        {[
          { val: hours, label: "часов" },
          { val: minutes, label: "минут" },
          { val: seconds, label: "секунд" },
        ].map(({ val, label }) => (
          <div key={label} className="text-center">
            <div className="font-caveat text-3xl text-pink-300">{String(val).padStart(2, "0")}</div>
            <div className="font-caveat text-xs text-white/40 uppercase tracking-widest mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PolaroidCard({ photo, index }: { photo: Photo; index: number }) {
  const rot = photo.rotation && photo.rotation !== "0"
    ? parseFloat(photo.rotation)
    : ROTATIONS[index % ROTATIONS.length];

  return (
    <div
      className="polaroid fade-in-up wobble cursor-pointer"
      style={{
        transform: `rotate(${rot}deg)`,
        width: "100%",
        maxWidth: "220px",
        margin: "0 auto",
      }}
    >
      {/* Tape */}
      <div className="tape" />
      <div style={{ height: "180px", overflow: "hidden", background: "#1a1a1a" }}>
        <img
          src={photo.url}
          alt={photo.caption || "Наше фото"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {photo.caption && (
        <div className="polaroid-caption">{photo.caption}</div>
      )}
    </div>
  );
}

function EmptyPolaroid({ index }: { index: number }) {
  const rot = ROTATIONS[index % ROTATIONS.length];
  const placeholders = ["♡", "✿", "❀", "♡", "✦", "❤"];
  return (
    <div
      className="polaroid fade-in-up"
      style={{
        transform: `rotate(${rot}deg)`,
        width: "100%",
        maxWidth: "220px",
        margin: "0 auto",
        opacity: 0.4,
      }}
    >
      <div style={{ height: "180px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "3rem", color: "#333" }}>{placeholders[index % placeholders.length]}</span>
      </div>
      <div className="polaroid-caption" style={{ color: "#999" }}>наше фото</div>
    </div>
  );
}

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [konamiIndex, setKonamiIndex] = useState(0);

  // Konami-like secret key combo: typing "love" navigates to admin
  const SECRET_KEYS = ["l", "o", "v", "e"];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === SECRET_KEYS[konamiIndex]) {
        const next = konamiIndex + 1;
        if (next === SECRET_KEYS.length) {
          window.location.href = "/admin";
          setKonamiIndex(0);
        } else {
          setKonamiIndex(next);
        }
      } else {
        setKonamiIndex(key === SECRET_KEYS[0] ? 1 : 0);
      }
    },
    [konamiIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    async function fetchData() {
      try {
        const photosRes = await fetch("/api/photos");
        const photosData = await photosRes.json() as Photo[];
        setPhotos(Array.isArray(photosData) ? photosData : []);
      } catch (error) {
        console.error("Failed to load photos:", error);
      } finally {
        setLoading(false);
      }
      try {
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json() as { settings: Settings };
        setSettings(settingsData.settings || {});
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    fetchData();
  }, []);

  // Decorative stickers as SVG/emoji
  const stickers = [
    { emoji: "🌸", size: 50, top: "8%", left: "5%", rot: -15 },
    { emoji: "🌸", size: 35, top: "12%", left: "85%", rot: 20 },
    { emoji: "💮", size: 45, top: "35%", left: "3%", rot: 10 },
    { emoji: "🌺", size: 40, top: "55%", right: "5%", rot: -20 },
    { emoji: "🐱", size: 50, top: "70%", left: "4%", rot: 5 },
    { emoji: "🌸", size: 30, top: "80%", left: "88%", rot: -10 },
    { emoji: "✨", size: 35, top: "25%", left: "92%", rot: 0 },
    { emoji: "💕", size: 40, top: "90%", left: "50%", rot: 0 },
  ];

  const soundcloudUrl = settings.soundcloud_url ||
    "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true";

  const displayPhotos = photos.length >= 6 ? photos : [
    ...photos,
    ...Array(Math.max(0, 6 - photos.length)).fill(null),
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0a0a" }}>
      {/* Background glow blobs */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(ellipse, rgba(233,30,99,0.08) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: "10%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(ellipse, rgba(156,39,176,0.06) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* Floating decorative stickers */}
      {stickers.map((s, i) => (
        <div
          key={i}
          className="fixed pointer-events-none float-slow wobble"
          style={{
            fontSize: s.size,
            top: s.top,
            left: "left" in s ? s.left : undefined,
            right: "right" in s ? s.right : undefined,
            transform: `rotate(${s.rot}deg)`,
            zIndex: 2,
            animationDelay: `${i * 0.8}s`,
            opacity: 0.7,
            userSelect: "none",
          }}
        >
          {s.emoji}
        </div>
      ))}

      {/* Main content */}
      <div className="relative" style={{ zIndex: 3 }}>
        {/* ===== HERO SECTION ===== */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          {/* Top decorative line */}
          <div className="flex items-center gap-4 mb-8 opacity-60">
            <div style={{ height: "1px", width: "80px", background: "linear-gradient(to right, transparent, #e91e63)" }} />
            <span className="font-caveat text-pink-400 text-sm tracking-[0.3em] uppercase">с любовью</span>
            <div style={{ height: "1px", width: "80px", background: "linear-gradient(to left, transparent, #e91e63)" }} />
          </div>

          {/* Main title */}
          <div className="text-center mb-4 float-anim">
            <h1
              className="font-handwriting text-white leading-tight"
              style={{
                fontSize: "clamp(3.5rem, 12vw, 9rem)",
                textShadow: "0 0 40px rgba(233,30,99,0.3), 0 2px 20px rgba(0,0,0,0.8)",
              }}
            >
              2 года
            </h1>
            <h2
              className="font-handwriting text-pink-300"
              style={{
                fontSize: "clamp(2.5rem, 8vw, 6rem)",
                textShadow: "0 0 20px rgba(233,30,99,0.4)",
              }}
            >
              Вместе
            </h2>
          </div>

          {/* Subtitle */}
          <p className="font-caveat text-white/40 text-xl mt-4 tracking-widest">
            ✦ &nbsp; навсегда &nbsp; ✦
          </p>

          {/* Counter */}
          <div
            className="mt-12 w-full max-w-2xl grunge-border rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)" }}
          >
            <DaysCounter />
          </div>

          {/* Scroll hint */}
          <div className="mt-16 flex flex-col items-center gap-2 opacity-40">
            <span className="font-caveat text-white/60 text-sm tracking-widest">прокрути вниз</span>
            <div style={{ fontSize: "20px" }}>↓</div>
          </div>
        </section>

        {/* ===== DECORATIVE DIVIDER ===== */}
        <div className="flex items-center justify-center gap-6 py-4 px-8 opacity-30">
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #e91e63)" }} />
          <span className="font-caveat text-pink-400 text-2xl">♥</span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, #e91e63)" }} />
        </div>

        {/* ===== GALLERY SECTION ===== */}
        <section className="py-16 px-4 md:px-8">
          <div className="text-center mb-16">
            <h3
              className="font-handwriting text-white"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", textShadow: "0 0 30px rgba(233,30,99,0.3)" }}
            >
              Наши моменты
            </h3>
            <p className="font-caveat text-pink-300/60 text-xl mt-2">
              ~ воспоминания, которые греют душу ~
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div
                className="spinner"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "3px solid rgba(233,30,99,0.2)",
                  borderTopColor: "#e91e63",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "40px 30px",
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "40px 20px 80px",
              }}
            >
              {displayPhotos.map((photo, i) =>
                photo ? (
                  <PolaroidCard key={photo.id} photo={photo} index={i} />
                ) : (
                  <EmptyPolaroid key={`empty-${i}`} index={i} />
                )
              )}
            </div>
          )}

          {photos.length === 0 && !loading && (
            <p className="text-center font-caveat text-white/30 text-xl mt-4">
              Фотографии появятся здесь ✿
            </p>
          )}
        </section>

        {/* ===== LOVE NOTE SECTION ===== */}
        <section className="py-16 px-4">
          <div
            className="max-w-2xl mx-auto text-center grunge-border rounded-2xl p-10"
            style={{ background: "rgba(233,30,99,0.03)", backdropFilter: "blur(10px)" }}
          >
            <div className="text-5xl mb-6">🌹</div>
            <p
              className="font-handwriting text-white/90 leading-relaxed"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}
            >
              Каждый день с тобой —<br />
              <span className="text-pink-300">это подарок</span>,<br />
              который я ценю больше всего на свете
            </p>
            <div className="mt-8 flex justify-center gap-4 text-3xl">
              <span className="heartbeat">❤️</span>
              <span className="heartbeat" style={{ animationDelay: "0.3s" }}>🖤</span>
              <span className="heartbeat" style={{ animationDelay: "0.6s" }}>❤️</span>
            </div>
          </div>
        </section>

        {/* ===== SOUNDCLOUD FOOTER ===== */}
        <footer className="mt-8 pb-0">
          {/* Torn paper decorative top */}
          <div
            style={{
              height: "30px",
              background: "rgba(233,30,99,0.05)",
              clipPath: "polygon(0% 100%, 2% 20%, 4% 80%, 6% 10%, 8% 70%, 10% 30%, 12% 90%, 14% 20%, 16% 80%, 18% 10%, 20% 70%, 22% 40%, 24% 90%, 26% 15%, 28% 75%, 30% 30%, 32% 85%, 34% 10%, 36% 65%, 38% 35%, 40% 80%, 42% 20%, 44% 85%, 46% 15%, 48% 75%, 50% 25%, 52% 80%, 54% 30%, 56% 85%, 58% 10%, 60% 70%, 62% 20%, 64% 80%, 66% 30%, 68% 90%, 70% 20%, 72% 70%, 74% 25%, 76% 80%, 78% 10%, 80% 75%, 82% 30%, 84% 85%, 86% 15%, 88% 75%, 90% 20%, 92% 80%, 94% 10%, 96% 70%, 98% 25%, 100% 100%)",
            }}
          />

          <div
            style={{
              background: "linear-gradient(to bottom, rgba(233,30,99,0.05), rgba(0,0,0,0.8))",
              padding: "40px 20px 0",
            }}
          >
            <div className="text-center mb-8">
              <h3
                className="font-handwriting text-white/80"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                🎵 Наша музыка
              </h3>
              <p className="font-caveat text-pink-300/50 text-lg mt-1">
                ~ мелодии, которые напоминают о нас ~
              </p>
            </div>

            <div className="soundcloud-wrapper max-w-3xl mx-auto">
              <iframe
                width="100%"
                height="450"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={soundcloudUrl}
                style={{ display: "block" }}
              />
            </div>

            <div className="text-center py-10">
              <p className="font-caveat text-white/20 text-sm tracking-widest">
                ✦ &nbsp; сделано с любовью &nbsp; ✦
              </p>
              <p className="font-caveat text-pink-400/30 text-xs mt-2">
                25 мая 2024 — навсегда
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
