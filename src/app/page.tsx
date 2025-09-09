import { Suspense } from "react";
import HomePageClientWrapper from "./HomePageClientWrapper";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <HomePageClientWrapper />
    </Suspense>
  );
}
