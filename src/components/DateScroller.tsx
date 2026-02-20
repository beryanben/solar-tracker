"use client"

import React from "react"

interface DateScrollerProps {
    selectedDate: Date
    onDateChange: (date: Date) => void
}

export default function DateScroller({ selectedDate, onDateChange }: DateScrollerProps) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const currentMonth = selectedDate.getMonth()

    return (
        <div className="flex items-center gap-6 px-10 py-5 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-full ring-1 ring-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {months.map((month, i) => {
                const isSelected = currentMonth === i
                return (
                    <button
                        key={month}
                        onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                navigator.vibrate(20)
                            }
                            const newDate = new Date(selectedDate)
                            newDate.setMonth(i)
                            onDateChange(newDate)
                        }}
                        className="group relative flex flex-col items-center transition-all duration-500 outline-none"
                    >
                        <span className={`text-[11px] font-mono tracking-widest transition-all duration-300 ${isSelected ? 'text-white font-bold scale-110' : 'text-[#888888] group-hover:text-white/60'}`}>
                            {month}
                        </span>

                        <div className={`mt-2 w-1 h-1 rounded-full bg-[#FF6600] transition-all duration-500 shadow-[0_0_8px_#FF6600] ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-40'}`} />
                    </button>
                )
            })}
        </div>
    )
}
