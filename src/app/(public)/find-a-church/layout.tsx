import type { Metadata } from "next";

// Metadata lives here rather than in page.tsx because the page is a client
// component (the whole surface is the interactive search) and client
// components cannot export metadata.
export const metadata: Metadata = {
  title: "Find a Church | The Prayer Jar",
  description:
    "Find a church near you. Search by location to see congregations in your area, with denomination and distance, and save the ones you want to visit.",
  openGraph: {
    title: "Find a Church | The Prayer Jar",
    description:
      "Search for churches near you and find a congregation to belong to.",
    type: "website",
  },
};

export default function FindAChurchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
