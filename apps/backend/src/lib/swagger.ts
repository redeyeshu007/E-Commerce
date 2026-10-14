import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Application } from "express";

/**
 * Swagger / OpenAPI documentation setup.
 *
 * Provides a future OpenAPI/Swagger integration point on /api/docs.
 * NOTE: Foundation only — no business endpoints are documented yet.
 */

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PERALAGAE Jewellery E-commerce API",
      version: "1.0.0",
      description:
        "REST API foundation for PERALAGAE Jewellery E-commerce. " +
        "Business modules and domain models will be added incrementally in future tasks.",
      contact: {
        name: "PERALAGAE Engineering",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API Base",
      },
    ],
  },
  apis: ["./src/routes/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Application): void {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
