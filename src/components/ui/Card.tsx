import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-card",
        hover && "transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
