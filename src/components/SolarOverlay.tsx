"use client"

import React, { useMemo } from "react"
import { HourlySunPos } from '@/hooks/useSolarTracking'

interface SolarOverlayProps {
    azimuth: number
    altitude: number
    hourlyPath?: HourlySunPos[]
    orientation: { alpha: number; beta: number; gamma: number } | null
}

const FOV_Y = 60 // Vertical field of view in degrees

export default function SolarOverlay({ azimuth, altitude, hourlyPath = [], orientation }: SolarOverlayProps) {
    /**
     * MASTER 3D PROJECTION ENGINE (FIXED)
     */
    const mapToScreen = useMemo(() => {
        if (!orientation) return () => ({ x: 50, y: 50, isVisible: false })

        // 1. Degrees to Radians
        const alpha = (orientation.alpha * Math.PI) / 180
        const beta = (orientation.beta * Math.PI) / 180
        const gamma = (orientation.gamma * Math.PI) / 180

        /**
         * 2. Build Rotation Matrix (W3C standard Z-X-Y)
         * We need the rotation from World to Device.
         */
        const cA = Math.cos(alpha), sA = Math.sin(alpha)
        const cB = Math.cos(beta), sB = Math.sin(beta)
        const cG = Math.cos(gamma), sG = Math.sin(gamma)

        // Rotation matrix elements for Earth -> Phone
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
            // 3. Sun Vector (World Coords: X=East, Y=North, Z=Up)
            // SunCalc Azimuth: 0 = South, PI/2 = West. 
            // Let's convert to: X = East (sin), Y = North (cos)
            // Note: sunAz is already in radians from SunCalc.
            const xW = -Math.cos(sunAlt) * Math.sin(sunAz) // East is -sin(az) if South=0
            const yW = -Math.cos(sunAlt) * Math.cos(sunAz) // North is -cos(az) if South=0
            const zW = Math.sin(sunAlt)

            // 4. Transform World to Camera Coords
            const xC = r11 * xW + r21 * yW + r31 * zW
            const yC = r12 * xW + r22 * yW + r32 * zW
            const zC = r13 * xW + r23 * yW + r33 * zW

            // 5. Plane Clipping
            // In this specific matrix space, the phone's "back camera" looks along the -Z axis of the device? 
            // Actually, in DeviceOrientation, the screen face is +Z. So we look "through" the phone in -Z direction.
            // A point is visible if its z-coordinate is NEGATIVE (in front of the camera).
            if (zC >= 0) return { x: -100, y: -100, isVisible: false }

            // 6. Perspective Projection
            const focal = 1.0 / Math.tan((FOV_Y * Math.PI) / 360)

            // Project (xC / -zC) because screen is looking towards -Z
            const sX = (xC * focal) / -zC
            const sY = (yC * focal) / -zC

            // 7. Map to Percentages
            // Center is 50,50. 
            // On iPhone: X increases right, Y increases down (screen space).
            // But matrix yC increases "up" the phone. So we invert it.
            const xPercent = 50 + sX * 50
            const yPercent = 50 - sY * 50

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
                        <circle r="1.5" fill="#FFFFFF" className="opacity-40" />
                    </svg>
                </div>
            )}
        </div>
    );
}
