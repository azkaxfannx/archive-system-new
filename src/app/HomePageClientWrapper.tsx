"use client";

import dynamic from "next/dynamic";

const HomePageClient = dynamic(() => import("./HomePageClient"));

export default function HomePageClientWrapper() {
  return <HomePageClient />;
}
