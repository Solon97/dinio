"use client";

import config from "@/config";
import { createClient } from "@/libs/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { redirect, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import toast from "react-hot-toast";
import { posthogEvents } from "@/libs/posthog";

function LoginContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  useEffect(() => {
    if (config.leadMode) {
      redirect("/");
    }

    // Capture plan from query params and store in sessionStorage
    const plan = searchParams.get("plan");
    if (plan) {
      posthog.capture(posthogEvents.CHECKOUT_SIGNIN_VIEWED);
      sessionStorage.setItem("selectedPlan", plan);
    }
  }, [searchParams]);
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devAuthData, setDevAuthData] = useState({ email: "", password: "" });

  const handleSignup = async () => {
    setIsLoading(true);

    try {
      const callbackPath = new URL(
        window.location.origin + "/api/auth/callback",
      );
      if (nextPath) {
        callbackPath.searchParams.set("next", nextPath);
      }

      const redirectURL = callbackPath.toString();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectURL,
        },
      });
    } catch (error) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signin-dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(devAuthData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      // Redirect to dashboard/checkout after successful signin
      window.location.href = nextPath ?? config.auth.callbackUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"
      data-theme={config.colors.theme}
    >
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Side (Brand) */}
        <div className="md:w-1/2 bg-teal-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-teal-100 hover:text-white transition-colors mb-8 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Voltar ao início
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 lowercase">
              dinio
            </h1>
            <p className="text-teal-100 text-lg">
              Controle financeiro simples e sem planilhas.
            </p>
          </div>

          <div className="relative z-10 space-y-6 hidden md:block">
            <div className="bg-teal-700/50 p-4 rounded-xl backdrop-blur-sm border border-teal-500/30">
              <p className="font-medium text-lg">
                &quot;O teto de gastos mudou minha vida. Agora sei exatamente
                quanto posso gastar por dia.&quot;
              </p>
              <p className="text-teal-200 text-sm mt-2">— Marina S.</p>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
            </div>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-xs mx-auto w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-slate-400 mb-8">
              Entre para ver seu teto de gastos de hoje.
            </p>

            <div className="space-y-4">
              {/* Email/Password Dev Auth */}
              {config.auth.enableDevAuth && (
                <>
                  <form onSubmit={handleDevSignin} className="space-y-3">
                    <input
                      type="email"
                      placeholder="Email (Dev only)"
                      value={devAuthData.email}
                      onChange={(e) =>
                        setDevAuthData({
                          ...devAuthData,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password (Dev only)"
                      value={devAuthData.password}
                      onChange={(e) =>
                        setDevAuthData({
                          ...devAuthData,
                          password: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        "Sign In (Dev)"
                      )}
                    </button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-slate-400">OR</span>
                    </div>
                  </div>
                </>
              )}

              {/* Google OAuth */}
              <button
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 48 48"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                    />
                    <path
                      fill="#FF3D00"
                      d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                    />
                  </svg>
                )}
                Continuar com Google
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Ao continuar, você concorda com nossos{" "}
              <Link href="/tos" className="text-teal-600 hover:underline">
                Termos de Serviço
              </Link>{" "}
              e{" "}
              <Link
                href="/privacy-policy"
                className="text-teal-600 hover:underline"
              >
                Política de Privacidade
              </Link>{" "}
              e{" "}
              <Link
                href="/cookies-policy"
                className="text-teal-600 hover:underline"
              >
                Política de Cookies
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"
          data-theme={config.colors.theme}
        >
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-teal-600" size={32} />
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
