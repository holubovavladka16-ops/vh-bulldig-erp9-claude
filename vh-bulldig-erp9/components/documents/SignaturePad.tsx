"use client";

import { useRef, useState } from "react";

interface Props {
  signerName: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export default function SignaturePad({ signerName, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function confirm() {
    canvasRef.current!.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, "image/png");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-glass-border bg-base-900 p-5 shadow-2xl">
        <p className="mb-1 text-sm text-white/60">Podepisující: <span className="text-white">{signerName}</span></p>
        <p className="mb-3 text-xs text-white/40">{new Date().toLocaleString("cs-CZ")}</p>

        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="w-full touch-none rounded-xl border border-glass-border bg-white"
          style={{ backgroundColor: "#fff" }}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={clear} className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5">
            Vymazat podpis
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!hasDrawn}
            className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
          >
            Potvrdit podpis
          </button>
          <button type="button" onClick={onCancel} className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5">
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
