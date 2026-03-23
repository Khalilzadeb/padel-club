"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { eloToDisplayLevel } from "@/lib/elo";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

type Position = "drive" | "revés" | "flexible";
type Hand = "right" | "left";
type Gender = "male" | "female" | "other" | "";

// Max pts = 3+4+2+0+3+4+4 = 20
// Linear ELO range: 600 (0 pts) → 1400 (20 pts)
function calcElo(pts: number): { elo: number; dbLevel: string; emoji: string } {
  const elo = Math.round(600 + (pts / 20) * 800);
  const dbLevel =
    elo < 800  ? "beginner" :
    elo < 1050 ? "intermediate" :
    elo < 1250 ? "advanced" : "pro";
  const emoji =
    elo < 800  ? "🌱" :
    elo < 1050 ? "⚡" :
    elo < 1250 ? "🔥" : "🏆";
  return { elo, dbLevel, emoji };
}

// Steps: 1=name, 2-8=survey Q1-Q7, 9=position, 10=hand, 11=gender, 12=result
const TOTAL_STEPS = 12;
const SURVEY_START = 2;
const SURVEY_END = 8;

const POSITIONS: { value: Position; label: string; side: string; desc: string }[] = [
  { value: "drive",    label: "Drive",    side: "Right side",  desc: "Forehand dominant, prefer the right side of the court" },
  { value: "revés",    label: "Revés",    side: "Left side",   desc: "Backhand dominant, prefer the left side of the court" },
  { value: "flexible", label: "Flexible", side: "Both sides",  desc: "Comfortable playing either side" },
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const { t } = useLocale();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({});
  const [position, setPosition] = useState<Position>("flexible");
  const [hand, setHand] = useState<Hand>("right");
  const [gender, setGender] = useState<Gender>("");

  // Use translated questions from i18n
  const SURVEY = t.onboarding.questions;

  const surveyIndex = step - SURVEY_START; // 0-6 when in survey
  const inSurvey = step >= SURVEY_START && step <= SURVEY_END;
  const currentQ = inSurvey ? SURVEY[surveyIndex] : null;

  const totalPts = Object.entries(surveyAnswers)
    .filter(([key]) => !key.endsWith("_idx"))
    .reduce((a, [, b]) => a + b, 0);
  const result = calcElo(totalPts);

  const canNext = () => {
    if (step === 1) return name.trim().length >= 2;
    if (inSurvey && currentQ) return surveyAnswers[currentQ.id] !== undefined;
    return true;
  };

  const handleFinish = async () => {
    if (!user?.playerId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${user.playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          level: result.dbLevel,
          position,
          hand,
          gender: gender || undefined,
          elo_rating: result.elo,
          onboarding_done: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to save profile. Please try again.");
        return;
      }
      // Update cached user immediately so OnboardingGuard doesn't re-trigger
      updateUser({ onboardingDone: true, name: name.trim() });
      window.location.href = "/";
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const phaseLabel = step === 1
    ? t.onboarding.step1Title
    : inSurvey
    ? `${t.onboarding.levelTestTitle} · ${t.onboarding.question} ${surveyIndex + 1} ${t.onboarding.of} ${SURVEY.length}`
    : step <= 11
    ? t.profile.editProfile
    : t.onboarding.yourLevel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-padel-green rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white text-2xl font-black">P</span>
          </div>
          <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">{phaseLabel}</p>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-8">
          <div className="bg-padel-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">

          {/* Step 1 — Name */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.onboarding.welcomeTitle} 👋</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t.onboarding.welcomeSubtitle}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t.onboarding.step1Title}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.onboarding.step1Placeholder}
                  autoFocus
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* Steps 2-8 — Survey */}
          {inSurvey && currentQ && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{currentQ.question}</h2>
              <div className="space-y-2">
                {currentQ.options.map((opt, i) => {
                  const isSelected = surveyAnswers[currentQ.id + "_idx"] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSurveyAnswers((prev) => ({ ...prev, [currentQ.id]: opt.pts, [currentQ.id + "_idx"]: i }))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all text-sm ${
                        isSelected
                          ? "border-padel-green bg-green-50 dark:bg-green-900/20 text-padel-green font-medium"
                          : "border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? "border-padel-green bg-padel-green" : "border-gray-300 dark:border-gray-600"}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 9 — Position */}
          {step === 9 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.profile.position}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Which side of the court do you prefer?</p>
              </div>
              <div className="space-y-2">
                {POSITIONS.map((p) => (
                  <button key={p.value} type="button" onClick={() => setPosition(p.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${position === p.value ? "border-padel-green bg-green-50 dark:bg-green-900/20" : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${position === p.value ? "text-padel-green" : "text-gray-800 dark:text-gray-200"}`}>{p.label}</p>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{p.side}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                    </div>
                    {position === p.value && <Check className="w-4 h-4 text-padel-green flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 10 — Hand */}
          {step === 10 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.profile.hand}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Which hand do you play with?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["right", "left"] as const).map((h) => (
                  <button key={h} type="button" onClick={() => setHand(h)}
                    className={`py-8 rounded-xl border-2 text-center transition-all ${hand === h ? "border-padel-green bg-green-50 dark:bg-green-900/20" : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"}`}>
                    <span className="text-3xl block mb-2">{h === "right" ? "🤜" : "🤛"}</span>
                    <p className={`font-semibold text-sm ${hand === h ? "text-padel-green" : "text-gray-700 dark:text-gray-300"}`}>
                      {h === "right" ? t.profile.right : t.profile.left}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 11 — Gender */}
          {step === 11 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">One more thing</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t.profile.gender} <span className="text-gray-400">(optional — used for tournament categories)</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "male",   label: t.profile.male,             emoji: "👨" },
                  { value: "female", label: t.profile.female,           emoji: "👩" },
                  { value: "other",  label: "Other",                    emoji: "🧑" },
                  { value: "",       label: "Prefer not to say",        emoji: "🤐" },
                ] as const).map((g) => (
                  <button key={String(g.value)} type="button" onClick={() => setGender(g.value as Gender)}
                    className={`py-5 rounded-xl border-2 text-center transition-all ${gender === g.value ? "border-padel-green bg-green-50 dark:bg-green-900/20" : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"}`}>
                    <span className="text-2xl block mb-1">{g.emoji}</span>
                    <p className={`font-medium text-xs ${gender === g.value ? "text-padel-green" : "text-gray-600 dark:text-gray-400"}`}>{g.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 12 — Result */}
          {step === 12 && (
            <div className="text-center space-y-5 py-2">
              <div>
                <p className="text-5xl mb-3">{result.emoji}</p>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.onboarding.yourLevel}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.onboarding.levelTestSubtitle}</p>
              </div>
              <div className="bg-padel-green rounded-2xl py-6 px-8">
                <p className="text-6xl font-black text-white">{eloToDisplayLevel(result.elo)}</p>
                <p className="text-green-100 text-sm mt-1 font-medium">{t.profile.level} · {result.elo} ELO</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.onboarding.startingLevelNote}
              </p>
            </div>
          )}

        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeft className="w-4 h-4" /> {t.common.back}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-padel-green text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {t.onboarding.continue} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-padel-green text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check className="w-4 h-4" /> {t.onboarding.startPlaying}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
