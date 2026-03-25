"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "padelon_guide_seen";

export default function WelcomeGuide() {
  const { t } = useLocale();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show for guests (not logged in) and only once
    if (!loading && !user && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [loading, user]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const handleStart = () => {
    dismiss();
    router.push("/open-games");
  };

  if (!open) return null;

  const steps = t.guide.steps as { icon: string; title: string; desc: string }[];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />
      <div className="relative bg-white dark:bg-gray-800 w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden">
        {/* Mobile drag indicator */}
        <div className="md:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="px-6 pt-6 pb-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.guide.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.guide.subtitle}</p>
        </div>

        <div className="px-6 py-4 space-y-3">
          {steps.map((step) => (
            <div key={step.title} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <span className="text-2xl leading-none mt-0.5">{step.icon}</span>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{step.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-2">
          <Button className="flex-1" onClick={handleStart}>{t.guide.start}</Button>
          <Button variant="ghost" onClick={dismiss}>{t.guide.skip}</Button>
        </div>
      </div>
    </div>
  );
}
