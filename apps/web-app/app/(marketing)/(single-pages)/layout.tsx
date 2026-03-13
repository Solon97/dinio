import { ReactNode, Suspense } from "react";
import HeaderSimple from "@/components/marketing/HeaderSimple";

export default function SimpleHeaderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<div className="h-16 w-full" />}>
        <HeaderSimple />
      </Suspense>
      <main className="min-h-screen">{children}</main>
    </>
  );
}
