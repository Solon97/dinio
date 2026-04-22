const DEFAULT_SERVICE_NAME = "dinio-web-app";

const axiomHost = process.env.AXIOM_HOST;
const axiomToken = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET;

const environment =
  process.env.OTEL_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

export const observabilityConfig = {
  serviceName: process.env.OTEL_SERVICE_NAME || DEFAULT_SERVICE_NAME,
  environment,
  axiom: {
    host: axiomHost,
    token: axiomToken,
    dataset: axiomDataset,
    enabled: Boolean(axiomHost && axiomToken && axiomDataset),
  },
} as const;
