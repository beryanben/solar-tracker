"use client"

import React, { useMemo } from "react"
import { HourlySunPos } from '@/hooks/useSolarTracking'

interface SolarOverlayProps {
    azimuth: number
    altitude: number
    hourlyPath?: HourlySunPos[]
    orientation: { alpha: number; beta: number; gamma: number } | null
}

const FOV_Y = 60 // Vertical field of view in degrees (approx for mobile browser)

export default function SolarOverlay({ azimuth, altitude, hourlyPath = [], orientation }: SolarOverlayProps) {
    /**
     * MASTER 3D PROJECTION ENGINE
     * Converts Geo-coordinates (Az/Alt) to Screen Coordinates (X/Y) using 3D rotation matrices.
     */
    const mapToScreen = useMemo(() => {
        if (!orientation) return () => ({ x: 50, y: 50, isVisible: false })

        // 1. Convert Euler angles (degrees) to radians
        const alpha = (orientation.alpha * Math.PI) / 180
        const beta = (orientation.beta * Math.PI) / 180
        const gamma = (orientation.gamma * Math.PI) / 180

        /**
         * 2. Build Rotation Matrix (Intrinsic Z-X-Y / alpha-beta-gamma)
         * This matches the browser's DeviceOrientation specification.
         * We represent the phone's orientation relative to the earth.
         */
        const cA = Math.cos(alpha), sA = Math.sin(alpha)
        const cB = Math.cos(beta), sB = Math.sin(beta)
        const cG = Math.cos(gamma), sG = Math.sin(gamma)

        // Rotation Matrix R = Rz(alpha) * Rx(beta) * Ry(gamma)
        // This is the standard DeviceOrientation matrix (transposed to represent world-to-camera)
        const r11 = cA * cG - sA * sB * sG
        const r12 = -cA * sG - sA * sB * cG
        const r13 = -sA * cB

        const r21 = sA * cG + cA * sB * sG
        const r22 = -sA * sG + cA * sB * cG
        const r23 = cA * cB

        const r31 = cB * sG
        const r32 = cB * cG
        const r33 = -sB

        return (sunAz: number, sunAlt: number) => {
            // 3. Convert Sun Az/Alt to Cartesian vector in world coordinates
            // Azimuth is 0 at North, clockwise. Altitude is 0 at horizon, up to 90.
            // SunCalc Azimuth: 0 = South, -PI = North. Let's adjust back to North=0.
            const adjustedAz = sunAz + Math.PI

            const xW = Math.cos(sunAlt) * Math.sin(adjustedAz)
            const yW = Math.cos(sunAlt) * Math.cos(adjustedAz)
            const zW = Math.sin(sunAlt)

            // 4. Transform world vector to camera coordinate system
            // Inverse orientation = Camera movement.
            // X_cam = R11*xW + R21*yW + R31*zW
            // Y_cam = R12*xW + R22*yW + R32*zW
            // Z_cam = R13*xW + R23*yW + R33*zW
            const xC = r11 * xW + r21 * yW + r31 * zW
            const yC = r12 * xW + r22 * yW + r32 * zW
            const zC = r13 * xW + r23 * yW + r33 * zW

            // 5. Project onto 2D screen
            // If zC > 0, the point is behind us.
            if (zC <= 0) return { x: -100, y: -100, isVisible: false }

            // Perspective Projection
            // focal = 1 / tan(FOV/2)
            const f = 1.0 / Math.tan((FOV_Y * Math.PI) / 360)

            // X and Y screen coords (-1 to 1 range)
            const sX = xC * f / zC
            const sY = yC * f / zC

            // Convert to percentages (50 is center)
            // Vertical axis is inverted in screen space (y=0 is top)
            const xPercent = 50 + sX * 50
            const yPercent = 50 - sY * 50

            return {
                x: xPercent,
                y: yPercent,
                isVisible: xPercent > -20 && xPercent < 120 && yPercent > -20 && yPercent < 120
            }
        }
    }, [orientation])

    const currentSun = useMemo(() => mapToScreen(azimuth, altitude), [azimuth, altitude, mapToScreen])

    const pathPoints = useMemo(() => {
        return hourlyPath.map(pos => {
            const screenPos = mapToScreen(pos.azimuth, pos.altitude)
            return { ...pos, ...screenPos }
        })
    }, [hourlyPath, mapToScreen])

    // SVG Path for the curve - using pure SVG coordinates
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
            {/* SVG Layer for trajectory line (scalable layer) */}
            <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Horizon Line (Static 3D Approximation) */}
                <path
                    d="M 0,85 Q 50,75 100,85"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.05"
                    className="opacity-10"
                    strokeDasharray="0.5, 2"
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
                        className="opacity-40"
                    />
                )}
            </svg>

            {/* HTML Layer for Icons (perfectly circular, no distortion) */}

            {/* Hourly Markers */}
            {pathPoints.map((pt, i) => pt.isVisible && (
                <div
                    key={i}
                    className="absolute flex flex-col items-center justify-center transition-all duration-300 ease-out"
                    style={{
                        left: `${pt.x}%`,
                        top: `${pt.y}%`,
                        transform: 'translate(-50%, -50%) scale(1)'
                    }}
                >
                    <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] shadow-sm mix-blend-screen opacity-90" />
                        <div className="absolute w-[2px] h-[2px] rounded-full bg-white opacity-90" />
                    </div>
                    <span className="mt-1 text-white font-mono text-[8px] font-bold drop-shadow-md opacity-80">
                        {pt.label}
                    </span>
                </div>
            ))}

            {/* Current Sun - High Fidelity Crisp Icon */}
            {currentSun.isVisible && (
                <div
                    className="absolute transition-all duration-75 ease-linear text-[#FFCC00]"
                    style={{
                        left: `${currentSun.x}%`,
                        top: `${currentSun.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <svg width="56" height="56" viewBox="-14 -14 28 28" className="drop-shadow-2xl">
                        {/* Sun core */}
                        <circle r="4.5" fill="currentColor" stroke="#FFFFFF" strokeWidth="0.6" />

                        {/* Sun rays */}
                        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                            <line x1="0" y1="-7.5" x2="0" y2="-11.5" />
                            <line x1="0" y1="7.5" x2="0" y2="11.5" />
                            <line x1="-7.5" y1="0" x2="-11.5" y2="0" />
                            <line x1="7.5" y1="0" x2="11.5" y2="0" />
                            <line x1="-5.3" y1="-5.3" x2="-8.2" y2="-8.2" />
                            <line x1="5.3" y1="5.3" x2="8.2" y2="8.2" />
                            <line x1="-5.3" y1="5.3" x2="-8.2" y2="8.2" />
                            <line x1="5.3" y1="-5.3" x2="8.2" y2="-8.2" />
                        </g>

                        {/* Subtle lens flare / inner highlight */}
                        <circle r="1.5" fill="#FFFFFF" className="opacity-40" />
                    </svg>
                </div>
            )}
        </div>
    );
}
