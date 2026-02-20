"use client"

import React, { useEffect, useRef } from "react"

export default function CameraView() {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        async function startCamera() {
            try {
                // Ensure audio is strictly false so iOS doesn't show the red "recording" pill
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false,
                })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            } catch (err) {
                console.error("Erreur d'accès à la caméra :", err)
            }
        }

        startCamera()

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach((track) => track.stop())
            }
        }
    }, [])

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-[100dvh] w-full object-cover"
        />
    )
}
