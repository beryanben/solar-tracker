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
        const phoneElevation = 90 - orientation.beta

        let diffX = sunCompassHeading - phoneHeading
        while (diffX <= -180) diffX += 360
        while (diffX > 180) diffX -= 360

        // FOV scaling: 30 degrees off center = 50% screen width
        const xPercent = 50 + (diffX / 30) * 50
        const yPercent = 50 - ((sunElevation - phoneElevation) / 40) * 50

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
            <svg className="w-full h-full drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
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
                        strokeWidth="0.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-60"
                    />
                )}

                {/* Hourly Markers */}
                {pathPoints.map((pt, i) => pt.isVisible && (
                    <g key={i} style={{ transform: `translate(${pt.x}%, ${pt.y}%)` }}>
                        <circle r="1.2" fill="#FFCC00" className="opacity-90 drop-shadow-sm" />
                        <circle r="0.4" fill="#FFFFFF" />
                        <text
                            y="4"
                            fontSize="2"
                            fill="white"
                            className="font-mono opacity-90 drop-shadow-sm"
                            textAnchor="middle"
                            fontWeight="bold"
                        >
                            {pt.label}
                        </text>
                    </g>
                ))}

                {/* Current Sun - Crisp Icon */}
                {currentSun.isVisible && (
                    <g style={{ transform: `translate(${currentSun.x}%, ${currentSun.y}%)` }} className="transition-all duration-75 ease-linear text-[#FFCC00]">
                        {/* Sun core */}
                        <circle r="2.5" fill="currentColor" stroke="#FFFFFF" strokeWidth="0.3" className="drop-shadow-lg" />

                        {/* Sun rays */}
                        <g stroke="currentColor" strokeWidth="0.5" strokeLinecap="round">
                            <line x1="0" y1="-3.5" x2="0" y2="-5.5" />
                            <line x1="0" y1="3.5" x2="0" y2="5.5" />
                            <line x1="-3.5" y1="0" x2="-5.5" y2="0" />
                            <line x1="3.5" y1="0" x2="5.5" y2="0" />
                            <line x1="-2.5" y1="-2.5" x2="-4" y2="-4" />
                            <line x1="2.5" y1="2.5" x2="4" y2="4" />
                            <line x1="-2.5" y1="2.5" x2="-4" y2="4" />
                            <line x1="2.5" y1="-2.5" x2="4" y2="-4" />
                        </g>

                        {/* Subtle inner highlight */}
                        <circle r="1" fill="#FFFFFF" className="opacity-50" />
                    </g>
                )}
            </svg>
        </div>
    );
}
