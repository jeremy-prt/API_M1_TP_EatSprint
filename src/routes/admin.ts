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
