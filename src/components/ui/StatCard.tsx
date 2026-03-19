import Card from "./Card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
  color?: "green" | "blue" | "purple" | "orange";
}

export default function StatCard({ label, value, icon, trend, color = "green" }: StatCardProps) {
  const colorMap = {
    green: "bg-green-50 text-padel-green",
    blue: "bg-blue-50 text-padel-blue",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1 font-medium", trend.up ? "text-green-600" : "text-red-500")}>
              {trend.up ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", colorMap[color])}>{icon}</div>
      </div>
    </Card>
  );
}
