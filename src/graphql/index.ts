import type { FastifyInstance } from "fastify";
import mercurius from "mercurius";
import fp from "fastify-plugin";
import { schema } from "./schema.js";
import { resolvers } from "./resolvers.js";

async function graphqlPlugin(fastify: FastifyInstance) {
  await fastify.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
    context: (request) => {
      try {
        const auth = request.headers.authorization;
        if (auth?.startsWith("Bearer ")) {
          const token = auth.slice(7);
          const user = fastify.jwt.verify<{
            id: number;
            email: string;
            role: string;
          }>(token);
          return { user };
        }
      } catch {
        // pas authentifié, c'est ok pour les queries publiques
      }
      return {};
    },
  });
}

export default fp(graphqlPlugin);
