import { SpanStatusCode, trace } from "@opentelemetry/api";

type SpanAttributeValue = string | number | boolean;

type SpanAttributes = Record<string, SpanAttributeValue>;

const tracer = trace.getTracer("dinio-web-app");

export async function runWithSpan<T>(
  spanName: string,
  attributes: SpanAttributes,
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(spanName, async (span) => {
    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
      span.setAttribute(attributeName, attributeValue);
    }

    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "unknown_error",
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
