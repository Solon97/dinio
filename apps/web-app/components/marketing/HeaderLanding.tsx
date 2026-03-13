"use client";

import Link from "next/link";
import config from "@/config";
import MarketingHeader from "./MarketingHeader";
import ButtonSignin from "@/components/shared/ButtonSignin";
import ButtonLeadModal from "./ButtonLeadModal";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/#features",
    label: "Como funciona",
  },
  {
    href: "/#pricing",
    label: "Preços",
  },
  {
    href: "/#faq",
    label: "FAQ",
  },
];

const cta = config.leadMode ? (
  <ButtonLeadModal
    buttonVariant="primary"
    extraStyle="!px-5 !py-2.5 !min-h-0 !h-auto text-sm"
  />
) : (
  <ButtonSignin
    text="Entrar"
    extraStyle="bg-[#0d9488] hover:bg-[#0f766e] text-white border-none"
  />
);

const HeaderLanding = () => {
  const NavLinks = (
    <>
      {links.map((link) => (
        <Link
          href={link.href}
          key={link.href}
          className="text-[#475569] hover:text-[#0d9488] font-medium transition-colors"
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
