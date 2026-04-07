import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import type { UserRole } from "../generated/prisma/client.js";
import { UnauthorizedError, ForbiddenError } from "../common/exceptions.js";

async function authDecorators(fastify: FastifyInstance) {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        throw new UnauthorizedError();
      }
    },
  );

  fastify.decorate(
    "authorize",
    (roles: UserRole[]) =>
      async (request: FastifyRequest, _reply: FastifyReply) => {
        try {
          await request.jwtVerify();
        } catch {
          throw new UnauthorizedError();
        }

        if (!roles.includes(request.user.role)) {
          throw new ForbiddenError();
        }
      },
  );
}

export default fp(authDecorators);
