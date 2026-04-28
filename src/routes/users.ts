import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import { getProfile } from "../services/auth.service.js";
import { updateUser, deleteUser } from "../services/user.service.js";
import { UpdateUserBody, UserResponse } from "../schemas/user.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Users"],
        summary: "Mon profil",
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Object({ user: UserResponse }),
          401: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const user = await getProfile(request.user.id);
      return reply.send({ user });
    },
  );

  fastify.put<{ Body: Static<typeof UpdateUserBody> }>(
    "/me",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Users"],
        summary: "Modifier mon profil",
        security: [{ bearerAuth: [] }],
        body: UpdateUserBody,
        response: {
          200: Type.Object({ user: UserResponse }),
          409: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const user = await updateUser(request.user.id, request.body);
      return reply.send({ user });
    },
  );

  fastify.delete(
    "/me",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Users"],
        summary: "Supprimer mon compte",
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Object({ success: Type.Boolean() }),
        },
      },
    },
    async (request, reply) => {
      await deleteUser(request.user.id);
      return reply.send({ success: true });
    },
  );
}
