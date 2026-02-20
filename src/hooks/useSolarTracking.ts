"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import SunCalc from "suncalc"

interface SolarPosition {
    azimuth: number
    altitude: number
}

export interface HourlySunPos extends SolarPosition {
    hour: number
    label: string
}

export default function useSolarTracking() {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [sunPos, setSunPos] = useState<SolarPosition | null>(null)
    const [hourlyPath, setHourlyPath] = useState<HourlySunPos[]>([])
    const [orientation, setOrientation] = useState<{ alpha: number; beta: number; gamma: number } | null>(null)
    const [address, setAddress] = useState<string | null>(null)
    const [date, setDate] = useState<Date>(new Date())
    const [loadingAddress, setLoadingAddress] = useState(false)
    const [needsPermission, setNeedsPermission] = useState(false)

    const fetchAddress = async (lat: number, lng: number) => {
        setLoadingAddress(true)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            const data = await response.json()
            const addressObj = data.address || {}

            const streetName = addressObj.road || addressObj.pedestrian || ""
            const houseNumber = addressObj.house_number || ""
            const city = addressObj.city || addressObj.town || addressObj.village || addressObj.municipality || ""

            const streetInfo = [houseNumber, streetName].filter(Boolean).join(" ")
            const fullAddress = [streetInfo, city].filter(Boolean).join(", ")

            setAddress(fullAddress || "Adresse inconnue")
        } catch (error) {
            console.error("Erreur lors de la récupération de l'adresse:", error)
            setAddress("Erreur localisation")
        } finally {
            setLoadingAddress(false)
        }
    }

    const watchId = useRef<number | null>(null)

    const refreshLocation = useCallback(() => {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)

        watchId.current = navigator.geolocation.watchPosition((pos) => {
            const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setCoords(newCoords)
            // Only fetch address once every few minutes or if distance moved is significant to save API calls
            fetchAddress(newCoords.lat, newCoords.lng)
        }, (err) => {
            console.error("Erreur GPS:", err)
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        })
    }, [])

    // Refs to hold previous smoothed values for the low-pass filter
    const smoothedAlpha = useRef<number | null>(null)
    const smoothedBeta = useRef<number | null>(null)
    const smoothedGamma = useRef<number | null>(null)

    // Smoothing factor (0 = no new data, 1 = no smoothing). 
    // Reverted to 0.2 for original stability/accuracy balance.
    const SMOOTHING_FACTOR = 0.2

    const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
        let alpha = e.alpha || 0
        let beta = e.beta || 0
        let gamma = e.gamma || 0

        // 1. Establish True Heading (North = 0)
        let heading = alpha

        // Safari iOS provides true heading directly via webkitCompassHeading
        if ('webkitCompassHeading' in e) {
            heading = (e as any).webkitCompassHeading
        } else if (e.absolute && e.alpha !== null) {
            // Android Absolute Orientation (0=N, 90=W, convert to 90=E)
            heading = 360 - e.alpha
        } else {
            // Fallback for non-absolute, assumes initial position is arbitrary. 
            // In a real pro app, we'd need Geolocation Magnetic Declination lookup here.
            heading = 360 - alpha
        }

        // Normalize heading to 0-360
        heading = (heading + 360) % 360

        // 2. Apply Low-Pass Filter to eliminate jitter
        if (smoothedAlpha.current === null) {
            smoothedAlpha.current = heading
            smoothedBeta.current = beta
            smoothedGamma.current = gamma
        } else {
            // Handle 360 -> 0 wraparound for alpha
            let diff = heading - smoothedAlpha.current
            if (diff > 180) diff -= 360
            if (diff < -180) diff += 360

            smoothedAlpha.current = (smoothedAlpha.current + diff * SMOOTHING_FACTOR + 360) % 360
            smoothedBeta.current = (smoothedBeta.current || 0) + (beta - (smoothedBeta.current || 0)) * SMOOTHING_FACTOR
            smoothedGamma.current = (smoothedGamma.current || 0) + (gamma - (smoothedGamma.current || 0)) * SMOOTHING_FACTOR
        }

        setOrientation({
            alpha: smoothedAlpha.current || 0,
            beta: smoothedBeta.current || 0,
            gamma: smoothedGamma.current || 0
        })
    }, [])

    const requestAccess = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceOrientationEvent as any).requestPermission()
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation)
                    setNeedsPermission(false)
                }
            } catch (error) {
                console.error("Permission error:", error)
            }
        } else {
            // Non-iOS 13+ devices
            window.addEventListener('deviceorientation', handleOrientation)
            setNeedsPermission(false)
        }
    }

    useEffect(() => {
        refreshLocation()

        if (typeof window !== "undefined") {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                setNeedsPermission(true)
            } else {
                window.addEventListener("deviceorientation", handleOrientation)
            }
        }

        return () => window.removeEventListener("deviceorientation", handleOrientation)
    }, [handleOrientation])

    useEffect(() => {
        if (coords) {
            // 1. Current position
            const pos = SunCalc.getPosition(date, coords.lat, coords.lng)
            setSunPos({
                azimuth: pos.azimuth, // South=0, West=PI/2
                altitude: pos.altitude
            })

            // 2. Hourly path calculation
            const times = SunCalc.getTimes(date, coords.lat, coords.lng)
            const sunriseStr = times.sunrise.getHours() + times.sunrise.getMinutes() / 60
            const sunsetStr = times.sunset.getHours() + times.sunset.getMinutes() / 60

            const startHour = Math.max(0, Math.floor(sunriseStr - 1))
            const endHour = Math.min(23, Math.ceil(sunsetStr + 1))

            const path: HourlySunPos[] = []

            for (let h = startHour; h <= endHour; h++) {
                const hDate = new Date(date)
                hDate.setHours(h, 0, 0, 0)
                const hPos = SunCalc.getPosition(hDate, coords.lat, coords.lng)

                // Only include if at least slightly above/below horizon
                if (hPos.altitude > -0.2) {
                    path.push({
                        hour: h,
                        label: `${h}:00`,
                        azimuth: hPos.azimuth, // South=0, West=PI/2
                        altitude: hPos.altitude
                    })
                }
            }
            setHourlyPath(path)
        }
    }, [coords, date])

    return { sunPos, hourlyPath, orientation, coords, address, date, setDate, loadingAddress, refreshLocation, needsPermission, requestAccess }
}
