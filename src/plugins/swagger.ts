import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export default fp(async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "EatSprint API",
        description: "API REST pour la plateforme de livraison EatSprint",
        version: "1.0.0",
      },
      tags: [
        { name: "Auth", description: "Inscription, connexion, tokens" },
        { name: "Restaurants", description: "Gestion des restaurants" },
        { name: "Dishes", description: "Gestion des plats" },
        { name: "Orders", description: "Gestion des commandes" },
        { name: "Users", description: "Profil utilisateur" },
        { name: "Admin", description: "Administration (ADMIN uniquement)" },
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
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
  });
});
