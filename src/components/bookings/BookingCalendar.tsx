"use client";
import { useState } from "react";
import { Booking } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingCalendarProps {
  courtId: string;
  bookings: Booking[];
  onSlotSelect: (date: string, startTime: string) => void;
}

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const HOURS = [
  ...Array.from({ length: 16 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`),
  "00:00", "01:00", "02:00", "03:00",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BookingCalendar({ courtId, bookings, onSlotSelect }: BookingCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const weekDates = getWeekDates(weekOffset);

  const isBooked = (date: string, time: string) => {
    return bookings.some(
      (b) => b.courtId === courtId && b.date === date && b.startTime <= time && b.endTime > time && b.status !== "cancelled"
    );
  };

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset((w) => w - 1)} disabled={weekOffset <= 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-medium text-gray-700">
          {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <button onClick={() => setWeekOffset((w) => w + 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="w-14 py-2 text-gray-400 font-normal text-right pr-3">Time</th>
              {weekDates.map((d, i) => (
                <th key={i} className={cn("py-2 text-center font-medium min-w-[70px]",
                  fmt(d) === today ? "text-padel-green" : "text-gray-600")}>
                  <div>{DAYS[i]}</div>
                  <div className={cn("text-base font-bold", fmt(d) === today ? "text-padel-green" : "text-gray-900")}>
                    {d.getDate()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="py-0.5 pr-3 text-right text-gray-400">{hour}</td>
                {weekDates.map((d, i) => {
                  const dateStr = fmt(d);
                  const slotKey = `${dateStr}-${hour}`;
                  const booked = isBooked(dateStr, hour);
                  const isPast = dateStr < today || (dateStr === today && hour < new Date().toTimeString().slice(0, 5));
                  const isSelected = selected === slotKey;

                  return (
                    <td key={i} className="py-0.5 px-0.5">
                      <button
                        disabled={booked || isPast}
                        onClick={() => {
                          setSelected(slotKey);
                          onSlotSelect(dateStr, hour);
                        }}
                        className={cn(
                          "w-full h-8 rounded text-xs font-medium transition-all",
                          booked ? "bg-gray-200 text-gray-400 cursor-not-allowed" :
                          isPast ? "bg-gray-50 text-gray-300 cursor-not-allowed" :
                          isSelected ? "bg-padel-green text-white ring-2 ring-padel-green ring-offset-1" :
                          "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                        )}
                      >
                        {booked ? "●" : isSelected ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-padel-green inline-block" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Booked</span>
      </div>
    </div>
  );
}
