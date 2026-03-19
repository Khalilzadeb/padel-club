import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "blue" | "yellow" | "red" | "gray" | "purple";
  className?: string;
}

export default function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-green-100 text-green-800": variant === "green",
          "bg-blue-100 text-blue-800": variant === "blue",
          "bg-yellow-100 text-yellow-800": variant === "yellow",
          "bg-red-100 text-red-800": variant === "red",
          "bg-gray-100 text-gray-700": variant === "gray",
          "bg-purple-100 text-purple-800": variant === "purple",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
