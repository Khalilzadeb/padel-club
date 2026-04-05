import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venue Admin — PadelOn",
};

export default function VenueAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
