import Image from "next/image";
import ButtonCheckout from "@/components/shared/ButtonCheckout";
import WhatsAppMockup from "@/components/marketing/WhatsAppMockup";

const Hero = () => {
  return (
    <section className="bg-white section-spacing overflow-hidden">
      <div className="container-base">
        <div className="flex flex-col lg:grid lg:grid-cols-[55%_45%] gap-14 lg:gap-12 items-center">

          {/* Left — copy */}
          <div
            className="flex flex-col gap-7"
            style={{ animation: "fadeInUp 0.5s ease-out both" }}
          >
            {/* Label */}
            <div className="flex items-center gap-3">
              <span className="block w-5 h-px bg-primary-600" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary-600">
                Assistente financeiro no WhatsApp
              </span>
            </div>

            {/* H1 */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-neutral-900">
              Não sabe se pode gastar?{" "}
              <em className="not-italic text-primary-600">
                Pergunta para o Dinio.
              </em>
            </h1>

            {/* Body */}
            <p className="text-lg text-neutral-500 leading-relaxed max-w-md">
              Configure sua renda e gastos fixos uma vez. O Dinio calcula sua
              média de gasto diária e recalibra automaticamente — tudo no
              WhatsApp, em segundos.
            </p>

            {/* CTA */}
            <div className="flex flex-col items-start gap-3">
              <div className="w-full sm:w-auto sm:min-w-64">
                <ButtonCheckout
                  recurrency="yearly"
                  text="Começar trial gratuito"
                />
              </div>
              <p className="text-sm text-neutral-400">
                14 dias grátis · Cartão solicitado agora · Cobrança só após o
                trial
              </p>
            </div>
          </div>

          {/* Right — WhatsApp mockup */}
          <div
            className="w-full flex justify-center lg:justify-end"
            style={{ animation: "fadeInUp 0.6s 0.15s ease-out both" }}
          >
            <WhatsAppMockup />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
