"use client";

import Link from "next/link";
import MarketingHeader from "./MarketingHeader";
import ButtonSignin from "@/components/shared/ButtonSignin";

const HeaderSimple = () => {
  const cta = (
    <ButtonSignin
      text="Entrar"
      extraStyle="bg-[#0d9488] hover:bg-[#0f766e] text-white border-none"
    />
  );

  return <MarketingHeader cta={cta} />;
};

export default HeaderSimple;
