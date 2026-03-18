"use client";

import Link from "next/link";
import MarketingHeader from "./MarketingHeader";
import ButtonSignin from "@/components/shared/ButtonSignin";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/#como-funciona",
    label: "Como funciona",
  },
  {
    href: "/#trial",
    label: "Preços",
  },
  {
    href: "/#perguntas",
    label: "Perguntas",
  },
];

const cta = (
  <ButtonSignin
    text="Entrar"
    extraStyle="bg-[#0d9488] hover:bg-[#0f766e] text-white border-none rounded-lg px-5 py-2 text-sm font-medium"
  />
);

const HeaderLanding = () => {
  const NavLinks = (
    <>
      {links.map((link) => (
        <Link
          href={link.href}
          key={link.href}
          className="text-sm text-neutral-500 hover:text-primary-600 font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-primary-600 after:transition-all hover:after:w-full"
          title={link.label}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <MarketingHeader desktopNav={NavLinks} mobileNav={NavLinks} cta={cta} />
  );
};

export default HeaderLanding;
