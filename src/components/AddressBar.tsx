"use client"

import React from "react"
import { MapPin, RefreshCw } from "lucide-react"

interface AddressBarProps {
    address: string | null
    loading: boolean
    onRefresh: () => void
}

export default function AddressBar({ address, loading, onRefresh }: AddressBarProps) {
    return (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-orange-500/20 p-2 rounded-xl">
                        <MapPin className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Position Actuelle</span>
                        <p className="text-white text-sm font-medium truncate">
                            {loading ? "Localisation en cours..." : address || "Recherche de l'adresse..."}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw className="w-5 h-5 text-white/60" />
                </button>
            </div>
        </div>
    )
}
