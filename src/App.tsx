import React from 'react'
import CameraView from '@/components/CameraView'
import SolarOverlay from '@/components/SolarOverlay'
import useSolarTracking from '@/hooks/useSolarTracking'
import { RefreshCw } from 'lucide-react'

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

    const months = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC']

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">
            <CameraView />

            {sunPos && (
                <SolarOverlay
                    azimuth={sunPos.azimuth}
                    altitude={sunPos.altitude}
                    orientation={orientation}
                />
            )}

            {/* Top Bar - Ultra Minimalist */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 pointer-events-auto group" onClick={refreshLocation}>
                        <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium">Position Actuelle</span>
                        <RefreshCw className={`w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors ${loadingAddress ? 'animate-spin' : ''}`} />
                    </div>
                    <p className="text-white/80 text-sm font-light tracking-wide max-w-[200px] truncate">
                        {loadingAddress ? "..." : address || "Localisation..."}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1 font-mono">
                    <div className="text-white/60 text-xs">
                        <span className="text-white/20 mr-2">AZ</span>
                        {((sunPos?.azimuth || 0) * 180 / Math.PI).toFixed(1)}°
                    </div>
                    <div className="text-white/60 text-xs">
                        <span className="text-white/20 mr-2">ALT</span>
                        {((sunPos?.altitude || 0) * 180 / Math.PI).toFixed(1)}°
                    </div>
                </div>
            </div>

            {/* Seasonal Timeline - Ultra Minimalist */}
            <div className="absolute bottom-12 left-0 w-full px-8 pointer-events-none">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-white/20 text-[10px] uppercase tracking-[0.2em]">Saison</span>
                            <span className="text-orange-500/80 text-sm font-medium uppercase tracking-widest">
                                {months[date.getMonth()]} {date.getFullYear()}
                            </span>
                        </div>
                    </div>

                    <div className="relative h-px w-full bg-white/10 pointer-events-auto">
                        <div className="absolute inset-0 flex justify-between">
                            {months.map((m, i) => {
                                const isSelected = date.getMonth() === i
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            const newDate = new Date(date)
                                            newDate.setMonth(i)
                                            setDate(newDate)
                                        }}
                                        className="relative -top-1 px-1 group"
                                    >
                                        <div className={`h-2 w-[1px] transition-all ${isSelected ? 'bg-orange-500 h-4' : 'bg-white/20 group-hover:bg-white/40'}`} />
                                        <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] transition-all ${isSelected ? 'text-orange-500 opacity-100' : 'opacity-0 group-hover:opacity-40 text-white'}`}>
                                            {m}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Reticle (Ultra Discreet) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1 h-1 bg-white/10 rounded-full" />
                <div className="absolute w-24 h-24 border border-white/5 rounded-full" />
            </div>
        </div>
    )
}

export default App
