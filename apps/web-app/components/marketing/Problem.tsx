const Arrow = ({ extraStyle }: { extraStyle: string }) => {
  return (
    <svg
      className={`shrink-0 w-10 md:w-12 fill-[#94a3b8] ${extraStyle}`}
      viewBox="0 0 138 138"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M72.9644 5.31431C98.8774 43.8211 83.3812 88.048 54.9567 120.735C54.4696 121.298 54.5274 122.151 55.0896 122.639C55.6518 123.126 56.5051 123.068 56.9922 122.506C86.2147 88.9044 101.84 43.3918 75.2003 3.80657C74.7866 3.18904 73.9486 3.02602 73.3287 3.44222C72.7113 3.85613 72.5484 4.69426 72.9644 5.31431Z"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M56.5084 121.007C56.9835 118.685 57.6119 115.777 57.6736 115.445C59.3456 106.446 59.5323 97.67 58.4433 88.5628C58.3558 87.8236 57.6824 87.2948 56.9433 87.3824C56.2042 87.4699 55.6756 88.1435 55.7631 88.8828C56.8219 97.7138 56.6432 106.225 55.0203 114.954C54.926 115.463 53.5093 121.999 53.3221 123.342C53.2427 123.893 53.3688 124.229 53.4061 124.305C53.5887 124.719 53.8782 124.911 54.1287 125.015C54.4123 125.13 54.9267 125.205 55.5376 124.926C56.1758 124.631 57.3434 123.699 57.6571 123.487C62.3995 120.309 67.4155 116.348 72.791 113.634C77.9171 111.045 83.3769 109.588 89.255 111.269C89.9704 111.475 90.7181 111.057 90.9235 110.342C91.1288 109.626 90.7117 108.878 89.9963 108.673C83.424 106.794 77.3049 108.33 71.5763 111.223C66.2328 113.922 61.2322 117.814 56.5084 121.007Z"
        />
      </g>
    </svg>
  );
};

const Step = ({
  emoji,
  text,
  subtext,
}: {
  emoji: string;
  text: string;
  subtext?: string;
}) => {
  return (
    <div className="flex flex-col gap-2 items-center justify-center text-center flex-1 min-w-0">
      <span className="text-3xl sm:text-4xl">{emoji}</span>
      <h3 className="font-bold text-[#1e293b] text-sm sm:text-base">{text}</h3>
      {subtext && (
        <p className="text-xs sm:text-sm text-[#64748b]">{subtext}</p>
      )}
    </div>
  );
};

// Problem Agitation: Baseado nas dores da persona do Dinio
// Pessoa que recebe salário fixo, sente que o dinheiro "evapora", já tentou planilhas mas desistiu
// Vive o ciclo: recebe – paga contas – gasta – se culpa – promete mudar
const Problem = () => {
  return (
    <section className="bg-[#f8fafc]">
      <div className="container-base section-spacing text-center">
        <div className="container-narrow mx-auto mb-10 md:mb-16">
          <h2 className="font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 md:mb-6 text-[#0f172a]">
            O dinheiro acaba antes do mês terminar?
          </h2>
          <p className="text-base sm:text-lg text-[#64748b] leading-relaxed">
            Você organiza tudo, mas o mês continua imprevisível.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-4 md:gap-6 max-w-4xl mx-auto">
          <Step
            emoji="💸"
            text="Recebe o salário"
            subtext="Promete que esse mês vai ser diferente"
          />

          <Arrow extraStyle="max-md:hidden md:-rotate-90 shrink-0" />
          <svg
            className="w-6 h-6 md:hidden text-[#94a3b8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>

          <Step
            emoji="😰"
            text="Perde o controle"
            subtext="Gastos pequenos que viram uma bola de neve"
          />

          <Arrow extraStyle="max-md:hidden md:-rotate-90 shrink-0" />
          <svg
            className="w-6 h-6 md:hidden text-[#94a3b8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>

          <Step
            emoji="😔"
            text="Culpa e frustração"
            subtext="O mês acaba e a conta não fecha"
          />
        </div>

        {/* Frase de transição */}
        <div className="mt-12 md:mt-20">
          <p className="text-lg sm:text-xl md:text-2xl text-[#475569] font-medium container-narrow mx-auto">
            E se você soubesse{" "}
            <span className="text-[#0d9488] font-bold">
              exatamente quanto pode gastar
            </span>{" "}
            todo dia, sem culpa?
          </p>
        </div>
      </div>
    </section>
  );
};

export default Problem;
