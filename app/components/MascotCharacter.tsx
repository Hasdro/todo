'use client';

import React, { useEffect, useRef, useState } from 'react';

export type MascotMood = 'idle' | 'adding' | 'completing' | 'deleting' | 'reordering';

interface MascotProps {
  mood?: MascotMood;
  className?: string;
}

export default function MascotCharacter({ mood = 'idle', className = '' }: MascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);

  // Target and current pupil offsets for smooth interpolation (rossark motion)
  const targetPos = useRef({ lx: 0, ly: 0, rx: 0, ry: 0 });
  const currentPos = useRef({ lx: 0, ly: 0, rx: 0, ry: 0 });
  const [pupils, setPupils] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 });

  // Blinking state
  const [isBlinking, setIsBlinking] = useState(false);

  // Gentle breathing offset
  const [breathPhase, setBreathPhase] = useState(0);

  // Mouse / cursor tracking
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const calcEyeOffset = (eyeEl: SVGGElement | null) => {
        if (!eyeEl) return { x: 0, y: 0 };
        const rect = eyeEl.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;

        const dx = e.clientX - eyeCenterX;
        const dy = e.clientY - eyeCenterY;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Max movement radius inside eye
        const maxRadius = 4.8;
        // Natural scaling: closer mouse = closer to edge, far mouse = edge
        const radius = Math.min(maxRadius, distance / 40);

        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      };

      const leftOffset = calcEyeOffset(leftEyeRef.current);
      const rightOffset = calcEyeOffset(rightEyeRef.current);

      targetPos.current = {
        lx: leftOffset.x,
        ly: leftOffset.y,
        rx: rightOffset.x,
        ry: rightOffset.y,
      };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Smooth lerp frame loop + breathing cycle
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();

    const loop = (now: number) => {
      // Lerp pupil positions at ~18% per frame for smooth organic eye glide
      currentPos.current.lx += (targetPos.current.lx - currentPos.current.lx) * 0.18;
      currentPos.current.ly += (targetPos.current.ly - currentPos.current.ly) * 0.18;
      currentPos.current.rx += (targetPos.current.rx - currentPos.current.rx) * 0.18;
      currentPos.current.ry += (targetPos.current.ry - currentPos.current.ry) * 0.18;

      setPupils({
        lx: currentPos.current.lx,
        ly: currentPos.current.ly,
        rx: currentPos.current.rx,
        ry: currentPos.current.ry,
      });

      // Subtle breathing phase: 3-second cycle
      const elapsed = (now - startTime) / 1000;
      setBreathPhase(Math.sin((elapsed * Math.PI * 2) / 3));

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Periodic natural blinking (only when not in an action expression)
  useEffect(() => {
    if (mood !== 'idle') return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const delay = 2800 + Math.random() * 2200; // blink every 2.8s - 5.0s
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160); // 160ms blink duration
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, [mood]);

  // Breathing & Mood transforms
  const breathingScaleY = 1 + breathPhase * 0.025;
  const breathingTranslateY = breathPhase * -1.2;

  // Mood-specific styles and transforms
  let moodTransform = '';
  if (mood === 'adding') {
    moodTransform = 'animate-bounce';
  } else if (mood === 'deleting') {
    moodTransform = 'scale-90 rotate-[-4deg] transition-transform duration-200';
  } else if (mood === 'completing') {
    moodTransform = 'scale-105 rotate-[3deg] transition-transform duration-200';
  } else if (mood === 'reordering') {
    moodTransform = 'rotate-[-8deg] translate-y-[-2px] transition-transform duration-200';
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        transform: `translateY(${breathingTranslateY}px) scaleY(${breathingScaleY})`,
      }}
      aria-hidden="true"
    >
      <div className={`transition-all duration-300 ease-out ${moodTransform}`}>
        <svg
          viewBox="0 0 84 80"
          className="w-12 h-12 sm:w-14 sm:h-14 overflow-visible drop-shadow-sm"
        >
          <defs>
            {/* Cute light pastel gradient body */}
            <linearGradient id="mascotBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF5" />
              <stop offset="60%" stopColor="#FFF0D0" />
              <stop offset="100%" stopColor="#FFE4B5" />
            </linearGradient>

            {/* Inner ear gradient */}
            <linearGradient id="innerEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD1DC" />
              <stop offset="100%" stopColor="#FFAAA6" />
            </linearGradient>

            {/* Eye clip paths to keep pupils inside */}
            <clipPath id="leftEyeClip">
              <ellipse cx="28" cy="40" rx="9.5" ry="12" />
            </clipPath>
            <clipPath id="rightEyeClip">
              <ellipse cx="56" cy="40" rx="9.5" ry="12" />
            </clipPath>
          </defs>

          {/* Left Ear */}
          <ellipse
            cx="22"
            cy="18"
            rx="7"
            ry="11"
            transform="rotate(-18 22 18)"
            fill="#FFF0D0"
            stroke="#E0CDA9"
            strokeWidth="1.5"
          />
          <ellipse
            cx="22"
            cy="19"
            rx="3.5"
            ry="6"
            transform="rotate(-18 22 19)"
            fill="url(#innerEarGrad)"
          />

          {/* Right Ear */}
          <ellipse
            cx="62"
            cy="18"
            rx="7"
            ry="11"
            transform="rotate(18 62 18)"
            fill="#FFF0D0"
            stroke="#E0CDA9"
            strokeWidth="1.5"
          />
          <ellipse
            cx="62"
            cy="19"
            rx="3.5"
            ry="6"
            transform="rotate(18 62 19)"
            fill="url(#innerEarGrad)"
          />

          {/* Main Chubby Body */}
          <path
            d="M 16 46 C 14 26, 70 26, 68 46 C 70 68, 14 68, 16 46 Z"
            fill="url(#mascotBodyGrad)"
            stroke="#E2D0AC"
            strokeWidth="1.8"
          />

          {/* Rosy Glowing Cheeks */}
          <ellipse
            cx="19"
            cy="47"
            rx="5.5"
            ry="3.5"
            fill="#FF85A2"
            opacity={mood === 'adding' || mood === 'completing' ? 0.85 : 0.45}
            className="transition-opacity duration-300"
          />
          <ellipse
            cx="65"
            cy="47"
            rx="5.5"
            ry="3.5"
            fill="#FF85A2"
            opacity={mood === 'adding' || mood === 'completing' ? 0.85 : 0.45}
            className="transition-opacity duration-300"
          />

          {/* ================= EYES ================= */}
          {/* Mood: Adding / Celebration -> Happy Arcs (^ ^) */}
          {mood === 'adding' ? (
            <g>
              <path
                d="M 20 42 Q 28 30 36 42"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 48 42 Q 56 30 64 42"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Little celebration star above */}
              <path
                d="M 42 16 L 43.5 20 L 47 21 L 43.5 22 L 42 26 L 40.5 22 L 37 21 L 40.5 20 Z"
                fill="#FBBF24"
              />
            </g>
          ) : mood === 'completing' ? (
            /* Mood: Completing -> Wink & Star (^ ~) */
            <g>
              {/* Left Eye: Happy Wink Arc */}
              <path
                d="M 20 41 Q 28 32 36 41"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Right Eye: Starry Proud Open Eye */}
              <ellipse
                cx="56"
                cy="40"
                rx="9.5"
                ry="12"
                fill="#FFFFFF"
                stroke="#E2D0AC"
                strokeWidth="1.2"
              />
              <g clipPath="url(#rightEyeClip)">
                <circle cx="56" cy="40" r="7" fill="#1E293B" />
                {/* Cute star in eye */}
                <path
                  d="M 56 36 L 57 39 L 60 40 L 57 41 L 56 44 L 55 41 L 52 40 L 55 39 Z"
                  fill="#FDE047"
                />
              </g>
            </g>
          ) : mood === 'deleting' ? (
            /* Mood: Deleting -> Shocked round O-eyes with tiny pupils */
            <g>
              <ellipse
                cx="28"
                cy="40"
                rx="10"
                ry="12"
                fill="#FFFFFF"
                stroke="#E2D0AC"
                strokeWidth="1.2"
              />
              <ellipse
                cx="56"
                cy="40"
                rx="10"
                ry="12"
                fill="#FFFFFF"
                stroke="#E2D0AC"
                strokeWidth="1.2"
              />
              {/* Tiny shocked pupils */}
              <circle cx="28" cy="40" r="3.2" fill="#1E293B" />
              <circle cx="56" cy="40" r="3.2" fill="#1E293B" />
            </g>
          ) : isBlinking ? (
            /* Natural Blinking Lines */
            <g>
              <path
                d="M 20 40 Q 28 43 36 40"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 48 40 Q 56 43 64 40"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>
          ) : (
            /* Default / Reordering: Big Cute Glossy Eyes with Smooth Tracking */
            <g>
              {/* Left Eye */}
              <g ref={leftEyeRef}>
                <ellipse
                  cx="28"
                  cy="40"
                  rx="9.5"
                  ry="12"
                  fill="#FFFFFF"
                  stroke="#E2D0AC"
                  strokeWidth="1.2"
                />
                <g clipPath="url(#leftEyeClip)">
                  {/* Pupil Group moving with cursor offset */}
                  <g transform={`translate(${pupils.lx}, ${pupils.ly})`}>
                    <circle cx="28" cy="40" r="6.2" fill="#1E293B" />
                    {/* Iris bottom reflection tint */}
                    <ellipse cx="28" cy="43.5" rx="3.5" ry="1.8" fill="#60A5FA" opacity="0.65" />
                    {/* Big glossy catchlight */}
                    <circle cx="25.5" cy="37.5" r="2.2" fill="#FFFFFF" />
                    {/* Tiny bottom catchlight */}
                    <circle cx="30" cy="42" r="1.1" fill="#FFFFFF" />
                  </g>
                </g>
              </g>

              {/* Right Eye */}
              <g ref={rightEyeRef}>
                <ellipse
                  cx="56"
                  cy="40"
                  rx="9.5"
                  ry="12"
                  fill="#FFFFFF"
                  stroke="#E2D0AC"
                  strokeWidth="1.2"
                />
                <g clipPath="url(#rightEyeClip)">
                  {/* Pupil Group moving with cursor offset */}
                  <g transform={`translate(${pupils.rx}, ${pupils.ry})`}>
                    <circle cx="56" cy="40" r="6.2" fill="#1E293B" />
                    {/* Iris bottom reflection tint */}
                    <ellipse cx="56" cy="43.5" rx="3.5" ry="1.8" fill="#60A5FA" opacity="0.65" />
                    {/* Big glossy catchlight */}
                    <circle cx="53.5" cy="37.5" r="2.2" fill="#FFFFFF" />
                    {/* Tiny bottom catchlight */}
                    <circle cx="58" cy="42" r="1.1" fill="#FFFFFF" />
                  </g>
                </g>
              </g>
            </g>
          )}

          {/* ================= MOUTH ================= */}
          {mood === 'adding' ? (
            /* Open laughing smile */
            <path
              d="M 37 49 Q 42 58 47 49 Z"
              fill="#E11D48"
              stroke="#2B2D42"
              strokeWidth="1.6"
            />
          ) : mood === 'completing' ? (
            /* Proud happy curved grin */
            <path
              d="M 36 49 Q 42 55 48 49"
              fill="none"
              stroke="#2B2D42"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ) : mood === 'deleting' ? (
            /* Small round surprised O-mouth */
            <ellipse
              cx="42"
              cy="52"
              rx="3"
              ry="4.5"
              fill="#2B2D42"
            />
          ) : mood === 'reordering' ? (
            /* Playful curious open mouth with tongue peek */
            <g>
              <path
                d="M 38 49 Q 42 55 46 49"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 40.5 51 Q 42 55 43.5 51"
                fill="#FB7185"
              />
            </g>
          ) : (
            /* Default cute subtle kitty smile */
            <path
              d="M 37 50 Q 39.5 52.5 42 50.5 Q 44.5 52.5 47 50"
              fill="none"
              stroke="#475569"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}

          {/* Tiny Little Cute Hands at the bottom */}
          <ellipse cx="27" cy="62" rx="4.5" ry="3.5" fill="#FFF0D0" stroke="#E2D0AC" strokeWidth="1.2" />
          <ellipse cx="57" cy="62" rx="4.5" ry="3.5" fill="#FFF0D0" stroke="#E2D0AC" strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}
