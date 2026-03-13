import { Suspense, ReactNode } from "react";
import HeaderLanding from "@/components/marketing/HeaderLanding";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-16 w-full" />}>
        <HeaderLanding />
      </Suspense>
      <main>{children}</main>
    </>
  );
}
