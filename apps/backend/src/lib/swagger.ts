import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Application } from "express";

/**
 * Swagger / OpenAPI setup.
 *
 * This registers the /api/docs route that serves interactive API documentation.
 * Document real endpoints here as they are implemented.
 *
 * NOTE: This is a scaffold — no business endpoints are documented yet.
 */

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gold Commerce Platform API",
      version: "1.0.0",
      description:
        "REST API for the Gold Jewellery E-commerce Platform. " +
        "This documentation will be populated as endpoints are implemented.",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Glob patterns for files containing JSDoc annotations with @openapi tags
  apis: ["./src/routes/**/*.ts", "./src/modules/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Application): void {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
