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

    // Create SVG Path Data
    const svgPathData = useMemo(() => {
        const visiblePoints = pathPoints.filter(p => p.isVisible)
        if (visiblePoints.length < 2) return ""

        let path = `M ${visiblePoints[0].x} ${visiblePoints[0].y} `
        for (let i = 1; i < visiblePoints.length; i++) {
            path += `L ${visiblePoints[i].x} ${visiblePoints[i].y} `
        }
        return path
    }, [pathPoints])

    if (!currentSun.isVisible && pathPoints.filter(p => p.isVisible).length === 0) return null

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <radialGradient id="real-sun" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="15%" stopColor="#FFF9E6" stopOpacity="0.9" />
                        <stop offset="40%" stopColor="#FFD27F" stopOpacity="0.8" />
                        <stop offset="70%" stopColor="#FF8C00" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="hour-sun" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFD27F" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Horizon Line */}
                <path
                    d="M 0,80 Q 50,10 100,80"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="0.1"
                    strokeDasharray="0.5, 2"
                    className="opacity-10"
                />

                {/* Trajectory Curve */}
                {svgPathData && (
                    <path
                        d={svgPathData}
                        fill="none"
                        stroke="#FFD27F"
                        strokeWidth="0.2"
                        className="opacity-40"
                    />
                )}

                {/* Hourly Markers */}
                {pathPoints.map((pt, i) => pt.isVisible && (
                    <g key={i} style={{ transform: `translate(${pt.x}%, ${pt.y}%)` }}>
                        <circle r="1.5" fill="url(#hour-sun)" className="mix-blend-screen opacity-80" />
                        <circle r="0.3" fill="#FFFFFF" className="opacity-90" />
                        <text
                            y="4"
                            fontSize="2"
                            fill="white"
                            className="font-mono opacity-80"
                            textAnchor="middle"
                        >
                            {pt.label}
                        </text>
                    </g>
                ))}

                {/* Current Realistic Sun Graphic */}
                {currentSun.isVisible && (
                    <g style={{ transform: `translate(${currentSun.x}%, ${currentSun.y}%)` }} className="transition-all duration-75 ease-linear">
                        <circle
                            r="8"
                            fill="url(#real-sun)"
                            className="opacity-100 mix-blend-screen"
                        />
                    </g>
                )}
            </svg>
        </div>
    );
}
