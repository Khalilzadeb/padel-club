"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronLeft, Trophy } from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  pro: "Professional",
};
const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 border-green-200",
  intermediate: "bg-blue-100 text-blue-800 border-blue-200",
  advanced: "bg-orange-100 text-orange-800 border-orange-200",
  pro: "bg-purple-100 text-purple-800 border-purple-200",
};

type Answers = {
  selfLevel: string;
  experience: string;
  training: string;
  age: string;
  competition: string;
  volley: number;
  rebounds: number;
};

const QUESTIONS = [
  {
    key: "selfLevel",
    title: "How would you describe your level?",
    options: [
      { value: "initiation", label: "Initiation", desc: "Just getting started" },
      { value: "intermediate", label: "Intermediate", desc: "Play regularly, know the basics" },
      { value: "advanced", label: "Advanced", desc: "Compete in tournaments" },
      { value: "professional", label: "Professional", desc: "Elite level player" },
    ],
  },
  {
    key: "experience",
    title: "How many years have you been practicing padel or any racket sport?",
    options: [
      { value: "never", label: "I have never played before" },
      { value: "lt1", label: "Less than a year" },
      { value: "1to3", label: "Between 1 and 3 years" },
      { value: "3to5", label: "Between 3 and 5 years" },
      { value: "gt5", label: "More than 5 years" },
    ],
  },
  {
    key: "training",
    title: "Have you received or are you receiving training in padel?",
    options: [
      { value: "no", label: "No" },
      { value: "past", label: "Yes, in the past" },
      { value: "currently", label: "Yes, currently" },
    ],
  },
  {
    key: "age",
    title: "How old are you?",
    options: [
      { value: "18to30", label: "Between 18 and 30 years" },
      { value: "31to40", label: "Between 31 and 40 years" },
      { value: "41to50", label: "Between 41 and 50 years" },
      { value: "over50", label: "Over 50" },
    ],
  },
  {
    key: "competition",
    title: "What level do you compete at?",
    options: [
      { value: "friends", label: "Only games between friends" },
      { value: "friendly", label: "Friendly tournaments" },
      { value: "amateur", label: "Amateur leagues" },
      { value: "federated", label: "Federated competitions" },
    ],
  },
  {
    key: "volley",
    title: "On the volley...",
    numeric: true,
    options: [
      { value: 0, label: "I hardly go to the net" },
      { value: 1, label: "I don't feel safe at the net, I make too many mistakes" },
      { value: 2, label: "I can volley forehand and backhand with some difficulties" },
      { value: 3, label: "I have good positioning at the net and I volley confidently" },
      { value: 4, label: "I volley with depth and power" },
    ],
  },
  {
    key: "rebounds",
    title: "On the rebounds...",
    numeric: true,
    options: [
      { value: 0, label: "I don't know how to read the rebounds, I hit before it rebounds" },
      { value: 1, label: "I try, with difficulty, to hit the rebounds on the back wall" },
      { value: 2, label: "I return rebounds on the back wall, it is difficult for me to return double-wall ones" },
      { value: 3, label: "I return double-wall rebounds and reach for quick rebounds" },
      { value: 4, label: "I perform powerful wall descent shots with forehand and backhand" },
    ],
  },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [result, setResult] = useState<{ elo: number; level: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const q = QUESTIONS[step];
  const current = answers[q.key as keyof Answers];
  const total = QUESTIONS.length;

  const select = (val: string | number) => {
    setAnswers((prev) => ({ ...prev, [q.key]: val }));
  };

  const next = async () => {
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      // Submit
      setLoading(true);
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const goToProfile = () => {
    if (user?.playerId) router.push(`/players/${user.playerId}`);
    else router.push("/");
  };

  // Result screen
  if (result) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex w-20 h-20 bg-padel-green rounded-full items-center justify-center mb-6 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Your Result</h1>
          <p className="text-gray-500 mb-8">Based on your answers, here is your starting profile</p>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 mb-6">
            <div className={`inline-flex items-center px-5 py-2 rounded-full text-xl font-bold border mb-4 ${LEVEL_COLORS[result.level]}`}>
              {LEVEL_LABELS[result.level]}
            </div>
            <p className="text-5xl font-black text-gray-900 mb-1">{result.elo}</p>
            <p className="text-gray-400 text-sm">Starting ELO Rating</p>

            <div className="mt-6 pt-6 border-t border-gray-50 text-left space-y-2 text-sm text-gray-500">
              <p>Your ELO will change as you play matches — win against stronger players to climb faster.</p>
            </div>
          </div>

          <button
            onClick={goToProfile}
            className="w-full bg-padel-green text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            Go to my profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-400 mb-1">Step {step + 1} of {total}</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
            <div
              className="bg-padel-green h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{q.title}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {q.options.map((opt) => {
            const isSelected = current === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => select(opt.value)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-padel-green bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className={`font-medium text-sm ${isSelected ? "text-padel-green" : "text-gray-800"}`}>
                  {opt.label}
                </span>
                {"desc" in opt && opt.desc && (
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Nav */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={next}
            disabled={current === undefined || current === null || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-padel-green text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {step === total - 1 ? "See my result" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
