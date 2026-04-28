import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import {
  getAllUsers,
  createUser,
  updateUserAsAdmin,
  deleteUserAsAdmin,
  getAllRestaurantsAdmin,
  assignRestaurantOwner,
} from "../services/admin.service.js";
import {
  CreateUserBody,
  UpdateUserAdminBody,
  AssignOwnerBody,
} from "../schemas/admin.schema.js";
import { UserResponse } from "../schemas/user.schema.js";
import { RestaurantResponse } from "../schemas/restaurant.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authorize(["ADMIN"]));

  fastify.get(
    "/users",
    {
      schema: {
        tags: ["Admin"],
        summary: "Lister tous les utilisateurs",
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Array(UserResponse),
        },
      },
    },
    async (_request, reply) => {
      const users = await getAllUsers();
      return reply.send(users);
    },
  );

  fastify.post<{ Body: Static<typeof CreateUserBody> }>(
    "/users",
    {
      schema: {
        tags: ["Admin"],
        summary: "Créer un utilisateur",
        security: [{ bearerAuth: [] }],
        body: CreateUserBody,
        response: {
          201: Type.Object({ user: UserResponse }),
          409: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const user = await createUser(request.body);
      return reply.status(201).send({ user });
    },
  );

  fastify.put<{
    Params: { userId: string };
    Body: Static<typeof UpdateUserAdminBody>;
  }>(
    "/users/:userId",
    {
      schema: {
        tags: ["Admin"],
        summary: "Modifier un utilisateur",
        security: [{ bearerAuth: [] }],
        body: UpdateUserAdminBody,
        response: {
          200: Type.Object({ user: UserResponse }),
          404: ErrorResponse,
          409: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const userId = parseInt(request.params.userId);
      const user = await updateUserAsAdmin(userId, request.body);
      return reply.send({ user });
    },
  );

  fastify.delete<{ Params: { userId: string } }>(
    "/users/:userId",
    {
      schema: {
        tags: ["Admin"],
        summary: "Supprimer un utilisateur",
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Object({ success: Type.Boolean() }),
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const userId = parseInt(request.params.userId);
      await deleteUserAsAdmin(userId, request.user.id);
      return reply.send({ success: true });
    },
  );

  fastify.get(
    "/restaurants",
    {
      schema: {
        tags: ["Admin"],
        summary: "Lister tous les restaurants",
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Array(RestaurantResponse),
        },
      },
    },
    async (_request, reply) => {
      const restaurants = await getAllRestaurantsAdmin();
      return reply.send(restaurants);
    },
  );

  fastify.put<{
    Params: { restaurantId: string };
    Body: Static<typeof AssignOwnerBody>;
  }>(
    "/restaurants/:restaurantId",
    {
      schema: {
        tags: ["Admin"],
        summary: "Assigner un propriétaire à un restaurant",
        security: [{ bearerAuth: [] }],
        body: AssignOwnerBody,
        response: {
          200: RestaurantResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurantId = parseInt(request.params.restaurantId);
      const restaurant = await assignRestaurantOwner(
        restaurantId,
        request.body.ownerId,
      );
      return reply.send(restaurant);
    },
  );
}
