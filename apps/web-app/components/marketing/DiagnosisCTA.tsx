import Link from "next/link";
import config from "@/config";
import ButtonLeadModal from "@/components/marketing/ButtonLeadModal";

const DiagnosisCTA = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0d9488] to-[#0f766e] section-spacing-sm lg:section-spacing">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

      <div className="relative container-base text-center">
        <div className="container-narrow mx-auto">
          <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight mb-6 text-white">
            Ainda em dúvida se o Dinio é para você?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed font-medium">
            Faça o Diagnóstico Dinio e experimente, em poucos minutos, a clareza
            que você pode ter sobre seus gastos no dia a dia.
          </p>
        </div>

        {config.leadMode ? (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <ButtonLeadModal
              buttonVariant="white"
              buttonText="Fazer diagnóstico gratuito"
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/diagnostico"
                className="btn btn-lg bg-white text-[#0f766e] hover:bg-[#f0fdfa] border-none px-8 rounded-xl font-bold shadow-lg w-full sm:w-auto !normal-case"
              >
                Fazer diagnóstico gratuito
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
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default DiagnosisCTA;
