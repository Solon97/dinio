import Link from "next/link";
import config from "@/config";

const Footer = () => {
  return (
    <footer className="bg-[#0f172a] border-t border-[#1e293b]">
      <div className="container-base section-spacing-sm">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-0">
          {/* Logo e descrição */}
          <div className="flex-shrink-0 text-center lg:text-left lg:w-64">
            <Link
              href="/#"
              aria-current="page"
              className="flex justify-center lg:justify-start items-center"
            >
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-teal-500 lowercase select-none">
                dinio
              </span>
            </Link>

            <p className="mt-3 text-sm text-[#94a3b8]">
              {config.appDescription}
            </p>
            <p className="mt-3 text-xs sm:text-sm text-[#64748b]">
              © {new Date().getFullYear()} {config.appName}. Todos os direitos
              reservados.
            </p>
          </div>

          {/* Recursos */}
          <div className="flex-grow flex flex-col sm:flex-row flex-wrap justify-center lg:justify-end gap-8 sm:gap-12 lg:gap-16">
            <div className="text-center sm:text-left">
              <div className="font-semibold text-[#e2e8f0] tracking-widest text-xs sm:text-sm mb-3 uppercase">
                Recursos
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <Link
                  href="/ferramentas"
                  className="text-[#94a3b8] hover:text-[#14b8a6] transition-colors"
                >
                  Ferramentas Úteis
                </Link>
                <Link
                  href="/diagnostico"
                  className="text-[#94a3b8] hover:text-[#14b8a6] transition-colors"
                >
                  Diagnóstico Dinio
                </Link>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="font-semibold text-[#e2e8f0] tracking-widest text-xs sm:text-sm mb-3 uppercase">
                Sobre
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <Link
                  href="/tos"
                  className="text-[#94a3b8] hover:text-[#14b8a6] transition-colors"
                >
                  Termos de uso
                </Link>
                <Link
                  href="/privacy-policy"
                  className="text-[#94a3b8] hover:text-[#14b8a6] transition-colors"
                >
                  Política de privacidade
                </Link>
                <Link
                  href="/cookies-policy"
                  className="text-[#94a3b8] hover:text-[#14b8a6] transition-colors"
                >
                  Política de cookies
                </Link>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="font-semibold text-[#e2e8f0] tracking-widest text-xs sm:text-sm mb-3 uppercase">
                Suporte
              </div>

              <div className="flex flex-col gap-2 text-sm">
                {config.resend.supportEmail && (
                  <Link
                    href={`mailto:${config.resend.supportEmail}`}
                    target="_blank"
                    className="text-[#94a3b8] hover:text-[#14b8a6] transition-colors"
                    aria-label="Contact Support"
                  >
                    {config.resend.supportEmail}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
