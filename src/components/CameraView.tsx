"use client"

import React, { useEffect, useRef } from "react"

export default function CameraView() {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
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
            className="fixed inset-0 h-full w-full object-cover"
        />
    )
}
