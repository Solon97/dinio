"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import config from "@/config";

interface MarketingHeaderProps {
  logo?: ReactNode;
  desktopNav?: ReactNode;
  mobileNav?: ReactNode;
  cta?: ReactNode;
  className?: string;
}

const MarketingHeader = ({
  logo,
  desktopNav,
  mobileNav,
  cta,
  className = "",
}: MarketingHeaderProps) => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  // Default Logo if none provided
  const Logo = logo || (
    <Link
      className="flex items-center shrink-0"
      href="/"
      title={`${config.appName} homepage`}
    >
      <span className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-teal-500 lowercase select-none">
        {config.appName}
      </span>
    </Link>
  );

  return (
    <header className={`bg-white border-b border-[#e2e8f0] ${className}`}>
      <nav
        className="container-base flex items-center justify-between py-3 sm:py-4"
        aria-label="Global"
      >
        {/* Logo */}
        <div className="flex lg:flex-1">{Logo}</div>

        {/* Burger button mobile */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Abrir menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-[#334155]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Links desktop */}
        <div className="hidden lg:flex lg:justify-center lg:gap-8 xl:gap-12 lg:items-center">
          {desktopNav}
        </div>

        {/* CTA desktop */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">{cta}</div>
      </nav>

      {/* Mobile menu */}
      <div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-slate-900/80"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />

        <div className="fixed inset-y-0 right-0 z-10 w-full px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto bg-white sm:max-w-sm sm:ring-1 sm:ring-[#e2e8f0] transform origin-right transition ease-in-out duration-300">
          {/* Logo mobile */}
          <div className="flex items-center justify-between">
            {Logo}
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Fechar menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-[#334155]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Links mobile */}
          <div className="flow-root mt-6">
            <div className="py-4">
              <div className="flex flex-col gap-y-4 items-start">
                {mobileNav}
              </div>
            </div>
            {cta && (
              <>
                <div className="border-t border-[#e2e8f0] my-4"></div>
                {/* CTA mobile */}
                <div className="flex flex-col">{cta}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MarketingHeader;
