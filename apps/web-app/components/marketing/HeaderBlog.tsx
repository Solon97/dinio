"use client";

import { categories } from "@/app/(marketing)/(blog)/blog/_assets/content";
import ButtonSignin from "@/components/shared/ButtonSignin";
import config from "@/config";
import { Popover, Transition } from "@headlessui/react";
import Link from "next/link";
import ButtonLeadModal from "./ButtonLeadModal";
import MarketingHeader from "./MarketingHeader";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/blog/",
    label: "Todos os artigos",
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

const ButtonPopoverCategories = () => {
  return (
    <Popover className="relative z-30">
      {({ open }) => (
        <>
          <Popover.Button
            className="link no-underline flex flex-nowrap items-center gap-1 text-base-content/80 hover:text-base-content active:text-base-content focus:text-base-content duration-100"
            title="Listar categorias do blog"
          >
            Categorias
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 duration-200 ${
                open ? "transform rotate-180 " : ""
              }`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Popover.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel className="absolute left-0 z-30 mt-3 w-screen max-w-full sm:max-w-sm transform">
              {({ close }) => (
                <div className="overflow-hidden rounded-box shadow-lg ring-1 ring-base-content ring-opacity-5">
                  <div className="relative grid gap-2 bg-base-100 p-2 overflow-hidden">
                    {categories.map((category) => (
                      <div key={category.slug} onClick={() => close()}>
                        <Link
                          className="block text-left p-3 -m-1 cursor-pointer hover:bg-base-200 rounded-box duration-200"
                          href={`/blog/category/${category.slug}`}
                        >
                          <div className="">
                            <p className="font-medium mb-0.5">
                              {category?.titleShort || category.title}
                            </p>
                            <p className="text-sm opacity-80">
                              {category?.descriptionShort ||
                                category.description}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

const HeaderBlog = () => {
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
      <ButtonPopoverCategories />
    </>
  );

  return (
    <MarketingHeader desktopNav={NavLinks} mobileNav={NavLinks} cta={cta} />
  );
};

export default HeaderBlog;
