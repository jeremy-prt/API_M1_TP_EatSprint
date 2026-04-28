import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import jwtPlugin from "../../../plugins/jwt.js";
import authDecorators from "../../../decorators/auth.js";
import authRoutes from "../../../routes/auth.js";
import { AppError } from "../../../common/exceptions.js";

export async function buildTestServer() {
  const server = Fastify({ logger: false });

  server.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toRFC7807(request.url));
    }
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      type: "urn:app:error",
      title: error.message,
      status: statusCode,
      detail: error.message,
      instance: request.url,
    });
  });

  await server.register(cors, { origin: "*" });
  await server.register(jwtPlugin);
  await server.register(authDecorators);
  await server.register(authRoutes, { prefix: "/auth" });

  await server.ready();
  return server;
}
