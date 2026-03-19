import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getTournaments } from "@/lib/data/tournaments";
import { Trophy, ArrowRight } from "lucide-react";

const statusVariant: Record<string, "green" | "yellow" | "blue" | "gray"> = {
  active: "green", registration: "yellow", upcoming: "blue", completed: "gray",
};

export default async function ActiveTournaments() {
  const tournaments = await getTournaments();
  const active = tournaments.filter((t) => t.status !== "completed").slice(0, 3);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-lg">Tournaments</h2>
        <Link href="/tournaments" className="text-sm text-padel-green hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {active.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`}>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                <Trophy className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                <p className="text-xs text-gray-500">{t.registeredTeams.length}/{t.maxTeams} teams · {t.startDate}</p>
              </div>
              <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
