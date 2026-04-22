import { trace } from "@opentelemetry/api";
import { observabilityConfig } from "./config";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

type SerializableError = {
  name: string;
  message: string;
  stack?: string;
};

function getActiveTraceFields(): LogFields {
  const activeSpan = trace.getActiveSpan();

  if (!activeSpan) {
    return {};
  }

  const { traceId, spanId } = activeSpan.spanContext();
  return { traceId, spanId };
}

function toSerializableError(error: unknown): SerializableError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Unknown error",
  };
}

function write(level: LogLevel, scope: string, event: string, fields?: LogFields, error?: unknown): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    scope,
    service: observabilityConfig.serviceName,
    environment: observabilityConfig.environment,
    ...getActiveTraceFields(),
    ...fields,
    ...(error ? { error: toSerializableError(error) } : {}),
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case "debug":
      console.debug(line);
      return;
    case "info":
      console.info(line);
      return;
    case "warn":
      console.warn(line);
      return;
    default:
      console.error(line);
  }
}

export function createLogger(scope: string) {
  return {
    debug(event: string, fields?: LogFields) {
      write("debug", scope, event, fields);
    },
    info(event: string, fields?: LogFields) {
      write("info", scope, event, fields);
    },
    warn(event: string, fields?: LogFields) {
      write("warn", scope, event, fields);
    },
    error(event: string, error?: unknown, fields?: LogFields) {
      write("error", scope, event, fields, error);
    },
  };
}
