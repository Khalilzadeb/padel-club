"use client";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import { courts } from "@/lib/data/courts";
import { bookingsStore, addBooking } from "@/lib/data/bookings";
import { players } from "@/lib/data/players";
import BookingCalendar from "@/components/bookings/BookingCalendar";
import BookingForm from "@/components/bookings/BookingForm";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Zap, Sun, CheckCircle } from "lucide-react";

export default function CourtBookingPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params);
  const court = courts.find((c) => c.id === courtId);
  if (!court) return notFound();

  const [bookings, setBookings] = useState(bookingsStore);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; startTime: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSlotSelect = (date: string, startTime: string) => {
    setSelectedSlot({ date, startTime });
    setShowModal(true);
  };

  const handleConfirm = (playerIds: string[], notes: string) => {
    if (!selectedSlot) return;
    const endHour = parseInt(selectedSlot.startTime.split(":")[0]) + 1;
    const endTime = `${endHour.toString().padStart(2, "0")}:00`;
    const newBooking = {
      id: `b${Date.now()}`,
      courtId: court.id,
      playerIds,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime,
      durationMinutes: 60,
      status: "confirmed" as const,
      createdAt: new Date().toISOString(),
      notes,
      totalPrice: court.pricePerHour,
    };
    addBooking(newBooking);
    setBookings([...bookingsStore]);
    setShowModal(false);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 4000);
  };

  const surfaceLabel = { crystal: "Crystal Glass", "artificial-grass": "Artificial Grass", concrete: "Concrete" }[court.surface];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {confirmed && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-padel-green text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Booking confirmed!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Court info sidebar */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{court.name}</h1>
            <p className="text-gray-500 mt-1">{surfaceLabel} · {court.type}</p>
          </div>

          <Card className="p-5">
            <div className="h-32 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <svg viewBox="0 0 200 120" className="w-36 h-20 opacity-50">
                <rect x="10" y="10" width="180" height="100" rx="4" fill="none" stroke="#1a7a3c" strokeWidth="3" />
                <line x1="100" y1="10" x2="100" y2="110" stroke="#1a7a3c" strokeWidth="2" />
                <line x1="10" y1="60" x2="190" y2="60" stroke="#1a7a3c" strokeWidth="1.5" strokeDasharray="4" />
                <rect x="50" y="30" width="100" height="60" fill="none" stroke="#1a7a3c" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Price per hour</span>
                <span className="font-bold text-padel-green text-lg">${(court.pricePerHour / 100).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Type</span>
                <div className="flex items-center gap-1">
                  {court.type === "indoor" ? <Zap className="w-4 h-4 text-yellow-500" /> : <Sun className="w-4 h-4 text-orange-400" />}
                  <span className="text-sm capitalize text-gray-700">{court.type}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Surface</span>
                <Badge variant="blue">{court.surface}</Badge>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Features</p>
              <div className="flex flex-wrap gap-1.5">
                {court.features.map((f) => (
                  <span key={f} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{f}</span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Select a Time Slot</h2>
            <BookingCalendar courtId={court.id} bookings={bookings} onSlotSelect={handleSlotSelect} />
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Confirm Booking"
        size="md"
      >
        {selectedSlot && (
          <BookingForm
            court={court}
            date={selectedSlot.date}
            startTime={selectedSlot.startTime}
            players={players}
            onConfirm={handleConfirm}
            onCancel={() => setShowModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}
