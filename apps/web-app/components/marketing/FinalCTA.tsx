import ButtonCheckout from "@/components/shared/ButtonCheckout";

const FinalCTA = () => {
  return (
    <section className="bg-primary-600 section-spacing-sm">
      <div className="container-base text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Quanto você pode gastar hoje?
        </h2>
        <p className="text-primary-100 mb-8 text-lg font-normal">
          Descubra em 5 minutos.
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-xs">
            <ButtonCheckout recurrency="yearly" text="Começar trial gratuito" variant="outline-white" />
          </div>
          <p className="text-sm text-primary-200">
            14 dias grátis · sem risco
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
