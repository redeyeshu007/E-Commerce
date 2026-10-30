import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import serverless from "serverless-http";
import { createApp } from "../../apps/backend/src/app.js";
import { validateEnv } from "../../apps/backend/src/config/env.js";
import { logger } from "../../apps/backend/src/utils/logger.js";

let serverlessHandler: any = null;

function getHandler() {
  if (!serverlessHandler) {
    try {
      const env = validateEnv();
      const app = createApp(env);
      serverlessHandler = serverless(app);
    } catch (err) {
      logger.error({ err }, "[Netlify Functions] Failed to initialize Express application");
      throw err;
    }
  }
  return serverlessHandler;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Normalize event.path so Express matches /api/* routes cleanly
  if (event.path) {
    let normalized = event.path.replace(/^\/\.netlify\/functions\/api/, "");
    if (!normalized.startsWith("/api")) {
      normalized = `/api${normalized.startsWith("/") ? normalized : "/" + normalized}`;
    }
    event.path = normalized;
  }

  const appHandler = getHandler();
  return (appHandler as any)(event, context);
};
