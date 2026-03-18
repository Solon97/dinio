export type Theme =
  | "light"
  | "dark"
  | "cupcake"
  | "bumblebee"
  | "emerald"
  | "corporate"
  | "synthwave"
  | "retro"
  | "cyberpunk"
  | "valentine"
  | "halloween"
  | "garden"
  | "forest"
  | "aqua"
  | "lofi"
  | "pastel"
  | "fantasy"
  | "wireframe"
  | "black"
  | "luxury"
  | "dracula"
  | "";

export interface ConfigProps {
  appName: string;
  appDescription: string;
  domainName: string;
  crisp: {
    id?: string;
    onlyShowOnRoutes?: string[];
  };
  stripe: {
    plans: {
      id: "default_yearly";
      isFeatured?: boolean;
      recurrency: "monthly" | "yearly";
      name: string;
      description?: string;
      price: number;
      priceAnchor?: number;
      /** Badge text displayed on top right (e.g., "95% OFF no 1º mês") */
      badge?: string;
      /** For yearly plans: equivalent monthly price to display */
      equivalentMonthlyPrice?: number;
      /** Note displayed below the price (e.g., "* Valor equivalente ao plano anual de R$ 197,00") */
      priceNote?: string;
      /** Renewal note displayed below the button */
      renewalNote?: string;
      features: {
        name: string;
      }[];
    }[];
  };
  aws?: {
    bucket?: string;
    bucketUrl?: string;
    cdn?: string;
  };
  resend: {
    fromNoReply: string;
    fromAdmin: string;
    supportEmail?: string;
  };
  colors: {
    theme: Theme;
    main: string;
  };
  auth: {
    loginUrl: string;
    callbackUrl: string;
    enableDevAuth: boolean;
  };
  leadMode: boolean;
}
