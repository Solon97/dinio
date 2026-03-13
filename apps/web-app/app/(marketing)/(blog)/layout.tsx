import { ReactNode, Suspense } from "react";
import HeaderBlog from "@/components/marketing/HeaderBlog";

export default function SimpleHeaderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<div className="h-16 w-full" />}>
        <HeaderBlog />
      </Suspense>

      <main className="min-h-screen max-w-6xl mx-auto p-8">{children}</main>

      <div className="h-24" />
    </>
  );
}
