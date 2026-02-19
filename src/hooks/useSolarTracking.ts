"use client"

import React, { useState, useEffect } from "react"
import SunCalc from "suncalc"

interface SolarPosition {
    azimuth: number
    altitude: number
}

export default function useSolarTracking() {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [sunPos, setSunPos] = useState<SolarPosition | null>(null)
    const [orientation, setOrientation] = useState<{ alpha: number; beta: number; gamma: number } | null>(null)
    const [address, setAddress] = useState<string | null>(null)
    const [date, setDate] = useState<Date>(new Date())
    const [loadingAddress, setLoadingAddress] = useState(false)

    const fetchAddress = async (lat: number, lng: number) => {
        setLoadingAddress(true)
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`)
            const data = await response.json()
            const fullAddress = [data.locality, data.city, data.principalSubdivision].filter(Boolean).join(", ")
            setAddress(fullAddress || "Adresse inconnue")
        } catch (error) {
            console.error("Erreur lors de la récupération de l'adresse:", error)
            setAddress("Erreur localisation")
        } finally {
            setLoadingAddress(false)
        }
    }

    const refreshLocation = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setCoords(newCoords)
            fetchAddress(newCoords.lat, newCoords.lng)
        }, (err) => {
            console.error("Erreur GPS:", err)
        }, { enableHighAccuracy: true })
    }

    useEffect(() => {
        // 1. Get Location
        refreshLocation()

        // 2. Track Orientation
        const handleOrientation = (e: DeviceOrientationEvent) => {
            setOrientation({
                alpha: e.alpha || 0, // Heading (0 is North)
                beta: e.beta || 0,  // Tilt front/back
                gamma: e.gamma || 0 // Tilt left/right
            })
        }

        if (typeof window !== "undefined") {
            window.addEventListener("deviceorientation", handleOrientation)
        }

        return () => window.removeEventListener("deviceorientation", handleOrientation)
    }, [])

    useEffect(() => {
        if (coords) {
            const pos = SunCalc.getPosition(date, coords.lat, coords.lng)
            setSunPos({
                azimuth: pos.azimuth,
                altitude: pos.altitude
            })
        }
    }, [coords, date])

    return { sunPos, orientation, coords, address, date, setDate, loadingAddress, refreshLocation }
}
