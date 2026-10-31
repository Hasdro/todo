'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export type MascotEventType =
  | 'add'
  | 'complete'
  | 'uncomplete'
  | 'delete'
  | 'clear'
  | 'drop';

export interface MascotEvent {
  type: MascotEventType;
  /** Increment on every dispatch so repeated events of the same type still fire. */
  id: number;
}

export type MascotMood =
  | 'idle'
  | 'attentive'
  | 'happy'
  | 'proud'
  | 'surprised'
  | 'sad'
  | 'curious'
  | 'focused'
  | 'relieved';

interface MascotProps {
  className?: string;
  /** Latest user action; the ghost reacts with a short micro-expression. */
  event?: MascotEvent | null;
  /** User is typing a task: the ghost watches the input. */
  attentive?: boolean;
  /** A task is being dragged: the ghost concentrates. */
  dragging?: boolean;
}

/* ------------------------------------------------------------------ */
/* Expression definitions                                              */
/* ------------------------------------------------------------------ */

type MouthKey = 'smile' | 'grin' | 'o' | 'flat' | 'smirk' | 'sad' | 'soft';
type EyeKey = 'open' | 'happy' | 'closed';
type Extra = 'sparkles' | 'sweat' | 'sigh' | null;

interface Face {
  eyes: EyeKey;
  /** [scaleX, scaleY] for the left / right open eye */
  eyeL: [number, number];
  eyeR: [number, number];
  /** [translateY, rotateDeg] for each brow */
  browL: [number, number];
  browR: [number, number];
  browOpacity: number;
  mouth: MouthKey;
  blush: number;
  extra: Extra;
  /** Optional fixed gaze (overrides pointer tracking) */
  gaze?: { x: number; y: number };
}

const FACES: Record<MascotMood, Face> = {
  idle: {
    eyes: 'open', eyeL: [1, 1], eyeR: [1, 1],
    browL: [0, 0], browR: [0, 0], browOpacity: 0,
    mouth: 'smile', blush: 0.35, extra: null,
  },
  attentive: {
    eyes: 'open', eyeL: [1.06, 1.1], eyeR: [1.06, 1.1],
    browL: [-1.2, -4], browR: [-1.2, 4], browOpacity: 0.55,
    mouth: 'soft', blush: 0.4, extra: null,
    gaze: { x: -2.2, y: 0.9 },
  },
  happy: {
    eyes: 'happy', eyeL: [1, 1], eyeR: [1, 1],
    browL: [-1.5, -6], browR: [-1.5, 6], browOpacity: 0.5,
    mouth: 'grin', blush: 0.7, extra: null,
  },
  proud: {
    eyes: 'happy', eyeL: [1, 1], eyeR: [1, 1],
    browL: [-2, -8], browR: [-2, 8], browOpacity: 0.6,
    mouth: 'grin', blush: 0.75, extra: 'sparkles',
  },
  surprised: {
    eyes: 'open', eyeL: [1.18, 1.22], eyeR: [1.18, 1.22],
    browL: [-3.2, -4], browR: [-3.2, 4], browOpacity: 0.85,
    mouth: 'o', blush: 0.25, extra: 'sweat',
    gaze: { x: 0, y: 1.6 },
  },
  sad: {
    eyes: 'open', eyeL: [1, 0.86], eyeR: [1, 0.86],
    browL: [-1, -14], browR: [-1, 14], browOpacity: 0.8,
    mouth: 'sad', blush: 0.3, extra: 'sweat',
    gaze: { x: 0, y: 2 },
  },
  curious: {
    eyes: 'open', eyeL: [0.95, 0.82], eyeR: [1.08, 1.14],
    browL: [0.6, 8], browR: [-3, -6], browOpacity: 0.8,
    mouth: 'smirk', blush: 0.35, extra: null,
    gaze: { x: 1.6, y: 0.6 },
  },
  focused: {
    eyes: 'open', eyeL: [1, 0.62], eyeR: [1, 0.62],
    browL: [1, 12], browR: [1, -12], browOpacity: 0.85,
    mouth: 'flat', blush: 0.3, extra: null,
  },
  relieved: {
    eyes: 'closed', eyeL: [1, 1], eyeR: [1, 1],
    browL: [-1, -10], browR: [-1, 10], browOpacity: 0.55,
    mouth: 'soft', blush: 0.5, extra: 'sigh',
  },
};

type BodyMotion = 'hop' | 'wiggle' | 'flinch' | 'tilt' | 'rise' | 'settle';

