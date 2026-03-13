import ButtonLeadModal from "@/components/marketing/ButtonLeadModal";
import config from "@/config";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="bg-base-100 section-spacing">
      <div className="container-base flex flex-col items-center justify-center gap-10 lg:gap-14">
        <div className="flex flex-col gap-6 lg:gap-8 items-center justify-center text-center container-narrow">
          {/* Badge de praticidade */}
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ccfbf1] text-[#0f766e] text-sm font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            Leva 5 minutos por dia
          </span>

          <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tracking-tight text-[#0f172a]">
            Saiba exatamente quanto você pode gastar{" "}
            <span className="text-[#0d9488]">todo dia</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-[#64748b] leading-relaxed">
            Com o Dinio você tem clareza para decidir hoje e garantir que o
            dinheiro dure o mês todo
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
            {config.leadMode ? (
              <ButtonLeadModal
                buttonVariant="primary"
                buttonText="Começar agora"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/#pricing"
                  className="btn bg-[#0d9488] hover:bg-[#0f766e] text-white border-none btn-lg px-8 rounded-xl font-bold shadow-md w-full sm:w-auto"
                >
                  Começar agora
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
                </Link>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-[#0d9488] bg-[#ccfbf1]/50 px-2 py-0.5 rounded-full">
                    Garantia do Primeiro Mês
                  </span>
                  <span className="text-xs text-[#94a3b8]">
                    30 dias para testar sem risco
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* <TestimonialsAvatars priority={true} /> */}
        </div>

        {/* Ilustração do conceito - Card de teto diário */}
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 sm:p-8 shadow-lg">
            <div className="text-center space-y-4">
              <p className="text-sm font-medium text-[#64748b] uppercase tracking-wide">
                Seu teto de hoje
              </p>
              <p className="text-5xl sm:text-6xl font-extrabold text-[#0d9488]">
                R$ 87
              </p>
              <div className="flex items-center justify-center gap-2 text-[#10b981]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold">
                  Pode gastar tranquilo
                </span>
              </div>
              <div className="pt-4 border-t border-[#f1f5f9]">
                <p className="text-xs text-[#94a3b8]">
                  Atualizado automaticamente todo dia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
