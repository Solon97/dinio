import Image from "next/image";
import ButtonCheckout from "@/components/shared/ButtonCheckout";

const WhatsAppMockup = () => (
  <div className="w-full max-w-sm mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-neutral-100">
    {/* Header bar */}
    <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden p-1">
        <Image src="/logo.png" alt="Dinio" width={28} height={28} />
      </div>
      <div>
        <p className="text-white text-sm font-semibold leading-none">Dinio</p>
        <p className="text-white/70 text-xs mt-0.5">Online agora</p>
      </div>
    </div>

    {/* Chat area */}
    <div className="bg-[#ECE5DD] px-3 py-4 space-y-2.5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4ccc4' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>

      {/* User bubble */}
      <div className="flex justify-end">
        <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[78%] shadow-sm">
          <p className="text-[#111b21] text-sm">Quanto posso gastar hoje?</p>
          <p className="text-[10px] text-[#667781] text-right mt-0.5">09:12 ✓✓</p>
        </div>
      </div>

      {/* Dinio response */}
      <div className="flex justify-start">
        <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] shadow-sm">
          <p className="text-[#111b21] text-sm leading-relaxed">
            Bom dia! 👋<br />
            Sua média de hoje é <strong>R$&nbsp;87</strong>. Você já gastou R$&nbsp;35.<br /><br />
            ✅ Ainda pode gastar <strong>R$&nbsp;52</strong> com tranquilidade.
          </p>
          <p className="text-[10px] text-[#667781] text-right mt-1">09:12</p>
        </div>
      </div>

      {/* User bubble 2 */}
      <div className="flex justify-end">
        <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[78%] shadow-sm">
          <p className="text-[#111b21] text-sm">Gastei R$ 28 no mercado</p>
          <p className="text-[10px] text-[#667781] text-right mt-0.5">14:47 ✓✓</p>
        </div>
      </div>

      {/* Dinio response 2 */}
      <div className="flex justify-start">
        <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] shadow-sm">
          <p className="text-[#111b21] text-sm leading-relaxed">
            Anotado! 🟢<br />
            Ainda sobram <strong>R$&nbsp;24</strong> hoje.<br />
            O mês segue no controle.
          </p>
          <p className="text-[10px] text-[#667781] text-right mt-1">14:47</p>
        </div>
      </div>
    </div>
  </div>
);

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
