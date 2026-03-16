"use client";

import { useUser } from "@/contexts";
import apiClient from "@/libs/api";
import { createClient } from "@/libs/supabase/client";
import { Popover, Transition } from "@headlessui/react";
import {
  ChevronDown,
  CreditCard,
  Crown,
  LogOut,
  MessageCircle,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { toast } from "react-hot-toast";
import NotificationBell from "@/components/app/notifications/NotificationBell";

export default function AppHeader() {
  const router = useRouter();
  const supabase = createClient();
  const { user, refetch } = useUser();
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isUnlinkingWhatsapp, setIsUnlinkingWhatsapp] = useState(false);

  const handleBilling = async () => {
    setIsBillingLoading(true);
    try {
      const { url }: { url: string } = await apiClient.post(
        "/stripe/create-portal",
        { returnUrl: window.location.href },
      );
      window.location.href = url;
    } catch (e) {
      console.error("Billing error", e);
    }
    setIsBillingLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const handleUnlinkWhatsapp = async () => {
    setIsUnlinkingWhatsapp(true);
    try {
      await apiClient.delete("/bot/whatsapp-link/unlink");
      await refetch();
    } catch (e) {
      console.error("Error unlinking WhatsApp", e);
      toast.error("Erro ao desvincular o WhatsApp. Tente novamente.");
    } finally {
      setIsUnlinkingWhatsapp(false);
    }
  };

  const whatsappBotPhone = process.env.NEXT_PUBLIC_WHATSAPP_BOT_PHONE;

  return (
    <header className="w-full border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-bold tracking-tight text-teal-500 lowercase select-none">
            dinio
          </div>
        </Link>

        {/* User Dropdown */}
        {user ? (
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none ring-offset-2 focus:ring-2 ring-teal-500/20">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                        <UserIcon size={16} />
                      </div>
                    )}
                    <div className="hidden sm:block text-left mr-1">
                      <p className="text-sm font-medium text-slate-700 leading-none">
                        {user.displayName}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-1">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-1">
                        {user.isPremium && (
                          <>
                            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg">
                              <Crown size={16} className="fill-current" />
                              <span>Membro Premium</span>
                            </div>
                            <button
                              onClick={handleBilling}
                              disabled={isBillingLoading}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors mb-1 disabled:opacity-50"
                            >
                              {isBillingLoading ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                <CreditCard size={16} />
                              )}
                              Gerenciar assinatura
                            </button>
                          </>
                        )}

                        {user.whatsappLinked ? (
                          <button
                            onClick={handleUnlinkWhatsapp}
                            disabled={isUnlinkingWhatsapp}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-rose-600 transition-colors disabled:opacity-50"
                          >
                            {isUnlinkingWhatsapp ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <MessageCircle size={16} />
                            )}
                            Desvincular WhatsApp
                          </button>
                        ) : (
                          whatsappBotPhone && (
                            <a
                              href={`https://wa.me/${whatsappBotPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-teal-600 transition-colors"
                            >
                              <MessageCircle size={16} />
                              Vincular WhatsApp
                            </a>
                          )
                        )}

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-rose-600 transition-colors"
                        >
                          <LogOut size={16} />
                          Sair
                        </button>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        ) : (
          <Link
            href="/signin"
            className="text-sm font-medium text-slate-600 hover:text-teal-600"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
