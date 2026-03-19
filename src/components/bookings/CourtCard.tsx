import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Court } from "@/lib/types";
import { Zap, Sun, Wind } from "lucide-react";

const surfaceVariant: Record<string, "blue" | "green" | "gray"> = {
  crystal: "blue",
  "artificial-grass": "green",
  concrete: "gray",
};

interface CourtCardProps { court: Court; }

export default function CourtCard({ court }: CourtCardProps) {
  const surfaceColor = {
    crystal: "bg-blue-50",
    "artificial-grass": "bg-green-50",
    concrete: "bg-gray-50",
  }[court.surface];

  return (
    <Card hover className="overflow-hidden">
      {/* Court illustration */}
      <div className={`h-36 ${surfaceColor} flex items-center justify-center relative`}>
        <svg viewBox="0 0 200 120" className="w-40 h-24 opacity-60">
          <rect x="10" y="10" width="180" height="100" rx="4" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-400" />
          <line x1="100" y1="10" x2="100" y2="110" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
          <line x1="10" y1="60" x2="190" y2="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4" className="text-gray-400" />
          <rect x="50" y="30" width="100" height="60" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
        </svg>
        <div className="absolute top-3 left-3">
          <Badge variant={surfaceVariant[court.surface]}>{court.surface}</Badge>
        </div>
        <div className="absolute top-3 right-3">
          {court.type === "indoor" ? (
            <Zap className="w-4 h-4 text-yellow-500" />
          ) : (
            <Sun className="w-4 h-4 text-orange-400" />
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{court.name}</h3>
          <span className="text-padel-green font-bold text-sm">
            ${(court.pricePerHour / 100).toFixed(0)}/hr
          </span>
        </div>
        <p className="text-xs text-gray-500 capitalize mb-3">{court.type} court</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {court.features.slice(0, 3).map((f) => (
            <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
          ))}
          {court.features.length > 3 && (
            <span className="text-xs text-gray-400">+{court.features.length - 3}</span>
          )}
        </div>
        <Link href={`/bookings/${court.id}`}>
          <Button className="w-full" size="sm">Book This Court</Button>
        </Link>
      </div>
    </Card>
  );
}
