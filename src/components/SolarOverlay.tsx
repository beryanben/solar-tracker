"use client"

import React, { useMemo } from "react"
import { HourlySunPos } from '@/hooks/useSolarTracking'

interface SolarOverlayProps {
    azimuth: number
    altitude: number
    hourlyPath?: HourlySunPos[]
    orientation: { alpha: number; beta: number; gamma: number } | null
}

const FOV_X = 60 // Horizontal Field of View (approx for mobile)

/**
 * FINAL AR PROJECTION ENGINE
 * This version uses a standard 3D coordinate system:
 * X: East, Y: North, Z: Up
 */
export default function SolarOverlay({ azimuth, altitude, hourlyPath = [], orientation }: SolarOverlayProps) {
    const mapToScreen = useMemo(() => {
        if (!orientation) return () => ({ x: 50, y: 50, isVisible: false })

        // 1. Phone Orientation (Radians)
        const a = (orientation.alpha * Math.PI) / 180
        const b = (orientation.beta * Math.PI) / 180
        const g = (orientation.gamma * Math.PI) / 180

        // 2. Build Rotation Matrix (Z-X'-Y'' Intrinsic Tait-Bryan)
        // This represents the rotation to get from World space to Phone space.
        const cA = Math.cos(a), sA = Math.sin(a)
        const cB = Math.cos(b), sB = Math.sin(b)
        const cG = Math.cos(g), sG = Math.sin(g)

        // Matrix coefficients for World-to-Camera transformation
        const m11 = cA * cG - sA * sB * sG
        const m12 = -cA * sG - sA * sB * cG
        const m13 = -sA * cB

        const m21 = sA * cG + cA * sB * sG
        const m22 = -sA * sG + cA * sB * cG
        const m23 = cA * cB

        const m31 = cB * sG
        const m32 = cB * cG
        const m33 = -sB

        return (sunAz: number, sunAlt: number) => {
            // 3. Sun World Vector (X=East, Y=North, Z=Up)
            // SunCalc: Azimuth 0 = South, +/-PI/2 = West/East. 
            // So: East = -sin(az), North = -cos(az)
            const xW = -Math.cos(sunAlt) * Math.sin(sunAz)
            const yW = -Math.cos(sunAlt) * Math.cos(sunAz)
            const zW = Math.sin(sunAlt)

            // 4. Transform to Camera Coords
            const xC = m11 * xW + m21 * yW + m31 * zW
            const yC = m12 * xW + m22 * yW + m32 * zW
            const zC = m13 * xW + m23 * yW + m33 * zW

            // 5. Plane Clipping
            // Phone screen looks towards -Z in this system.
            if (zC >= 0) return { x: -100, y: -100, isVisible: false }

            // 6. Perspective Projection
            const focalFactor = 1.0 / Math.tan((FOV_X * Math.PI) / 360)

            // X/Y screen ratios (-1 to 1)
            const screenX = (xC * focalFactor) / -zC
            const screenY = (yC * focalFactor) / -zC

            // 7. Map to Percentages (adjusted for portrait layout)
            const xPercent = 50 + screenX * 50
            const yPercent = 50 - screenY * 50 * (window.innerWidth / window.innerHeight)

            return {
                x: xPercent,
                y: yPercent,
                isVisible: xPercent > -100 && xPercent < 200 && yPercent > -100 && yPercent < 200
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

    const svgPathData = useMemo(() => {
        const pts = pathPoints.filter(p => p.isVisible)
        if (pts.length < 2) return ""
        let path = `M ${pts[0].x} ${pts[0].y} `
        for (let i = 0; i < pts.length - 1; i++) {
            const curr = pts[i], next = pts[i + 1]
            path += `Q ${curr.x} ${curr.y}, ${(curr.x + next.x) / 2} ${(curr.y + next.y) / 2} `
        }
        path += `L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`
        return path
    }, [pathPoints])

    if (!orientation) return null

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {svgPathData && (
                    <path
                        d={svgPathData}
                        fill="none"
                        stroke="#FFCC00"
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        className="opacity-40"
                    />
                )}
            </svg>

            {pathPoints.map((pt, i) => pt.isVisible && (
                <div
                    key={i}
                    className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] shadow-sm mix-blend-screen opacity-90" />
                    <span className="mt-1 text-white font-mono text-[8px] font-bold drop-shadow-md opacity-80">
                        {pt.label}
                    </span>
                </div>
            ))}

            {currentSun.isVisible && (
                <div
                    className="absolute text-[#FFCC00] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-linear"
                    style={{ left: `${currentSun.x}%`, top: `${currentSun.y}%` }}
                >
                    <svg width="64" height="64" viewBox="-16 -16 32 32" className="drop-shadow-2xl">
                        <circle r="5" fill="currentColor" stroke="#FFFFFF" strokeWidth="0.6" />
                        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                                <line
                                    key={angle}
                                    x1="0" y1="-8" x2="0" y2="-12"
                                    transform={`rotate(${angle})`}
                                />
                            ))}
                        </g>
                    </svg>
                </div>
            )}
        </div>
    );
}
