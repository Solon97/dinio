import { ReactNode } from "react";
import Footer from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
