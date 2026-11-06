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
const MAX_GAZE = 4.2;

export default function MascotCharacter({ className = '' }: MascotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const eyesGazeRef = useRef<SVGGElement>(null);
  const faceGroupRef = useRef<SVGGElement>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });

  const [isBlinking, setIsBlinking] = useState(false);

  /* Pointer tracking (attentive cursor following, also while dragging tasks) */
  useEffect(() => {
    const track = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.42;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      // Follow cursor attentively: attentive gaze across the screen
      const intensity = Math.min(1, Math.max(0.45, dist / 180));
      const r = MAX_GAZE * intensity;
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

  /* Float, breathe, and highly attentive gaze loop — updates DOM directly without React re-renders */
  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gaze = { x: 0, y: 0 };
    const start = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const target = pointerTarget.current;
      // Responsive lerp (0.3) for eager, attentive cursor following
      gaze.x += (target.x - gaze.x) * 0.3;
      gaze.y += (target.y - gaze.y) * 0.3;

      eyesGazeRef.current?.setAttribute(
        'transform',
        `translate(${gaze.x.toFixed(2)} ${gaze.y.toFixed(2)})`
      );

      // Subtle face micro-tilt towards cursor for added attentiveness
      faceGroupRef.current?.setAttribute(
        'transform',
        `translate(${(gaze.x * 0.35).toFixed(2)} ${(gaze.y * 0.3).toFixed(2)})`
      );

      if (!reduceMotion) {
        const phase = (((now - start) / 1000) * Math.PI * 2) / 3.2;
        const float = Math.sin(phase) * 2.6;
        const breath = 1 + Math.cos(phase) * 0.018;
        const tilt = (gaze.x * 0.9).toFixed(2);
        if (floatRef.current) {
          floatRef.current.style.transform = `translate(${(gaze.x * 0.4).toFixed(2)}px, ${(float + gaze.y * 0.2).toFixed(2)}px) rotate(${tilt}deg) scale(${breath.toFixed(4)})`;
        }
        if (shadowRef.current) {
          shadowRef.current.setAttribute('rx', (15 - float * 0.7).toFixed(2));
          shadowRef.current.setAttribute('opacity', (0.14 + float * 0.015).toFixed(3));
          shadowRef.current.setAttribute('cx', (42 + gaze.x * 0.5).toFixed(2));
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
          timers.push(setTimeout(() => setIsBlinking(false), 130));
        }, after)
      );
    const schedule = () => {
      timers.push(
        setTimeout(() => {
          blinkOnce(0);
          if (Math.random() < 0.2) blinkOnce(240);
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
          {/* Body with scalloped hem - hands removed as requested */}
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

        {/* Face group with micro-movement */}
        <g ref={faceGroupRef}>
          {/* Cheeks */}
          <g opacity="0.4">
            <ellipse cx="24.5" cy="46.5" rx="3.8" ry="2.3" fill="#FDA4AF" />
            <ellipse cx="59.5" cy="46.5" rx="3.8" ry="2.3" fill="#FDA4AF" />
          </g>

          {/* Big attentive eyes with natural eyelid blink */}
          <g ref={eyesGazeRef}>
            {EYES.map((c, i) => (
              <g key={i} data-testid="ghost-eye" className="mascot-eye">
                {/* Open eye (pupil & sparkle highlights) */}
                <g
                  style={{
                    opacity: isBlinking ? 0 : 1,
                    transformOrigin: `${c.cx}px ${c.cy + 6}px`,
                    transform: isBlinking ? 'scaleY(0.08)' : 'scaleY(1)',
                    transition:
                      'opacity 75ms ease, transform 85ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <ellipse cx={c.cx} cy={c.cy} rx="6.2" ry="7.8" fill={INK} />
                  <circle cx={c.cx - 2.1} cy={c.cy - 2.9} r="2.2" fill="#FFFFFF" />
                  <circle cx={c.cx + 2.1} cy={c.cy + 3} r="1" fill="#FFFFFF" opacity="0.85" />
                </g>

                {/* Natural closed eyelid curved lash line when blinking */}
                <path
                  d={`M ${c.cx - 6} ${c.cy + 2.5} Q ${c.cx} ${c.cy + 5.8} ${c.cx + 6} ${c.cy + 2.5}`}
                  fill="none"
                  stroke={INK}
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    opacity: isBlinking ? 1 : 0,
                    transformOrigin: `${c.cx}px ${c.cy + 2.5}px`,
                    transform: isBlinking ? 'scale(1)' : 'scale(0.75)',
                    transition: 'opacity 60ms ease, transform 75ms ease',
                  }}
                />
              </g>
            ))}
          </g>

          {/* Calm, sweet smile */}
          <path
            data-testid="ghost-smile"
            d="M 39 47.5 Q 42 50.6 45 47.5"
            fill="none"
            stroke={INK}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
