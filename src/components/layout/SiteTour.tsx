"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "padelon_tour_pending";

export default function SiteTour() {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      setOpen(true);
    }
  }, []);

  const steps = t.tour.steps as { icon: string; title: string; desc: string }[];
  const isLast = step === steps.length - 1;

  const dismiss = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOpen(false);
  };

  const handleDone = () => {
    dismiss();
    router.push("/open-games");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white dark:bg-gray-800 w-full md:max-w-sm rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
        {/* Mobile drag bar */}
        <div className="md:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pt-5 pb-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300",
                i === step
                  ? "w-6 h-2 bg-padel-green"
                  : i < step
                  ? "w-2 h-2 bg-padel-green/40"
                  : "w-2 h-2 bg-gray-200 dark:bg-gray-600"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-6 text-center min-h-[220px] flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">{steps[step].icon}</div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3">
            {steps[step].title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {steps[step].desc}
          </p>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-8 flex items-center gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
          ) : (
            <div className="p-2.5 opacity-0 pointer-events-none">
              <ChevronLeft className="w-5 h-5" />
            </div>
          )}

          {isLast ? (
            <button
              onClick={handleDone}
              className="flex-1 flex items-center justify-center gap-2 bg-padel-green hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <Check className="w-4 h-4" />
              {t.tour.done}
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 flex items-center justify-center gap-2 bg-padel-green hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {t.tour.next}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
