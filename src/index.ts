import "dotenv/config";
import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import websocket from "@fastify/websocket";
import jwtPlugin from "./plugins/jwt.js";
import authDecorators from "./decorators/auth.js";
import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurants.js";
import dishRoutes from "./routes/dishes.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";
import websocketRoutes from "./routes/websocket.js";
import graphqlPlugin from "./graphql/index.js";
import { AppError } from "./common/exceptions.js";

const server = Fastify({ logger: true });

server.setErrorHandler((error: FastifyError | AppError, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(error.toRFC7807(request.url));
  }

  if ("validation" in error && error.validation) {
    return reply.status(400).send({
      type: "urn:app:error:validation",
      title: "Validation Error",
      status: 400,
      detail: error.message,
      instance: request.url,
    });
  }

  server.log.error(error);
  return reply.status(500).send({
    type: "urn:app:error:internal",
    title: "Internal Server Error",
    status: 500,
    detail: "Erreur interne du serveur",
    instance: request.url,
  });
});

server.register(cors, {
  origin: process.env["CORS_ORIGIN"] || "http://localhost:3001",
  credentials: true,
});
server.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      connectSrc: ["'self'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:"],
    },
  },
});
server.register(websocket);
server.register(jwtPlugin);
server.register(authDecorators);
server.register(authRoutes, { prefix: "/auth" });
server.register(restaurantRoutes, { prefix: "/restaurants" });
server.register(dishRoutes);
server.register(orderRoutes);
server.register(userRoutes, { prefix: "/users" });
server.register(websocketRoutes);
server.register(graphqlPlugin);

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening at ${address}`);
});
