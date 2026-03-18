import Link from "next/link";
import Image from "next/image";
import config from "@/config";

const Footer = () => {
  return (
    <footer className="bg-neutral-900 border-t-2 border-primary-600">
      <div className="container-base section-spacing-sm">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-0">
          {/* Logo e descrição */}
          <div className="shrink-0 text-center lg:text-left lg:w-64">
            <Link
              href="/#"
              aria-current="page"
              className="flex justify-center lg:justify-start items-center"
            >
              <Image src="/logo.png" alt={config.appName} width={80} height={32} className="brightness-0 invert" />
            </Link>

            <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
              {config.appDescription}
            </p>
            <p className="mt-4 text-xs text-neutral-600">
              © {new Date().getFullYear()} {config.appName}. Todos os direitos
              reservados.
            </p>
          </div>

          {/* Links */}
          <div className="grow flex flex-col sm:flex-row flex-wrap justify-center lg:justify-end gap-8 sm:gap-12 lg:gap-16">
            <div className="text-center sm:text-left">
              <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-4">
                Sobre
              </div>
              <div className="flex flex-col gap-2.5 text-sm">
                <Link
                  href="/tos"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  Termos de uso
                </Link>
                <Link
                  href="/privacy-policy"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  Política de privacidade
                </Link>
                <Link
                  href="/cookies-policy"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  Política de cookies
                </Link>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-4">
                Suporte
              </div>
              <div className="flex flex-col gap-2.5 text-sm">
                {config.resend.supportEmail && (
                  <Link
                    href={`mailto:${config.resend.supportEmail}`}
                    target="_blank"
                    className="text-neutral-400 hover:text-primary-400 transition-colors"
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
