"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X } from "lucide-react";

interface Props {
  onDetected: (token: string) => void;
  onClose: () => void;
}

function extractToken(payload: string): string | null {
  try {
    const url = new URL(payload);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    // Nejde o platnou URL - zkusíme použít text tak, jak je (mohl by
    // to být přímo token).
    return payload.trim() || null;
  }
}

export default function QrScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          tick();
        }
      } catch {
        setError("Nepodařilo se otevřít fotoaparát. Zkontrolujte oprávnění a zkuste to znovu.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const token = extractToken(code.data);
            if (token) {
              onDetected(token);
              return;
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-xl border border-white/20 p-2 text-white transition hover:bg-white/10"
      >
        <X size={18} />
      </button>

      {error ? (
        <p className="max-w-xs text-center text-sm text-red-300">{error}</p>
      ) : (
        <>
          <video ref={videoRef} className="max-h-[70vh] w-full max-w-md rounded-xl" muted playsInline />
          <p className="mt-3 text-sm text-white/60">Namiřte fotoaparát na QR kód formuláře.</p>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
