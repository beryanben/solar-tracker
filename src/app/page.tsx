"use client"

import CameraView from "@/components/CameraView"
import SolarOverlay from "@/components/SolarOverlay"
import AddressBar from "@/components/AddressBar"
import DateScroller from "@/components/DateScroller"
import useSolarTracking from "@/hooks/useSolarTracking"
import { Sun } from "lucide-react"

export default function Home() {
  const {
    sunPos,
    orientation,
    coords,
    address,
    date,
    setDate,
    loadingAddress,
    refreshLocation
  } = useSolarTracking()

  return (
    <main className="relative min-h-screen w-full bg-black overflow-hidden select-none">
      {/* Background Camera */}
      <CameraView />

      {/* 3D Solar Overlay */}
      {sunPos && (
        <SolarOverlay
          azimuth={sunPos.azimuth}
          altitude={sunPos.altitude}
          orientation={orientation}
        />
      )}

      {/* Address Bar Top */}
      <AddressBar
        address={address}
        loading={loadingAddress}
        onRefresh={refreshLocation}
      />

      {/* AR Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between pt-32">

        {/* Center - AR Viewfinder (Minimalist) */}
        <div className="flex-1 flex items-center justify-center opacity-40">
          <div className="relative w-72 h-72 border border-white/10 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-white/5 rounded-full scale-110" />
            <div className="w-px h-full bg-white/10 absolute left-1/2 -translate-x-1/2" />
            <div className="h-px w-full bg-white/10 absolute top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Footer - Controls & Stats */}
        <div className="flex flex-col gap-0 pointer-events-auto">
          {/* Quick Stats Overlay (Floating above Scroller) */}
          <div className="px-6 mb-4">
            <div className="bg-white/5 backdrop-blur-md inline-flex gap-6 px-6 py-3 rounded-full border border-white/10">
              <div className="flex flex-col">
                <span className="text-white/30 text-[8px] uppercase font-bold tracking-widest">Azimut</span>
                <span className="text-white text-sm font-mono font-bold">
                  {((sunPos?.azimuth || 0) * 180 / Math.PI).toFixed(0)}°
                </span>
              </div>
              <div className="w-px h-6 bg-white/10 my-auto" />
              <div className="flex flex-col">
                <span className="text-white/30 text-[8px] uppercase font-bold tracking-widest">Altitude</span>
                <span className="text-white text-sm font-mono font-bold">
                  {((sunPos?.altitude || 0) * 180 / Math.PI).toFixed(0)}°
                </span>
              </div>
              <div className="w-px h-6 bg-white/10 my-auto" />
              <div className="flex flex-col">
                <span className="text-white/30 text-[8px] uppercase font-bold tracking-widest">Orientation</span>
                <span className="text-white text-sm font-mono font-bold">
                  {orientation?.alpha.toFixed(0) || "0"}° N
                </span>
              </div>
            </div>
          </div>

          <DateScroller
            selectedDate={date}
            onDateChange={setDate}
          />
        </div>
      </div>
    </main>
  )
}