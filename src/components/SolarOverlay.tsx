"use client"

import React, { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Sphere, Line } from "@react-three/drei"
import * as THREE from "three"

interface SolarSceneProps {
    azimuth: number
    altitude: number
    orientation: { alpha: number; beta: number; gamma: number } | null
}

function SolarPath({ azimuth, altitude, orientation }: SolarSceneProps) {
    const groupRef = useRef<THREE.Group>(null)

    useFrame(() => {
        if (groupRef.current && orientation) {
            // Rotate the entire scene based on phone orientation
            // Alpha is heading (Z rotation in Three.js if Y is up)
            // Beta is tilt (X rotation)
            // Gamma is roll (Z rotation)
            // Note: This is a simplified mapping that needs refinement for a perfect AR lock
            groupRef.current.rotation.set(
                (orientation.beta * Math.PI) / 180,
                (-orientation.alpha * Math.PI) / 180,
                (orientation.gamma * Math.PI) / 180,
                "YXZ"
            )
        }
    })

    // Convert Azimuth/Altitude to 3D position
    // Distance of 50 units for the sun
    const distance = 50
    const x = distance * Math.cos(altitude) * Math.sin(azimuth)
    const y = distance * Math.sin(altitude)
    const z = -distance * Math.cos(altitude) * Math.cos(azimuth)

    return (
        <group ref={groupRef}>
            {/* Current Sun */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Sphere args={[2, 32, 32]} position={[x, y, z]}>
                    <meshBasicMaterial color="#fb923c" />
                </Sphere>
            </Float>

            {/* Trajectory (Arc) - Simplified placeholder for the day's path */}
            <Line
                points={[
                    [-40, 0, -40],
                    [0, 30, -50],
                    [40, 0, -40],
                ]}
                color="#fb923c"
                lineWidth={2}
                dashed
            />

            {/* Horizon Guide */}
            <gridHelper args={[100, 10, 0x444444, 0x222222]} position={[0, -10, 0]} />
        </group>
    )
}

export default function SolarOverlay(props: SolarSceneProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            <Canvas camera={{ position: [0, 0, 0], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <SolarPath {...props} />
            </Canvas>
        </div>
    )
}
