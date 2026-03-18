import { ConfigProps } from "./types/config";

const defaultPlanSettings = {
  badge: "14 dias para experimentar de graça",
  features: [
    { name: "Média recomendada de gasto diária calculada automaticamente", },
    { name: "Recalibração sem esforço ao longo do mês" },
    { name: "Registro de gastos e orientação no WhatsApp" },
    {name: "Teste grátis de 14 dias" },
    { name: "Garantia de 30 dias após a cobrança" },
  ],
  price: 237,
  equivalentMonthlyPrice: 237 / 12,
  recurrency: "yearly",
};

const config: ConfigProps = {
  // REQUIRED
  appName: "Dinio",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "App de controle financeiro simples para organizar finanças pessoais, controlar gastos mensais e saber quanto você pode gastar por dia sem estourar o orçamento",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: process.env.NEXT_PUBLIC_DOMAIN_NAME || "http://localhost:3000",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the recurrency
    plans: [
      {
        ...defaultPlanSettings,
        id: "default_yearly",
        name: "Dinio Premium",
        description: "Saiba exatamente quanto pode gastar todos os dias",
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `Dinio <noreply@resend.dinio.com.br>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Solon do Dinio <solon@resend.dinio.com.br>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "contato@dinio.com.br",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#0d9488",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
    // Enable email/password authentication for non-production environments
    enableDevAuth: !!process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH,
  },
  // LEAD MODE — Enable lead capture mode (waitlist) instead of login/signup
  leadMode: process.env.NEXT_PUBLIC_LEAD_MODE === "true",
} as ConfigProps;

export default config;