interface Reaction {
  steps: { mood: MascotMood; ms: number }[];
  motion: BodyMotion;
  wave?: boolean;
}

const REACTIONS: Record<MascotEventType, Reaction> = {
  add: { steps: [{ mood: 'happy', ms: 1300 }], motion: 'hop', wave: true },
  complete: { steps: [{ mood: 'proud', ms: 1600 }], motion: 'wiggle', wave: true },
  uncomplete: { steps: [{ mood: 'curious', ms: 1400 }], motion: 'tilt' },
  delete: {
    steps: [
      { mood: 'surprised', ms: 420 },
      { mood: 'sad', ms: 950 },
    ],
    motion: 'flinch',
  },
  clear: {
    steps: [
      { mood: 'surprised', ms: 320 },
      { mood: 'relieved', ms: 1500 },
    ],
    motion: 'rise',
  },
  drop: { steps: [{ mood: 'happy', ms: 900 }], motion: 'settle' },
};

const MOTIONS: Record<BodyMotion, { frames: Keyframe[]; duration: number }> = {
  hop: {
    duration: 620,
    frames: [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(1px) scale(1.06, 0.92)', offset: 0.15 },
      { transform: 'translateY(-8px) scale(0.96, 1.05)', offset: 0.45 },
      { transform: 'translateY(0) scale(1.04, 0.96)', offset: 0.75 },
      { transform: 'translateY(0) scale(1, 1)' },
    ],
  },
  wiggle: {
    duration: 760,
    frames: [
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: 'translateY(-6px) rotate(-9deg)', offset: 0.25 },
      { transform: 'translateY(-6px) rotate(9deg)', offset: 0.5 },
      { transform: 'translateY(-2px) rotate(-4deg)', offset: 0.75 },
      { transform: 'translateY(0) rotate(0deg)' },
    ],
  },
  flinch: {
    duration: 480,
    frames: [
      { transform: 'translateX(0) scale(1)' },
      { transform: 'translateX(3px) scale(0.93)', offset: 0.2 },
      { transform: 'translateX(-2px) scale(0.97)', offset: 0.5 },
      { transform: 'translateX(1px) scale(0.99)', offset: 0.75 },
      { transform: 'translateX(0) scale(1)' },
    ],
  },
  tilt: {
    duration: 900,
    frames: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-10deg)', offset: 0.3 },
      { transform: 'rotate(-10deg)', offset: 0.7 },
      { transform: 'rotate(0deg)' },
    ],
  },
  rise: {
    duration: 1100,
    frames: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(2px) scale(1.04, 0.95)', offset: 0.2 },
      { transform: 'translateY(-5px) scale(1)', offset: 0.6 },
      { transform: 'translateY(0) scale(1)' },
    ],
  },
  settle: {
    duration: 420,
    frames: [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.07, 0.92)', offset: 0.35 },
      { transform: 'scale(0.98, 1.03)', offset: 0.7 },
      { transform: 'scale(1, 1)' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const INK = '#1E1B4B';
const EYE_L = { cx: 33.5, cy: 37 };
const EYE_R = { cx: 50.5, cy: 37 };
const MAX_GAZE = 2.3;

const MOUTHS: Record<MouthKey, React.ReactNode> = {
  smile: <path d="M 39 45.5 Q 42 48.6 45 45.5" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />,
  soft: <path d="M 39.6 46 Q 42 47.8 44.4 46" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />,
  grin: (
    <g>
      <path d="M 38.2 45 Q 42 52 45.8 45 Z" fill={INK} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx="42" cy="47.6" rx="1.6" ry="0.8" fill="#FB7185" />
    </g>
  ),
  o: <ellipse cx="42" cy="47" rx="1.9" ry="2.4" fill={INK} />,
  flat: <path d="M 39.6 46.6 L 44.4 46.6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />,
  smirk: <path d="M 39.4 47 Q 42.6 47.9 45 45.6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />,
  sad: <path d="M 39.4 47.8 Q 42 45.4 44.6 47.8" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />,
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MascotCharacter({
  className = '',
  event = null,
  attentive = false,
  dragging = false,
}: MascotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const eyesGazeRef = useRef<SVGGElement>(null);
  const armRef = useRef<SVGPathElement>(null);

  const pointerTarget = useRef({ x: 0, y: 0 });
  const gazeOverride = useRef<{ x: number; y: number } | null>(null);

  const [eventMood, setEventMood] = useState<MascotMood | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  const baseMood: MascotMood = dragging ? 'focused' : attentive ? 'attentive' : 'idle';
  const mood: MascotMood = eventMood ?? baseMood;
  const face = FACES[mood];

  // Keep the per-frame loop informed about fixed gaze without re-subscribing
  useEffect(() => {
    gazeOverride.current = face.gaze ?? null;
  }, [face]);

  /* ---------------- Pointer tracking (also during drag & drop) ---------------- */
  useEffect(() => {
    const track = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height * 0.44);
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const r = Math.min(MAX_GAZE, dist / 40);
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

  /* ---------------- Animation loop: float, breathe, gaze (no React re-renders) ---------------- */
  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gaze = { x: 0, y: 0 };
    const start = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const target = gazeOverride.current ?? pointerTarget.current;
      gaze.x += (target.x - gaze.x) * 0.16;
      gaze.y += (target.y - gaze.y) * 0.16;
      eyesGazeRef.current?.setAttribute(
        'transform',
        `translate(${gaze.x.toFixed(2)} ${gaze.y.toFixed(2)})`
      );

      if (!reduceMotion) {
        const t = (now - start) / 1000;
        const phase = (t * Math.PI * 2) / 3.2;
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

  /* ---------------- Natural blinking (sometimes a double blink) ---------------- */
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

  /* ---------------- React to user actions ---------------- */
  useEffect(() => {
    if (!event) return;
    const reaction = REACTIONS[event.type];
    if (!reaction) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 0;
    for (const step of reaction.steps) {
      timers.push(setTimeout(() => setEventMood(step.mood), at));
      at += step.ms;
    }
    timers.push(setTimeout(() => setEventMood(null), at));

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animations: Animation[] = [];
    if (!reduceMotion) {
      const body = motionRef.current;
      if (body && typeof body.animate === 'function') {
        const m = MOTIONS[reaction.motion];
        animations.push(
          body.animate(m.frames, {
            duration: m.duration,
            easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
          })
        );
      }
      const arm = armRef.current;
      if (reaction.wave && arm && typeof arm.animate === 'function') {
        animations.push(
          arm.animate(
            [
              { transform: 'rotate(0deg)' },
              { transform: 'rotate(-38deg)', offset: 0.25 },
              { transform: 'rotate(-12deg)', offset: 0.5 },
              { transform: 'rotate(-38deg)', offset: 0.75 },
              { transform: 'rotate(0deg)' },
            ],
            { duration: 820, easing: 'ease-in-out' }
          )
        );
      }
    }

    return () => {
      timers.forEach(clearTimeout);
      animations.forEach((a) => a.cancel());
    };
  }, [event]);

  const eyesOpen = face.eyes === 'open';
  const blinkScale = isBlinking ? 0.08 : 1;

  return (
    <div
      ref={floatRef}
      className={`relative inline-flex items-center justify-center select-none pointer-events-none will-change-transform ${className}`}
      data-mood={mood}
      aria-hidden="true"
    >
      <div ref={motionRef} className="mascot-motion">
        <svg
          ref={svgRef}
          viewBox="0 0 84 84"
          className="w-16 h-16 sm:w-18 sm:h-18 overflow-visible"
        >
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
            {/* Arms (behind body) */}
            <path
              d="M 20 44 C 12.5 44.5, 11.5 51, 16 53 C 19 54.2, 21 50.5, 20.5 46.5 Z"
              fill="url(#ghostBodyGrad)"
              stroke="#C7D2FE"
              strokeWidth="1"
            />
            <path
              ref={armRef}
              className="mascot-arm"
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
          <ellipse cx="33" cy="22" rx="12" ry="8" fill="url(#ghostSheen)" transform="rotate(-18 33 22)" />

          {/* Cheeks */}
          <g className="mascot-part" style={{ opacity: face.blush }}>
            <ellipse cx="25.5" cy="44.5" rx="4" ry="2.4" fill="#FDA4AF" />
            <ellipse cx="58.5" cy="44.5" rx="4" ry="2.4" fill="#FDA4AF" />
          </g>

          {/* Brows */}
          <g style={{ opacity: face.browOpacity }} className="mascot-part">
            <path
              data-testid="ghost-brow-left"
              className="mascot-part"
              d="M 30 27.5 Q 33.5 26.2 37 27.5"
              fill="none"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinecap="round"
              style={{ transform: `translateY(${face.browL[0]}px) rotate(${face.browL[1]}deg)` }}
            />
            <path
              data-testid="ghost-brow-right"
              className="mascot-part"
              d="M 47 27.5 Q 50.5 26.2 54 27.5"
              fill="none"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinecap="round"
              style={{ transform: `translateY(${face.browR[0]}px) rotate(${face.browR[1]}deg)` }}
            />
          </g>

          {/* Eyes */}
          <g ref={eyesGazeRef}>
            {/* Open eyes */}
            <g className="mascot-part" style={{ opacity: eyesOpen ? 1 : 0 }} data-testid="ghost-eyes-open">
              {[{ c: EYE_L, s: face.eyeL }, { c: EYE_R, s: face.eyeR }].map(({ c, s }, i) => (
                <g
                  key={i}
                  className={`mascot-part ${isBlinking ? 'mascot-blink' : ''}`}
                  style={{ transform: `scale(${s[0]}, ${s[1] * blinkScale})` }}
                >
                  <ellipse cx={c.cx} cy={c.cy} rx="4.4" ry="5.6" fill={INK} />
                  <circle cx={c.cx - 1.5} cy={c.cy - 2} r="1.5" fill="#FFFFFF" />
                  <circle cx={c.cx + 1.4} cy={c.cy + 2.1} r="0.7" fill="#FFFFFF" opacity="0.85" />
                </g>
              ))}
            </g>

            {/* Happy eyes ^ ^ */}
            <g className="mascot-part" style={{ opacity: face.eyes === 'happy' ? 1 : 0 }}>
              {[EYE_L, EYE_R].map((c, i) => (
                <path
                  key={i}
                  d={`M ${c.cx - 4} ${c.cy + 1.5} Q ${c.cx} ${c.cy - 5} ${c.cx + 4} ${c.cy + 1.5}`}
                  fill="none"
                  stroke={INK}
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              ))}
            </g>

            {/* Peacefully closed eyes */}
            <g className="mascot-part" style={{ opacity: face.eyes === 'closed' ? 1 : 0 }}>
              {[EYE_L, EYE_R].map((c, i) => (
                <path
                  key={i}
                  d={`M ${c.cx - 4} ${c.cy} Q ${c.cx} ${c.cy + 3.4} ${c.cx + 4} ${c.cy}`}
                  fill="none"
                  stroke={INK}
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
              ))}
            </g>
          </g>

          {/* Mouth (cross-fade between shapes) */}
          <g data-testid="ghost-mouth" data-mouth={face.mouth}>
            {(Object.keys(MOUTHS) as MouthKey[]).map((key) => (
              <g
                key={key}
                className="mascot-part"
                style={{
                  opacity: face.mouth === key ? 1 : 0,
                  transform: `scale(${face.mouth === key ? 1 : 0.7})`,
                }}
              >
                {MOUTHS[key]}
              </g>
            ))}
          </g>

          {/* Extras (remount per event to replay) */}
          {face.extra === 'sparkles' && (
            <g key={`sparkle-${event?.id}`} fill="#FBBF24">
              {[
                { x: 14, y: 20, s: 1, d: 0 },
                { x: 70, y: 16, s: 1.25, d: 90 },
                { x: 73, y: 33, s: 0.8, d: 180 },
              ].map((p, i) => (
                <path
                  key={i}
                  className="mascot-sparkle"
                  style={{ animationDelay: `${p.d}ms` }}
                  transform={`translate(${p.x} ${p.y}) scale(${p.s})`}
                  d="M 0 -4 Q 0.6 -0.6 4 0 Q 0.6 0.6 0 4 Q -0.6 0.6 -4 0 Q -0.6 -0.6 0 -4 Z"
                />
              ))}
            </g>
          )}
          {face.extra === 'sweat' && (
            <path
              key={`sweat-${event?.id}`}
              className="mascot-sweat"
              d="M 61 22 C 61 22, 57.8 26.2, 57.8 28 A 3.2 3.2 0 0 0 64.2 28 C 64.2 26.2, 61 22, 61 22 Z"
              fill="#BFDBFE"
              stroke="#93C5FD"
              strokeWidth="0.8"
            />
          )}
          {face.extra === 'sigh' && (
            <g key={`sigh-${event?.id}`} fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="0.6">
              <circle className="mascot-sigh" cx="49" cy="49" r="1.8" />
              <circle className="mascot-sigh" style={{ animationDelay: '120ms' }} cx="53" cy="47" r="2.4" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
