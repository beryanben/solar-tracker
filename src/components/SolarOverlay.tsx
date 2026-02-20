"use client"

import React, { useMemo } from "react"
import { HourlySunPos } from '@/hooks/useSolarTracking'

interface SolarOverlayProps {
    azimuth: number
    altitude: number
    hourlyPath?: HourlySunPos[]
    orientation: { alpha: number; beta: number; gamma: number } | null
}

export default function SolarOverlay({ azimuth, altitude, hourlyPath = [], orientation }: SolarOverlayProps) {
    /**
     * BASIC STABLE MAPPING (REVERTED)
     * This uses simple linear mapping of Heading and Pitch.
     * It ignores Roll (gamma) for maximum stability, as requested by the user.
     */
    const mapToScreen = (sunAz: number, sunAlt: number) => {
        if (!orientation) return { x: 50, y: 50, isVisible: false }

        // 1. Convert Sun azimuth and altitude to degrees from radians
        // SunCalc: 0 is South, +/- PI. We want 0 is North, clockwise.
        const sunCompassHeading = ((sunAz * 180 / Math.PI) + 180) % 360
        const sunElevation = sunAlt * 180 / Math.PI

        // 2. Device state
        const phoneHeading = orientation.alpha
        const phoneElevation = orientation.beta - 90 // Corrected vertical orientation

        // 3. Horizontal distance
        let diffX = sunCompassHeading - phoneHeading
        while (diffX <= -180) diffX += 360
        while (diffX > 180) diffX -= 360

        // Horizontal FOV ~60 degrees. X% = 50 + (diff/60)*100
        const xPercent = 50 + (diffX / 60) * 100

        // Vertical FOV ~80 degrees. Y% = 50 - (diff/80)*100
        const yPercent = 50 - ((sunElevation - phoneElevation) / 80) * 100

        // Visibility bound
        const isVisible = xPercent > -100 && xPercent < 200 && yPercent > -100 && yPercent < 200

        return { x: xPercent, y: yPercent, isVisible }
    }

    const currentSun = useMemo(() => mapToScreen(azimuth, altitude), [azimuth, altitude, orientation])

    const pathPoints = useMemo(() => {
        return hourlyPath.map(pos => {
            const screenPos = mapToScreen(pos.azimuth, pos.altitude)
            return { ...pos, ...screenPos }
        })
    }, [hourlyPath, orientation])

    // SVG Path for the curve
    const svgPathData = useMemo(() => {
        const pts = pathPoints.filter(p => p.isVisible)
        if (pts.length < 2) return ""

        let path = `M ${pts[0].x} ${pts[0].y} `
        for (let i = 0; i < pts.length - 1; i++) {
            const curr = pts[i]
            const next = pts[i + 1]
            const midX = (curr.x + next.x) / 2
            const midY = (curr.y + next.y) / 2
            path += i === 0 ? `L ${midX} ${midY} ` : `Q ${curr.x} ${curr.y}, ${midX} ${midY} `
        }
        path += `L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`
        return path
    }, [pathPoints])

    if (!orientation) return null

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {/* SVG Layer for lines only */}
            <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
                {svgPathData && (
                    <path
                        d={svgPathData}
                        fill="none"
                        stroke="#FFCC00"
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-40"
                    />
                )}
            </svg>

            {/* HTML Layer for Icons (prevents horizontal squashing) */}

            {/* Hourly Markers */}
            {pathPoints.map((pt, i) => pt.isVisible && (
                <div
                    key={i}
                    className="absolute flex flex-col items-center justify-center pointer-events-none"
                    style={{
                        left: `${pt.x}%`,
                        top: `${pt.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] shadow-sm mix-blend-screen opacity-90" />
                        <div className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white opacity-90" />
                    </div>
                    <span className="mt-1 text-white font-mono text-[8px] font-bold drop-shadow-md opacity-80">
                        {pt.label}
                    </span>
                </div>
            ))}

            {/* Current Sun */}
            {currentSun.isVisible && (
                <div
                    className="absolute transition-all duration-75 ease-linear text-[#FFCC00] pointer-events-none"
                    style={{
                        left: `${currentSun.x}%`,
                        top: `${currentSun.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <svg width="56" height="56" viewBox="-14 -14 28 28" className="drop-shadow-2xl">
                        <circle r="4.5" fill="currentColor" stroke="#FFFFFF" strokeWidth="0.6" />
                        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                                <line
                                    key={angle}
                                    x1="0" y1="-7.5" x2="0" y2="-11.5"
                                    transform={`rotate(${angle})`}
                                />
                            ))}
                        </g>
                        <circle r="1.5" fill="#FFFFFF" className="opacity-40" />
                    </svg>
                </div>
            )}
        </div>
    );
}
