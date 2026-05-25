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

const ROTATIONS = [-6, 4, -3, 7, -5, 3, -7, 5, -4, 6, -2, 8];

function PolaroidCard({
  photo,
  index,
  onOpen,
}: {
  photo: Photo;
  index: number;
  onOpen: (p: Photo) => void;
}) {
  const rot =
    photo.rotation && photo.rotation !== "0"
      ? parseFloat(photo.rotation)
      : ROTATIONS[index % ROTATIONS.length];

  return (
    <div
      className="polaroid cursor-pointer"
      onClick={() => onOpen(photo)}
      style={{
        transform: `rotate(${rot}deg)`,
        width: "100%",
        maxWidth: "220px",
        margin: "0 auto",
      }}
    >
      <div style={{ height: "180px", overflow: "hidden", background: "#1a1a1a" }}>
        <img
          src={photo.url}
          alt={photo.caption || "Фото"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {photo.caption && (
        <div style={{ padding: "8px", textAlign: "center", fontFamily: "Caveat, cursive" }}>
          {photo.caption}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const photosRes = await fetch("/api/photos");
        const photosData = await photosRes.json();
        setPhotos(Array.isArray(photosData) ? photosData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }

      try {
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings || {});
      } catch (e) {
        console.error(e);
      }
    }

    fetchData();
  }, []);

  const soundcloudUrl =
    settings.soundcloud_url ||
    "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1";

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "#0a0a0a", color: "white" }}
    >
      <section style={{ padding: "60px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem" }}>Наши моменты</h1>
      </section>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>Загрузка...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "40px",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          {photos.map((photo, i) => (
            <PolaroidCard
              key={photo.id}
              photo={photo}
              index={i}
              onOpen={setLightbox}
            />
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              position: "relative",
            }}
          >
            <img
              src={lightbox.url}
              alt={lightbox.caption || "Фото"}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 10,
              }}
            />

            {lightbox.caption && (
              <p style={{ textAlign: "center", marginTop: 10 }}>
                {lightbox.caption}
              </p>
            )}

            <button
              onClick={() => setLightbox(null)}
              style={{
                position: "absolute",
                top: -15,
                right: -15,
                width: 35,
                height: 35,
                borderRadius: "50%",
                border: "none",
                background: "#e91e63",
                color: "white",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <footer style={{ padding: "60px 20px", textAlign: "center" }}>
        <iframe
          width="100%"
          height="300"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={soundcloudUrl}
        />
      </footer>
    </div>
  );
}