import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";

const isDev = process.env.NODE_ENV !== "production";

export interface AppOptions
  extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}

/**
 * Logger config:
 *  - Development: pino-pretty (colorized, human-readable)
 *  - Production:  plain JSON (structured, parseable by any log aggregator)
 */
const options: AppOptions = {
  logger: isDev
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        level: process.env.LOG_LEVEL ?? "info",
      },
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // This loads all plugins defined in plugins
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
export { app, options };
