"use client"

import React, { useMemo } from "react"
import { HourlySunPos } from '@/hooks/useSolarTracking'

interface SolarOverlayProps {
    azimuth: number
    altitude: number
    hourlyPath?: HourlySunPos[]
    orientation: { alpha: number; beta: number; gamma: number } | null
}

/**
 * CSS 3D AR ENGINE
 * Instead of raw matrix math, we use the browser's native CSS 3D transformation engine.
 * We rotate a "Celestial Sphere" (container) by the negative of the phone's orientation.
 * We then place the sun and hours inside it using their absolute Azimuth/Altitude.
 */
export default function SolarOverlay({ azimuth, altitude, hourlyPath = [], orientation }: SolarOverlayProps) {

    // We place objects on a virtual sphere with this radius (pixels)
    // Larger radius = more precision, but needs a corresponding CSS perspective.
    const RADIUS = 1500

    if (!orientation) return null

    // 1. Convert phone orientation to CSS rotations
    // alpha = heading (0-360), beta = tilt (-180 to 180), gamma = roll (-90 to 90)
    // We use the negative to rotate the WORLD around the CAMERA.
    const worldTransform = {
        rotateZ: -orientation.alpha,
        rotateX: orientation.beta - 90,
        rotateY: -orientation.gamma
    }

    /**
     * Helper to convert Az/Alt to 3D Transform
     * SunCalc Azimuth: 0 = South, PI = North
     */
    const getPosTransform = (az: number, alt: number) => {
        // Convert SunCalc az/alt to degrees
        const azDeg = (az * 180) / Math.PI
        const altDeg = (alt * 180) / Math.PI

        // Rotation logic:
        // 1. Point at South (0,0)
        // 2. Rotate Y by Azimuth (SunCalc 0 is South, clockwise)
        // 3. Rotate X by Altitude
        // 4. Move forward by RADIUS
        return `rotateY(${-azDeg}deg) rotateX(${altDeg}deg) translateZ(${RADIUS}px)`
    }

    return (
        <div
            className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
            style={{ perspective: `${RADIUS}px` }}
        >
            {/* The "Celestial Container" - Centered and rotated by the phone's orientation */}
            <div
                className="absolute left-1/2 top-1/2 w-0 h-0 transition-transform duration-75 ease-linear"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: `
                        rotateX(${worldTransform.rotateX}deg) 
                        rotateY(${worldTransform.rotateY}deg) 
                        rotateZ(${worldTransform.rotateZ}deg)
                    `
                }}
            >
                {/* Trajectory Path (Rendered as many small segments/dots in 3D) */}
                {hourlyPath.map((pos, i) => (
                    <div
                        key={`path-${i}`}
                        className="absolute w-1 h-1 bg-[#FFCC00] rounded-full opacity-30"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: `${getPosTransform(pos.azimuth, pos.altitude)} translate(-50%, -50%)`
                        }}
                    />
                ))}

                {/* Hourly Labels */}
                {hourlyPath.map((pos, i) => (
                    <div
                        key={`label-${i}`}
                        className="absolute flex flex-col items-center justify-center"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: `${getPosTransform(pos.azimuth, pos.altitude)} translate(-50%, -50%) translateZ(10px)`
                        }}
                    >
                        {/* Billboard effect: negate the world rotation to keep text facing camera */}
                        <div style={{ transform: `rotateZ(${-worldTransform.rotateZ}deg) rotateY(${-worldTransform.rotateY}deg) rotateX(${-worldTransform.rotateX}deg)` }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] border border-white/40 shadow-sm" />
                            <span className="mt-1 block text-white font-mono text-[9px] font-bold drop-shadow-lg whitespace-nowrap">
                                {pos.label}
                            </span>
                        </div>
                    </div>
                ))}

                {/* The Sun Icon */}
                <div
                    className="absolute"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `${getPosTransform(azimuth, altitude)} translate(-50%, -50%) translateZ(20px)`
                    }}
                >
                    {/* Billboard effect for the sun icon */}
                    <div
                        className="text-[#FFCC00]"
                        style={{ transform: `rotateZ(${-worldTransform.rotateZ}deg) rotateY(${-worldTransform.rotateY}deg) rotateX(${-worldTransform.rotateX}deg)` }}
                    >
                        <svg width="80" height="80" viewBox="-20 -20 40 40" className="drop-shadow-2xl">
                            <circle r="6" fill="currentColor" stroke="#FFFFFF" strokeWidth="0.8" />
                            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                                    <line
                                        key={angle}
                                        x1="0" y1="-10" x2="0" y2="-15"
                                        transform={`rotate(${angle})`}
                                    />
                                ))}
                            </g>
                        </svg>
                    </div>
                </div>

                {/* Ground Plane (Optional - Helps visualize the horizon) */}
                <div
                    className="absolute w-[4000px] h-[4000px] bg-white/5 border-t border-white/10"
                    style={{
                        transform: 'rotateX(90deg) translate(-50%, -50%)',
                        transformOrigin: '0 0'
                    }}
                />
            </div>
        </div>
    );
}
