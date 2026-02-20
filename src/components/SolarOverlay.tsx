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
    // Helper to map AZ/ALT to Screen X/Y
    const mapToScreen = (az: number, alt: number) => {
        if (!orientation) {
            return { x: 50, y: 50, isVisible: true }
        }

        const sunCompassHeading = ((az * 180 / Math.PI) + 180) % 360
        const sunElevation = alt * 180 / Math.PI

        const phoneHeading = orientation.alpha
        const phoneElevation = orientation.beta - 90 // Corrected vertical orientation

        let diffX = sunCompassHeading - phoneHeading
        while (diffX <= -180) diffX += 360
        while (diffX > 180) diffX -= 360

        // iPhone Rear Camera typically has ~70° Diagonal FOV.
        // Assuming ~60° Horizontal FOV and ~80° Vertical FOV for portrait web view.
        // Screen width (100%) = 60 degrees. Therefore 1 degree = 100/60 = 1.66%
        const xPercent = 50 + (diffX / 60) * 100

        // Screen height (100%) = 80 degrees.
        const yPercent = 50 - ((sunElevation - phoneElevation) / 80) * 100

        // Visibility bound (render even slightly offscreen to maintain path continuity)
        const isVisible = xPercent > -150 && xPercent < 250 && yPercent > -150 && yPercent < 250

        return { x: xPercent, y: yPercent, isVisible }
    }

    const currentSun = useMemo(() => mapToScreen(azimuth, altitude), [azimuth, altitude, orientation])

    const pathPoints = useMemo(() => {
        return hourlyPath.map(pos => {
            const screenPos = mapToScreen(pos.azimuth, pos.altitude)
            return { ...pos, ...screenPos }
        })
    }, [hourlyPath, orientation])

    // Create Smooth SVG Path Data (Midpoint Bezier interpolation)
    const svgPathData = useMemo(() => {
        const pts = pathPoints.filter(p => p.isVisible)
        if (pts.length < 2) return ""

        let path = `M ${pts[0].x} ${pts[0].y} `

        if (pts.length === 2) {
            path += `L ${pts[1].x} ${pts[1].y}`
            return path
        }

        for (let i = 0; i < pts.length - 1; i++) {
            const curr = pts[i]
            const next = pts[i + 1]
            const midX = (curr.x + next.x) / 2
            const midY = (curr.y + next.y) / 2

            if (i === 0) {
                path += `L ${midX} ${midY} `
            } else {
                path += `Q ${curr.x} ${curr.y}, ${midX} ${midY} `
            }
        }
        path += `L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`

        return path
    }, [pathPoints])

    if (!currentSun.isVisible && pathPoints.filter(p => p.isVisible).length === 0) return null

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {/* SVG Layer for lines only (allowed to stretch) */}
            <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Horizon Line */}
                <path
                    d="M 0,80 Q 50,10 100,80"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="0.1"
                    strokeDasharray="0.5, 2"
                    className="opacity-10"
                />

                {/* Trajectory Smooth Curve */}
                {svgPathData && (
                    <path
                        d={svgPathData}
                        fill="none"
                        stroke="#FFCC00"
                        strokeWidth="0.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-60"
                    />
                )}
            </svg>

            {/* HTML Layer for Icons (prevents horizontal squashing from viewBox) */}

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
                        <div className="w-3 h-3 rounded-full bg-[#FFCC00] opacity-90 shadow-sm mix-blend-screen" />
                        <div className="absolute w-[3px] h-[3px] rounded-full bg-white opacity-90" />
                    </div>
                    <span className="mt-1 text-white font-mono text-[9px] font-bold drop-shadow-md opacity-90">
                        {pt.label}
                    </span>
                </div>
            ))}

            {/* Current Sun - Crisp Icon */}
            {currentSun.isVisible && (
                <div
                    className="absolute transition-all duration-75 ease-linear text-[#FFCC00] pointer-events-none"
                    style={{
                        left: `${currentSun.x}%`,
                        top: `${currentSun.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <svg width="48" height="48" viewBox="-12 -12 24 24" className="drop-shadow-lg">
                        <circle r="5" fill="currentColor" stroke="#FFFFFF" strokeWidth="0.5" />
                        <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                            <line x1="0" y1="-7.5" x2="0" y2="-10.5" />
                            <line x1="0" y1="7.5" x2="0" y2="10.5" />
                            <line x1="-7.5" y1="0" x2="-10.5" y2="0" />
                            <line x1="7.5" y1="0" x2="10.5" y2="0" />
                            <line x1="-5.3" y1="-5.3" x2="-7.4" y2="-7.4" />
                            <line x1="5.3" y1="5.3" x2="7.4" y2="7.4" />
                            <line x1="-5.3" y1="5.3" x2="-7.4" y2="7.4" />
                            <line x1="5.3" y1="-5.3" x2="7.4" y2="-7.4" />
                        </g>
                        <circle r="1.5" fill="#FFFFFF" className="opacity-50" />
                    </svg>
                </div>
            )}
        </div>
    );
}
