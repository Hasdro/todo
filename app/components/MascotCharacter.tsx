'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MascotProps {
  className?: string;
}

const INK = '#1E1B4B';
const EYES = [
  { cx: 32.5, cy: 35 },
  { cx: 51.5, cy: 35 },
];
const MAX_GAZE = 2.4;

export default function MascotCharacter({ className = '' }: MascotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const eyesGazeRef = useRef<SVGGElement>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });

  const [isBlinking, setIsBlinking] = useState(false);

  /* Pointer tracking (also while dragging tasks) */
  useEffect(() => {
    const track = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height * 0.42);
      const angle = Math.atan2(dy, dx);
      const r = Math.min(MAX_GAZE, Math.hypot(dx, dy) / 40);
      pointerTarget.current = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    };
    const onPointer = (e: PointerEvent) => track(e.clientX, e.clientY);
    const onDrag = (e: DragEvent) => track(e.clientX, e.clientY);

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('dragover', onDrag, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('dragover', onDrag);
    };
  }, []);

  /* Float, breathe and gaze loop — updates the DOM directly, no re-renders */
  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gaze = { x: 0, y: 0 };
    const start = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const target = pointerTarget.current;
      gaze.x += (target.x - gaze.x) * 0.16;
      gaze.y += (target.y - gaze.y) * 0.16;
      eyesGazeRef.current?.setAttribute(
        'transform',
        `translate(${gaze.x.toFixed(2)} ${gaze.y.toFixed(2)})`
      );

      if (!reduceMotion) {
        const phase = (((now - start) / 1000) * Math.PI * 2) / 3.2;
        const float = Math.sin(phase) * 2.6;
        const breath = 1 + Math.cos(phase) * 0.018;
        if (floatRef.current) {
          floatRef.current.style.transform = `translateY(${float.toFixed(2)}px) scale(${breath.toFixed(4)})`;
        }
        if (shadowRef.current) {
          shadowRef.current.setAttribute('rx', (15 - float * 0.7).toFixed(2));
          shadowRef.current.setAttribute('opacity', (0.14 + float * 0.015).toFixed(3));
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Natural blinking (sometimes a double blink) */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const blinkOnce = (after: number) =>
      timers.push(
        setTimeout(() => {
          setIsBlinking(true);
          timers.push(setTimeout(() => setIsBlinking(false), 120));
        }, after)
      );
    const schedule = () => {
      timers.push(
        setTimeout(() => {
          blinkOnce(0);
          if (Math.random() < 0.22) blinkOnce(260);
          schedule();
        }, 2800 + Math.random() * 3200)
      );
    };
    schedule();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      ref={floatRef}
      className={`relative inline-flex items-center justify-center select-none pointer-events-none will-change-transform ${className}`}
      aria-hidden="true"
    >
      <svg ref={svgRef} viewBox="0 0 84 84" className="w-16 h-16 sm:w-18 sm:h-18 overflow-visible">
        <defs>
          <linearGradient id="ghostBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F5F7FF" />
            <stop offset="100%" stopColor="#DDE3FF" />
          </linearGradient>
          <radialGradient id="ghostSheen" cx="0.32" cy="0.22" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <filter id="ghostShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.4" floodColor="#4F46E5" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse ref={shadowRef} cx="42" cy="79" rx="15" ry="2.6" fill="#6366F1" opacity="0.14" />

        <g filter="url(#ghostShadow)">
          {/* Arms */}
          <path
            d="M 20 44 C 12.5 44.5, 11.5 51, 16 53 C 19 54.2, 21 50.5, 20.5 46.5 Z"
            fill="url(#ghostBodyGrad)"
            stroke="#C7D2FE"
            strokeWidth="1"
          />
          <path
            d="M 64 44 C 71.5 44.5, 72.5 51, 68 53 C 65 54.2, 63 50.5, 63.5 46.5 Z"
            fill="url(#ghostBodyGrad)"
            stroke="#C7D2FE"
            strokeWidth="1"
          />

          {/* Body with scalloped hem */}
          <path
            data-testid="ghost-body"
            d="M 18 42
               C 18 4, 66 4, 66 42
               L 66 62
               Q 60 71 54 64
               Q 48 71 42 64
               Q 36 71 30 64
               Q 24 71 18 62
               Z"
            fill="url(#ghostBodyGrad)"
            stroke="#C7D2FE"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>

        {/* Soft sheen */}
        <ellipse cx="33" cy="21" rx="11" ry="7" fill="url(#ghostSheen)" transform="rotate(-18 33 21)" />

        {/* Cheeks */}
        <g opacity="0.4">
          <ellipse cx="24.5" cy="46.5" rx="3.8" ry="2.3" fill="#FDA4AF" />
          <ellipse cx="59.5" cy="46.5" rx="3.8" ry="2.3" fill="#FDA4AF" />
        </g>

        {/* Big eyes */}
        <g ref={eyesGazeRef}>
          {EYES.map((c, i) => (
            <g
              key={i}
              data-testid="ghost-eye"
              className={`mascot-eye ${isBlinking ? 'mascot-blink' : ''}`}
              style={{ transform: `scaleY(${isBlinking ? 0.08 : 1})` }}
            >
              <ellipse cx={c.cx} cy={c.cy} rx="6.2" ry="7.8" fill={INK} />
              <circle cx={c.cx - 2.1} cy={c.cy - 2.9} r="2.2" fill="#FFFFFF" />
              <circle cx={c.cx + 2.1} cy={c.cy + 3} r="1" fill="#FFFFFF" opacity="0.85" />
            </g>
          ))}
        </g>

        {/* Smile */}
        <path
          data-testid="ghost-smile"
          d="M 39 47.5 Q 42 50.6 45 47.5"
          fill="none"
          stroke={INK}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
