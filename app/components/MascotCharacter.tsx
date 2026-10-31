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

  // Ethereal floating & breathing offset
  const [floatOffset, setFloatOffset] = useState(0);
  const [breathScale, setBreathScale] = useState(1);

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

        // Max movement radius inside ghost eye
        const maxRadius = 4.2;
        const radius = Math.min(maxRadius, distance / 36);

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

  // Smooth lerp frame loop + ghost floating cycle
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

      // Ghost floating bob: gentle 2.8s wave
      const elapsed = (now - startTime) / 1000;
      const floatVal = Math.sin((elapsed * Math.PI * 2) / 2.8) * 3.2;
      const breathVal = 1 + Math.cos((elapsed * Math.PI * 2) / 2.8) * 0.03;

      setFloatOffset(floatVal);
      setBreathScale(breathVal);

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
      const delay = 2600 + Math.random() * 2400; // blink every 2.6s - 5.0s
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

  // Mood-specific styles and transforms
  let moodTransform = '';
  if (mood === 'adding') {
    moodTransform = 'animate-bounce';
  } else if (mood === 'deleting') {
    moodTransform = 'scale-90 rotate-[-5deg] transition-transform duration-200';
  } else if (mood === 'completing') {
    moodTransform = 'scale-105 rotate-[4deg] transition-transform duration-200';
  } else if (mood === 'reordering') {
    moodTransform = 'rotate-[-8deg] translate-y-[-2px] transition-transform duration-200';
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        transform: `translateY(${floatOffset}px) scale(${breathScale})`,
      }}
      aria-hidden="true"
    >
      <div className={`transition-all duration-300 ease-out ${moodTransform}`}>
        <svg
          viewBox="0 0 84 84"
          className="w-12 h-12 sm:w-14 sm:h-14 overflow-visible drop-shadow-sm"
        >
          <defs>
            {/* Ethereal light pastel ghost gradient */}
            <linearGradient id="ghostBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#F8FAFC" />
              <stop offset="75%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>

            {/* Ghost eye clip paths to keep pupils inside */}
            <clipPath id="ghostLeftEyeClip">
              <ellipse cx="32" cy="38" rx="8.5" ry="11.5" />
            </clipPath>
            <clipPath id="ghostRightEyeClip">
              <ellipse cx="52" cy="38" rx="8.5" ry="11.5" />
            </clipPath>
          </defs>

          {/* Ethereal Floating Ghost Shadow (scales inversely with float) */}
          <ellipse
            cx="42"
            cy="76"
            rx={16 - floatOffset * 0.6}
            ry={3.2}
            fill="#38BDF8"
            opacity={0.16 + floatOffset * 0.02}
          />

          {/* Left Ghost Arm */}
          <path
            d="M 21 42 C 12 43, 11 49, 17 52 C 20 53, 23 48, 22 42 Z"
            fill="url(#ghostBodyGrad)"
            stroke="#BAE6FD"
            strokeWidth="1.4"
          />

          {/* Right Ghost Arm */}
          <path
            d="M 63 42 C 72 43, 73 49, 67 52 C 64 53, 61 48, 62 42 Z"
            fill="url(#ghostBodyGrad)"
            stroke="#BAE6FD"
            strokeWidth="1.4"
          />

          {/* Main Flowing Ghost Body with Wavy Tail Ruffles */}
          <path
            data-testid="ghost-body"
            d="M 20 42
               C 20 18, 64 18, 64 42
               C 64 54, 66 65, 62 67
               C 58 69, 56 63, 52 64
               C 48 65, 46 70, 42 69
               C 38 68, 36 63, 32 64
               C 28 65, 26 69, 22 67
               C 18 65, 20 54, 20 42 Z"
            fill="url(#ghostBodyGrad)"
            stroke="#BAE6FD"
            strokeWidth="1.8"
          />

          {/* Translucent Soft Glow Highlight on top-left of Ghost Head */}
          <ellipse
            cx="34"
            cy="24"
            rx="12"
            ry="6"
            fill="#FFFFFF"
            opacity="0.6"
            transform="rotate(-20 34 24)"
          />

          {/* Cute Rosy Glowing Cheeks */}
          <ellipse
            cx="24"
            cy="46"
            rx="4.8"
            ry="3.2"
            fill="#F472B6"
            opacity={mood === 'adding' || mood === 'completing' ? 0.8 : 0.45}
            className="transition-opacity duration-300"
          />
          <ellipse
            cx="60"
            cy="46"
            rx="4.8"
            ry="3.2"
            fill="#F472B6"
            opacity={mood === 'adding' || mood === 'completing' ? 0.8 : 0.45}
            className="transition-opacity duration-300"
          />

          {/* ================= GHOST EYES ================= */}
          {/* Mood: Adding / Celebration -> Joyful Arcs (^ ^) */}
          {mood === 'adding' ? (
            <g>
              <path
                d="M 24 39 Q 32 28 40 39"
                fill="none"
                stroke="#0F172A"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 44 39 Q 52 28 60 39"
                fill="none"
                stroke="#0F172A"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Little celebration star above ghost */}
              <path
                className="star-sparkle"
                data-testid="star"
                d="M 42 10 L 43.5 14 L 47 15 L 43.5 16 L 42 20 L 40.5 16 L 37 15 L 40.5 14 Z"
                fill="#FBBF24"
              />
            </g>
          ) : mood === 'completing' ? (
            /* Mood: Completing -> Celebratory Wink & Star (^ ~) */
            <g>
              {/* Left Eye: Happy Wink Arc */}
              <path
                d="M 24 39 Q 32 30 40 39"
                fill="none"
                stroke="#0F172A"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Right Eye: Starry Proud Ghost Eye */}
              <ellipse
                cx="52"
                cy="38"
                rx="8.5"
                ry="11.5"
                fill="#FFFFFF"
                stroke="#BAE6FD"
                strokeWidth="1.2"
              />
              <g clipPath="url(#ghostRightEyeClip)">
                <circle cx="52" cy="38" r="6.6" fill="#0F172A" />
                {/* Celebratory yellow star inside eye */}
                <path
                  className="eye-star"
                  data-testid="star"
                  d="M 52 34 L 53 37 L 56 38 L 53 39 L 52 42 L 51 39 L 48 38 L 51 37 Z"
                  fill="#FDE047"
                />
              </g>
            </g>
          ) : mood === 'deleting' ? (
            /* Mood: Deleting -> "Spooked" Ghost with wide round eyes & tiny pupils */
            <g>
              <ellipse
                cx="32"
                cy="38"
                rx="9"
                ry="12"
                fill="#FFFFFF"
                stroke="#BAE6FD"
                strokeWidth="1.2"
              />
              <ellipse
                cx="52"
                cy="38"
                rx="9"
                ry="12"
                fill="#FFFFFF"
                stroke="#BAE6FD"
                strokeWidth="1.2"
              />
              {/* Tiny startled ghost pupils */}
              <circle cx="32" cy="38" r="2.8" fill="#0F172A" />
              <circle cx="52" cy="38" r="2.8" fill="#0F172A" />
            </g>
          ) : isBlinking ? (
            /* Natural Blinking Lines */
            <g>
              <path
                d="M 24 38 Q 32 41 40 38"
                fill="none"
                stroke="#0F172A"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 44 38 Q 52 41 60 38"
                fill="none"
                stroke="#0F172A"
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
                  cx="32"
                  cy="38"
                  rx="8.5"
                  ry="11.5"
                  fill="#FFFFFF"
                  stroke="#BAE6FD"
                  strokeWidth="1.2"
                />
                <g clipPath="url(#ghostLeftEyeClip)">
                  {/* Pupil Group moving with cursor offset */}
                  <g transform={`translate(${pupils.lx}, ${pupils.ly})`}>
                    <circle cx="32" cy="38" r="6" fill="#0F172A" />
                    {/* Ethereal cyan iris reflection */}
                    <ellipse cx="32" cy="41.5" rx="3.3" ry="1.7" fill="#38BDF8" opacity="0.8" />
                    {/* Big glossy catchlight */}
                    <circle cx="29.8" cy="35.5" r="2.1" fill="#FFFFFF" />
                    {/* Tiny bottom catchlight */}
                    <circle cx="34" cy="40" r="1.0" fill="#FFFFFF" />
                  </g>
                </g>
              </g>

              {/* Right Eye */}
              <g ref={rightEyeRef}>
                <ellipse
                  cx="52"
                  cy="38"
                  rx="8.5"
                  ry="11.5"
                  fill="#FFFFFF"
                  stroke="#BAE6FD"
                  strokeWidth="1.2"
                />
                <g clipPath="url(#ghostRightEyeClip)">
                  {/* Pupil Group moving with cursor offset */}
                  <g transform={`translate(${pupils.rx}, ${pupils.ry})`}>
                    <circle cx="52" cy="38" r="6" fill="#0F172A" />
                    {/* Ethereal cyan iris reflection */}
                    <ellipse cx="52" cy="41.5" rx="3.3" ry="1.7" fill="#38BDF8" opacity="0.8" />
                    {/* Big glossy catchlight */}
                    <circle cx="49.8" cy="35.5" r="2.1" fill="#FFFFFF" />
                    {/* Tiny bottom catchlight */}
                    <circle cx="54" cy="40" r="1.0" fill="#FFFFFF" />
                  </g>
                </g>
              </g>
            </g>
          )}

          {/* ================= GHOST MOUTH ================= */}
          {mood === 'adding' ? (
            /* Open laughing joyful mouth */
            <path
              d="M 38 47 Q 42 55 46 47 Z"
              fill="#F43F5E"
              stroke="#0F172A"
              strokeWidth="1.6"
            />
          ) : mood === 'completing' ? (
            /* Proud happy curved grin */
            <path
              d="M 37 47 Q 42 53 47 47"
              fill="none"
              stroke="#0F172A"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ) : mood === 'deleting' ? (
            /* Small surprised round "O" ghost mouth ("Ooo!") */
            <ellipse
              cx="42"
              cy="50"
              rx="3"
              ry="4.4"
              fill="#0F172A"
            />
          ) : mood === 'reordering' ? (
            /* Playful curious ghost mouth with tongue peek */
            <g>
              <path
                d="M 38 47 Q 42 53 46 47"
                fill="none"
                stroke="#0F172A"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 40.5 49 Q 42 53 43.5 49"
                fill="#FB7185"
              />
            </g>
          ) : (
            /* Default sweet gentle ghost smile */
            <path
              d="M 38 47 Q 42 51.5 46 47"
              fill="none"
              stroke="#334155"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
