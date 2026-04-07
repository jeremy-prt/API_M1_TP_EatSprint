import type { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";

async function jwtPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: process.env["JWT_SECRET"] || "dev-secret-change-me",
    sign: { expiresIn: process.env["ACCESS_TOKEN_EXPIRY"] || "5m" },
  });
}

export default fp(jwtPlugin);
