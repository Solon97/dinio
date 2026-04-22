import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import {
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME,
} from "@opentelemetry/semantic-conventions";
import { observabilityConfig } from "./libs/observability/config";

let providerRegistered = false;
let warnedAboutMissingAxiom = false;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || providerRegistered) {
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

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: observabilityConfig.serviceName,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: observabilityConfig.environment,
    }),
    spanProcessors: [
      new SimpleSpanProcessor(
        new OTLPTraceExporter({
          url: `https://${observabilityConfig.axiom.host}/v1/traces`,
          headers: {
            Authorization: `Bearer ${observabilityConfig.axiom.token}`,
            "X-Axiom-Dataset": String(observabilityConfig.axiom.dataset),
          },
        }),
      ),
    ],
  });

  provider.register();
  providerRegistered = true;
}
