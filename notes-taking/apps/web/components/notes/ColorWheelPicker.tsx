"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  hexToHsv,
  hsvToHex,
  normalizeHex,
  type HSV,
} from "@/lib/color";

import styles from "./ColorWheelPicker.module.css";

const SIZE = 168;
const RADIUS = SIZE / 2;

type ColorWheelPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
};

export function ColorWheelPicker({
  value,
  onChange,
  disabled = false,
}: ColorWheelPickerProps) {
  const ids = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<"wheel" | "value" | null>(null);
  const hsvRef = useRef<HSV>({ h: 24, s: 0.58, v: 0.94 });

  const initial = hexToHsv(normalizeHex(value) ?? "#EF9C66") ?? {
    h: 24,
    s: 0.58,
    v: 0.94,
  };
  const [hsv, setHsv] = useState<HSV>(initial);
  const [hexDraft, setHexDraft] = useState(
    normalizeHex(value) ?? hsvToHex(initial.h, initial.s, initial.v),
  );
  hsvRef.current = hsv;

  // Sync from external hex (presets / typed hex) when not dragging.
  useEffect(() => {
    if (dragging.current) return;
    const normalized = normalizeHex(value);
    if (!normalized) return;
    setHexDraft(normalized);
    const next = hexToHsv(normalized);
    if (!next) return;
    setHsv((prev) =>
      Math.abs(prev.h - next.h) < 0.5 &&
      Math.abs(prev.s - next.s) < 0.01 &&
      Math.abs(prev.v - next.v) < 0.01
        ? prev
        : next,
    );
  }, [value]);

  const paintWheel = useCallback((v: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = ctx.createImageData(SIZE, SIZE);
    const data = image.data;
    const cx = RADIUS;
    const cy = RADIUS;

    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const dx = x - cx + 0.5;
        const dy = y - cy + 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const i = (y * SIZE + x) * 4;
        if (dist > RADIUS) {
          data[i + 3] = 0;
          continue;
        }
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        const s = Math.min(1, dist / RADIUS);
        const hex = hsvToHex(angle, s, v);
        data[i] = parseInt(hex.slice(1, 3), 16);
        data[i + 1] = parseInt(hex.slice(3, 5), 16);
        data[i + 2] = parseInt(hex.slice(5, 7), 16);
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, []);

  useEffect(() => {
    paintWheel(1);
  }, [paintWheel]);

  function emit(next: HSV) {
    setHsv(next);
    const hex = hsvToHex(next.h, next.s, next.v);
    if (hex === "#9747FF") return;
    setHexDraft(hex);
    onChange(hex);
  }

  function readWheel(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - RADIUS;
    const y = clientY - rect.top - RADIUS;
    const dist = Math.sqrt(x * x + y * y);
    const s = Math.min(1, dist / RADIUS);
    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    emit({ h: angle, s, v: hsvRef.current.v });
  }

  function onWheelPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    event.preventDefault();
    dragging.current = "wheel";
    event.currentTarget.setPointerCapture(event.pointerId);
    readWheel(event.clientX, event.clientY);
  }

  function onWheelPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (dragging.current !== "wheel") return;
    readWheel(event.clientX, event.clientY);
  }

  function onPointerUp() {
    dragging.current = null;
  }

  function onValuePointer(
    event: ReactPointerEvent<HTMLDivElement>,
    start = false,
  ) {
    if (disabled) return;
    if (start) {
      dragging.current = "value";
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (dragging.current !== "value" && !start) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    emit({ ...hsvRef.current, v: t });
  }

  const markerAngle = (hsv.h * Math.PI) / 180;
  const markerR = hsv.s * (RADIUS - 6);
  const markerX = RADIUS + Math.cos(markerAngle) * markerR;
  const markerY = RADIUS + Math.sin(markerAngle) * markerR;
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const valueEnd = hsvToHex(hsv.h, hsv.s, 1);

  return (
    <div className={styles.root} aria-label="Colour wheel">
      <div className={styles.wheelWrap}>
        <canvas
          ref={canvasRef}
          className={styles.wheel}
          width={SIZE}
          height={SIZE}
          onPointerDown={onWheelPointerDown}
          onPointerMove={onWheelPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <span
          className={styles.wheelMarker}
          style={{ left: markerX, top: markerY }}
          aria-hidden="true"
        />
      </div>

      <div
        className={styles.valueTrack}
        style={{
          background: `linear-gradient(to right, #000000, ${valueEnd})`,
        }}
        role="slider"
        aria-label="Brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.v * 100)}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={(e) => onValuePointer(e, true)}
        onPointerMove={(e) => onValuePointer(e)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            emit({ ...hsv, v: Math.max(0, hsv.v - 0.02) });
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            emit({ ...hsv, v: Math.min(1, hsv.v + 0.02) });
          }
        }}
      >
        <span
          className={styles.valueMarker}
          style={{ left: `${hsv.v * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <div className={styles.swatchRow}>
        <span
          className={styles.preview}
          style={{ background: currentHex }}
          aria-hidden="true"
        />
        <label className="visually-hidden" htmlFor={`${ids}-hex`}>
          Colour hex
        </label>
        <input
          id={`${ids}-hex`}
          className={styles.hexInput}
          value={hexDraft}
          onChange={(e) => {
            const raw = e.target.value;
            setHexDraft(raw);
            const next = normalizeHex(raw);
            if (next) onChange(next);
          }}
          onBlur={() => {
            const next = normalizeHex(hexDraft);
            setHexDraft(next ?? currentHex);
            if (next) onChange(next);
          }}
          spellCheck={false}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
