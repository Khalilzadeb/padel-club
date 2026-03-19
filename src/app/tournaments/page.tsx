import TournamentCard from "@/components/tournaments/TournamentCard";
import { getTournaments } from "@/lib/data/tournaments";
import { Tournament } from "@/lib/types";

const sections: { label: string; statuses: Tournament["status"][] }[] = [
  { label: "Active Tournaments", statuses: ["active"] },
  { label: "Registration Open", statuses: ["registration", "upcoming"] },
  { label: "Past Tournaments", statuses: ["completed"] },
];

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Tournaments</h1>
        <p className="text-gray-500 mt-1">{tournaments.length} tournaments · Compete for ranking points and trophies</p>
      </div>

      {sections.map(({ label, statuses }) => {
        const group = tournaments.filter((t) => statuses.includes(t.status));
        if (group.length === 0) return null;
        return (
          <section key={label} className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.map((t) => <TournamentCard key={t.id} tournament={t} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
