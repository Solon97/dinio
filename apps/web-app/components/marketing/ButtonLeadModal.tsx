"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";

interface ButtonLeadModalProps {
  extraStyle?: string;
  buttonText?: string;
  buttonVariant?: "primary" | "white";
}

const ButtonLeadModal = ({
  extraStyle = "",
  buttonText = "Começar agora",
  buttonVariant = "primary",
}: ButtonLeadModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    setIsLoading(true);
    try {
      await apiClient.post("/lead", { email });

      toast.success(
        "Obrigado por se inscrever! Em breve enviaremos novidades.",
      );
      setEmail("");
      setIsSubmitted(true);

      setTimeout(() => {
        setIsModalOpen(false);
        setIsSubmitted(false);
      }, 2000);
    } catch (error) {
      toast.error("Erro ao registrar email. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmail("");
    setIsSubmitted(false);
  };

  const buttonClasses =
    buttonVariant === "white"
      ? "btn btn-lg bg-white text-[#0f766e] hover:bg-[#f0fdfa] border-none px-8 rounded-xl font-bold shadow-lg"
      : "btn bg-[#0d9488] hover:bg-[#0f766e] text-white border-none btn-lg px-8 rounded-xl font-bold shadow-md";

  return (
    <>
      <button onClick={openModal} className={`${buttonClasses} ${extraStyle}`}>
        {buttonText}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Modal */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#0f172a] transition-colors"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>

              {!isSubmitted ? (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ccfbf1] rounded-full mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-8 h-8 text-[#0d9488]"
                      >
                        <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-2xl text-[#0f172a] mb-2">
                      Garanta acesso antecipado ao Dinio
                    </h3>
                    <p className="text-[#64748b]">
                      Seja o primeiro a saber quando o Dinio estiver disponível
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        required
                        type="email"
                        value={email}
                        ref={inputRef}
                        autoComplete="email"
                        placeholder="seu@email.com"
                        className="bg-white border border-neutral-200 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#0d9488] focus:border-transparent outline-none transition-all"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn bg-[#0d9488] hover:bg-[#0f766e] text-white border-none w-full rounded-xl font-bold"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          Quero acesso antecipado
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-[#94a3b8]">
                      Enviaremos apenas atualizações importantes. Sem spam.
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d1fae5] rounded-full mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-8 h-8 text-[#10b981]"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl text-[#0f172a] mb-2">
                    Tudo certo!
                  </h3>
                  <p className="text-[#64748b]">
                    Você está na lista. Avisaremos em breve!
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default ButtonLeadModal;
