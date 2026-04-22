import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME,
} from "@opentelemetry/semantic-conventions";
import { observabilityConfig } from "./libs/observability/config";

let sdk: NodeSDK | null = null;
let warnedAboutMissingAxiom = false;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || sdk) {
    return;
  }

  if (!observabilityConfig.axiom.enabled) {
    if (!warnedAboutMissingAxiom) {
      warnedAboutMissingAxiom = true;
      console.warn(
        "[observability] AXIOM_HOST/AXIOM_TOKEN/AXIOM_DATASET não configurados. OpenTelemetry desativado.",
      );
    }
    return;
  }

  if (process.env.OTEL_DEBUG === "true") {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: observabilityConfig.serviceName,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: observabilityConfig.environment,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `https://${observabilityConfig.axiom.host}/v1/traces`,
      headers: {
        Authorization: `Bearer ${observabilityConfig.axiom.token}`,
        "X-Axiom-Dataset": String(observabilityConfig.axiom.dataset),
      },
    }),
  });

  await sdk.start();
}
