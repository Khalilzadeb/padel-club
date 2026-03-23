"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export default function GreetingLine({ firstName }: { firstName: string }) {
  const { t } = useLocale();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) setGreeting(t.greeting.morning);
    else if (h >= 12 && h < 18) setGreeting(t.greeting.afternoon);
    else setGreeting(t.greeting.evening);
  }, [t]);

  return <>{greeting}, {firstName} 👋</>;
}
