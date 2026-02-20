import React from 'react'
import CameraView from '@/components/CameraView'
import SolarOverlay from '@/components/SolarOverlay'
import DateScroller from '@/components/DateScroller'
import useSolarTracking from '@/hooks/useSolarTracking'
import { Navigation } from 'lucide-react'

const App = () => {
    const {
        sunPos,
        orientation,
        address,
        date,
        setDate,
        loadingAddress,
        refreshLocation
    } = useSolarTracking()

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden font-mono select-none">
            {/* Camera Background */}
            <CameraView />

            {/* Top Left: Position Actual */}
            <div className="absolute top-10 left-10 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-2">
                    <span className="text-[#888888] text-[10px] uppercase tracking-[0.3em] font-medium">Position Actual</span>
                    <Navigation className="w-3 h-3 text-[#FF6600] fill-[#FF6600] rotate-45" />
                </div>
                <div className="text-white/60 text-[10px] tracking-wider truncate max-w-[200px]">
                    {loadingAddress ? "..." : address || ""}
                </div>
            </div>

            {/* Center: Sun Path Overlay (2D) */}
            {sunPos && (
                <SolarOverlay
                    azimuth={sunPos.azimuth}
                    altitude={sunPos.altitude}
                    orientation={orientation}
                />
            )}

            {/* Bottom Section: Branding + Date Scroller */}
            <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-8 z-50 px-6">
                {/* Branding Logo */}
                <div className="opacity-70">
                    <img src="/logo.png" alt="Limandat" className="h-[20px] object-contain" />
                </div>

                {/* Pill Month Selector */}
                <DateScroller selectedDate={date} onDateChange={setDate} />
            </div>

            {/* Minimal Background Veil for UI Legibility */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>
    )
}

export default App
