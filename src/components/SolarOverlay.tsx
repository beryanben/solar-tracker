"use client"

import React, { useMemo } from "react"

interface SolarOverlayProps {
    azimuth: number
    altitude: number
    orientation: { alpha: number; beta: number; gamma: number } | null
}

export default function SolarOverlay({ azimuth, altitude }: SolarOverlayProps) {
    // We'll use a 2D projection for the HUD look.
    // In a real AR app, this would be mapped to the 3D coordinate system,
    // but for the "Cinematic HUD" look requested, we'll center it.

    const sunX = useMemo(() => {
        // Map azimuth to horizontal position (-Math.PI to Math.PI) -> (0% to 100%)
        // Center is 0 azimuth.
        return 50 + (azimuth / (Math.PI)) * 50;
    }, [azimuth]);

    const sunY = useMemo(() => {
        // Map altitude to vertical position (0 to Math.PI/2) -> (80% to 20%)
        return 80 - (altitude / (Math.PI / 2)) * 60;
    }, [altitude]);

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Dotted Sun Path Arc */}
                <path
                    d="M 5,80 Q 50,10 95,80"
                    fill="none"
                    stroke="#888888"
                    strokeWidth="0.2"
                    strokeDasharray="0.5,1.5"
                    className="opacity-30"
                />

                {/* Cinematic Modern Sun */}
                <g style={{ transform: `translate(${sunX}%, ${sunY}%)` }} className="transition-all duration-700 ease-out">
                    {/* Outer Rotating HUD Ring */}
                    <circle
                        r="3.5"
                        fill="none"
                        stroke="#FF6600"
                        strokeWidth="0.1"
                        strokeDasharray="0.5, 0.5"
                        className="animate-spin-slow opacity-60"
                        style={{ transformOrigin: 'center' }}
                    />

                    {/* Soft Pulse Glow */}
                    <circle
                        r="2"
                        fill="#FF6600"
                        className="opacity-animate-pulse"
                        filter="url(#sun-glow)"
                    />

                    {/* Intense Solid Core */}
                    <circle
                        r="0.8"
                        fill="#FFFFFF"
                        className="opacity-90 shadow-2xl"
                        filter="url(#sun-glow)"
                    />
                </g>
            </svg>

            <style>{`
                @keyframes pulse-opacity {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.4); }
                }
                .opacity-animate-pulse {
                    animation: pulse-opacity 3s infinite ease-in-out;
                    transform-origin: center;
                }
                .animate-spin-slow {
                    animation: spin 15s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
