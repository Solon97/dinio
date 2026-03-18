import Image from "next/image";

const WhatsAppMockup = () => (
  <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-neutral-100">
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
    <div
      className="bg-[#ECE5DD] px-3 py-4 space-y-2.5"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4ccc4' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }}
    >
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

export default WhatsAppMockup;
