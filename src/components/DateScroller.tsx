"use client"

import React, { useRef, useEffect } from "react"

interface DateScrollerProps {
    selectedDate: Date
    onDateChange: (date: Date) => void
}

export default function DateScroller({ selectedDate, onDateChange }: DateScrollerProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Generate dates for the current year
    const dates = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(i)
        d.setDate(15) // Mid-month for representative seasonal position
        return d
    })

    const monthNames = [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
        "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ]

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border-t border-white/10 p-6 pb-12">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Saisons</span>
                    <span className="text-orange-400 text-xs font-mono font-bold">
                        {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
                >
                    {dates.map((d, i) => {
                        const isSelected = d.getMonth() === selectedDate.getMonth()
                        return (
                            <button
                                key={i}
                                onClick={() => onDateChange(d)}
                                className={`flex-shrink-0 min-w-[80px] h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${isSelected
                                        ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/20"
                                        : "bg-white/5 border-white/5 hover:border-white/20"
                                    }`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-tighter ${isSelected ? "text-white/60" : "text-white/20"}`}>
                                    {d.getFullYear()}
                                </span>
                                <span className={`text-lg font-bold ${isSelected ? "text-white" : "text-white/60"}`}>
                                    {monthNames[d.getMonth()]}
                                </span>
                                {isSelected && (
                                    <div className="mt-1 w-1 h-1 rounded-full bg-white animate-pulse" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    )
}
