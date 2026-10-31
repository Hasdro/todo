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

  // Mouse / cursor tracking with trigonometry
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
        const maxRadius = 4.6;
        // Natural scaling: closer mouse = closer to edge, far mouse = edge
        const radius = Math.min(maxRadius, distance / 38);

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
          viewBox="0 0 84 84"
          className="w-12 h-12 sm:w-14 sm:h-14 overflow-visible drop-shadow-sm"
        >
          <defs>
            {/* Soft, light 3D spherical gradient for circular character */}
            <radialGradient id="mascotCircleGrad" cx="35%" cy="30%" r="68%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="42%" stopColor="#FFFDF7" />
              <stop offset="78%" stopColor="#FEF0D8" />
              <stop offset="100%" stopColor="#FCE3C0" />
            </radialGradient>

            {/* Eye clip paths to keep pupils cleanly inside */}
            <clipPath id="leftEyeClip">
              <ellipse cx="29" cy="40" rx="9.5" ry="12.5" />
            </clipPath>
            <clipPath id="rightEyeClip">
              <ellipse cx="55" cy="40" rx="9.5" ry="12.5" />
            </clipPath>
          </defs>

          {/* Soft ambient ground shadow */}
          <ellipse cx="42" cy="75" rx="20" ry="4" fill="#000000" opacity="0.08" />

          {/* Main Circular Character Body */}
          <circle
            cx="42"
            cy="42"
            r="32"
            fill="url(#mascotCircleGrad)"
            stroke="#EBDAC2"
            strokeWidth="1.8"
          />

          {/* Subtle glossy 3D highlight arc on upper-left */}
          <ellipse
            cx="33"
            cy="24"
            rx="13"
            ry="6.5"
            fill="#FFFFFF"
            opacity="0.45"
            transform="rotate(-22 33 24)"
          />

          {/* Rosy Glowing Cheeks */}
          <ellipse
            cx="18"
            cy="48"
            rx="5.5"
            ry="3.5"
            fill="#FF85A2"
            opacity={mood === 'adding' || mood === 'completing' ? 0.85 : 0.45}
            className="transition-opacity duration-300"
          />
          <ellipse
            cx="66"
            cy="48"
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
                d="M 20 42 Q 29 29 38 42"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 46 42 Q 55 29 64 42"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Little celebration star above */}
              <path
                className="star-sparkle"
                d="M 42 12 L 43.5 16 L 47 17 L 43.5 18 L 42 22 L 40.5 18 L 37 17 L 40.5 16 Z"
                fill="#FBBF24"
              />
            </g>
          ) : mood === 'completing' ? (
            /* Mood: Completing -> Celebratory Wink & Star (^ ~) */
            <g>
              {/* Left Eye: Happy Wink Arc */}
              <path
                d="M 20 41 Q 29 31 38 41"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Right Eye: Starry Proud Open Eye */}
              <ellipse
                cx="55"
                cy="40"
                rx="9.5"
                ry="12.5"
                fill="#FFFFFF"
                stroke="#EBDAC2"
                strokeWidth="1.2"
              />
              <g clipPath="url(#rightEyeClip)">
                <circle cx="55" cy="40" r="7.2" fill="#1E2337" />
                {/* Celebratory yellow star inside eye */}
                <path
                  className="eye-star"
                  d="M 55 36 L 56 39 L 59 40 L 56 41 L 55 44 L 54 41 L 51 40 L 54 39 Z"
                  fill="#FDE047"
                />
              </g>
            </g>
          ) : mood === 'deleting' ? (
            /* Mood: Deleting -> Shocked round O-eyes with tiny pupils */
            <g>
              <ellipse
                cx="29"
                cy="40"
                rx="10"
                ry="12.5"
                fill="#FFFFFF"
                stroke="#EBDAC2"
                strokeWidth="1.2"
              />
              <ellipse
                cx="55"
                cy="40"
                rx="10"
                ry="12.5"
                fill="#FFFFFF"
                stroke="#EBDAC2"
                strokeWidth="1.2"
              />
              {/* Tiny shocked pupils */}
              <circle cx="29" cy="40" r="3.2" fill="#1E2337" />
              <circle cx="55" cy="40" r="3.2" fill="#1E2337" />
            </g>
          ) : isBlinking ? (
            /* Natural Blinking Lines */
            <g>
              <path
                d="M 20 40 Q 29 43 38 40"
                fill="none"
                stroke="#2B2D42"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 46 40 Q 55 43 64 40"
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
                  cx="29"
                  cy="40"
                  rx="9.5"
                  ry="12.5"
                  fill="#FFFFFF"
                  stroke="#EBDAC2"
                  strokeWidth="1.2"
                />
                <g clipPath="url(#leftEyeClip)">
                  {/* Pupil Group moving with cursor offset */}
                  <g transform={`translate(${pupils.lx}, ${pupils.ly})`}>
                    <circle cx="29" cy="40" r="6.6" fill="#1E2337" />
                    {/* Iris bottom reflection tint */}
                    <ellipse cx="29" cy="43.8" rx="3.6" ry="1.9" fill="#38BDF8" opacity="0.75" />
                    {/* Big glossy catchlight */}
                    <circle cx="26.5" cy="37.2" r="2.3" fill="#FFFFFF" />
                    {/* Tiny bottom catchlight */}
                    <circle cx="31.2" cy="42" r="1.1" fill="#FFFFFF" />
                  </g>
                </g>
              </g>

              {/* Right Eye */}
              <g ref={rightEyeRef}>
                <ellipse
                  cx="55"
                  cy="40"
                  rx="9.5"
                  ry="12.5"
                  fill="#FFFFFF"
                  stroke="#EBDAC2"
                  strokeWidth="1.2"
                />
                <g clipPath="url(#rightEyeClip)">
                  {/* Pupil Group moving with cursor offset */}
                  <g transform={`translate(${pupils.rx}, ${pupils.ry})`}>
                    <circle cx="55" cy="40" r="6.6" fill="#1E2337" />
                    {/* Iris bottom reflection tint */}
                    <ellipse cx="55" cy="43.8" rx="3.6" ry="1.9" fill="#38BDF8" opacity="0.75" />
                    {/* Big glossy catchlight */}
                    <circle cx="52.5" cy="37.2" r="2.3" fill="#FFFFFF" />
                    {/* Tiny bottom catchlight */}
                    <circle cx="57.2" cy="42" r="1.1" fill="#FFFFFF" />
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
              d="M 36 49 Q 42 56 48 49"
              fill="none"
              stroke="#2B2D42"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ) : mood === 'deleting' ? (
            /* Small round surprised O-mouth */
            <ellipse
              cx="42"
              cy="53"
              rx="3.2"
              ry="4.8"
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

          {/* Tiny Little Soft Hands resting at the bottom of the circle */}
          <ellipse cx="32" cy="67" rx="4.8" ry="3.2" fill="#FFFDF7" stroke="#EBDAC2" strokeWidth="1.3" />
          <ellipse cx="52" cy="67" rx="4.8" ry="3.2" fill="#FFFDF7" stroke="#EBDAC2" strokeWidth="1.3" />
        </svg>
      </div>
    </div>
  );
}
