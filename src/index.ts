import "dotenv/config";
import Fastify, { type FastifyError } from "fastify";
import jwtPlugin from "./plugins/jwt.js";
import authDecorators from "./decorators/auth.js";
import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurants.js";
import dishRoutes from "./routes/dishes.js";
import orderRoutes from "./routes/orders.js";
import { AppError } from "./common/exceptions.js";

const server = Fastify({ logger: true });

server.setErrorHandler((error: FastifyError | AppError, _request, reply) => {
  if (error instanceof AppError) {
    return reply
      .status(error.statusCode)
      .send({ error: error.message, statusCode: error.statusCode });
  }

  if ("validation" in error && error.validation) {
    return reply.status(400).send({ error: error.message, statusCode: 400 });
  }

  server.log.error(error);
  return reply
    .status(500)
    .send({ error: "Erreur interne du serveur", statusCode: 500 });
});

server.register(jwtPlugin);
server.register(authDecorators);
server.register(authRoutes, { prefix: "/auth" });
server.register(restaurantRoutes, { prefix: "/restaurants" });
server.register(dishRoutes);
server.register(orderRoutes);

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening at ${address}`);
});
