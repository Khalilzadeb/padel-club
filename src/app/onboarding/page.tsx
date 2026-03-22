"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

type Level = "beginner" | "intermediate" | "advanced" | "pro";
type Position = "drive" | "revés" | "flexible";
type Hand = "right" | "left";
type Gender = "male" | "female" | "other" | "";

const LEVELS: { value: Level; label: string; emoji: string; desc: string }[] = [
  { value: "beginner", label: "Beginner", emoji: "🌱", desc: "Just starting out, learning the basics" },
  { value: "intermediate", label: "Intermediate", emoji: "⚡", desc: "Playing regularly, understand tactics" },
  { value: "advanced", label: "Advanced", emoji: "🔥", desc: "Competitive player, strong technique" },
  { value: "pro", label: "Pro", emoji: "🏆", desc: "Tournament level, elite performance" },
];

const POSITIONS: { value: Position; label: string; side: string; desc: string }[] = [
  { value: "drive", label: "Drive", side: "Right side", desc: "Forehand dominant, prefer the right side of the court" },
  { value: "revés", label: "Revés", side: "Left side", desc: "Backhand dominant, prefer the left side of the court" },
  { value: "flexible", label: "Flexible", side: "Both sides", desc: "Comfortable playing either side" },
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [level, setLevel] = useState<Level>("intermediate");
  const [position, setPosition] = useState<Position>("flexible");
  const [hand, setHand] = useState<Hand>("right");
  const [gender, setGender] = useState<Gender>("");

  const canNext = () => {
    if (step === 1) return name.trim().length >= 2;
    return true;
  };

  const handleFinish = async () => {
    if (!user?.playerId) return;
    setSaving(true);
    try {
      await fetch(`/api/players/${user.playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          level,
          position,
          hand,
          gender: gender || undefined,
          onboarding_done: true,
        }),
      });
      router.replace("/");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-padel-green rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white text-2xl font-black">P</span>
          </div>
          <p className="text-sm text-gray-400">Step {step} of {TOTAL_STEPS}</p>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
          <div className="bg-padel-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Welcome! 👋</h2>
                <p className="text-gray-500 mt-1 text-sm">Let&apos;s set up your profile. First, what&apos;s your name?</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Your level</h2>
                <p className="text-gray-500 mt-1 text-sm">How experienced are you at padel?</p>
              </div>
              <div className="space-y-2">
                {LEVELS.map((l) => (
                  <button key={l.value} type="button" onClick={() => setLevel(l.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${level === l.value ? "border-padel-green bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <span className="text-2xl">{l.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${level === l.value ? "text-padel-green" : "text-gray-800"}`}>{l.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l.desc}</p>
                    </div>
                    {level === l.value && <Check className="w-4 h-4 text-padel-green flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Court position</h2>
                <p className="text-gray-500 mt-1 text-sm">Which side of the court do you prefer?</p>
              </div>
              <div className="space-y-2">
                {POSITIONS.map((p) => (
                  <button key={p.value} type="button" onClick={() => setPosition(p.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${position === p.value ? "border-padel-green bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${position === p.value ? "text-padel-green" : "text-gray-800"}`}>{p.label}</p>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{p.side}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                    </div>
                    {position === p.value && <Check className="w-4 h-4 text-padel-green flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Playing hand</h2>
                <p className="text-gray-500 mt-1 text-sm">Which hand do you play with?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["right", "left"] as const).map((h) => (
                  <button key={h} type="button" onClick={() => setHand(h)}
                    className={`py-8 rounded-xl border-2 text-center transition-all ${hand === h ? "border-padel-green bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <span className="text-3xl block mb-2">{h === "right" ? "🤜" : "🤛"}</span>
                    <p className={`font-semibold text-sm ${hand === h ? "text-padel-green" : "text-gray-700"}`}>{h === "right" ? "Right-handed" : "Left-handed"}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Almost done!</h2>
                <p className="text-gray-500 mt-1 text-sm">Gender <span className="text-gray-400">(optional — used for tournament categories)</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "male", label: "Male", emoji: "👨" },
                  { value: "female", label: "Female", emoji: "👩" },
                  { value: "other", label: "Other", emoji: "🧑" },
                  { value: "", label: "Prefer not to say", emoji: "🤐" },
                ] as const).map((g) => (
                  <button key={String(g.value)} type="button" onClick={() => setGender(g.value as Gender)}
                    className={`py-5 rounded-xl border-2 text-center transition-all ${gender === g.value ? "border-padel-green bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <span className="text-2xl block mb-1">{g.emoji}</span>
                    <p className={`font-medium text-xs ${gender === g.value ? "text-padel-green" : "text-gray-600"}`}>{g.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-padel-green text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-padel-green text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Finish Setup</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
