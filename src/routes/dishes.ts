import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import {
  createDish,
  getDishesByRestaurant,
  getDishById,
  updateDish,
  deleteDish,
} from "../services/dish.service.js";
import {
  CreateDishBody,
  UpdateDishBody,
  DishResponse,
  DishListResponse,
} from "../schemas/dish.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

export default async function dishRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { restaurantId: string } }>(
    "/restaurants/:restaurantId/dishes",
    {
      schema: {
        response: {
          200: DishListResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurantId = parseInt(request.params.restaurantId);
      const dishes = await getDishesByRestaurant(restaurantId);
      return reply.send(dishes);
    },
  );

  fastify.post<{
    Params: { restaurantId: string };
    Body: Static<typeof CreateDishBody>;
  }>(
    "/restaurants/:restaurantId/dishes",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        body: CreateDishBody,
        response: {
          201: DishResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurantId = parseInt(request.params.restaurantId);
      const dish = await createDish(
        restaurantId,
        request.user.id,
        request.body,
      );
      return reply.status(201).send(dish);
    },
  );

  fastify.get<{ Params: { dishId: string } }>(
    "/dishes/:dishId",
    {
      schema: {
        response: {
          200: DishResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const dishId = parseInt(request.params.dishId);
      const dish = await getDishById(dishId);
      return reply.send(dish);
    },
  );

  fastify.put<{
    Params: { dishId: string };
    Body: Static<typeof UpdateDishBody>;
  }>(
    "/dishes/:dishId",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        body: UpdateDishBody,
        response: {
          200: DishResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const dishId = parseInt(request.params.dishId);
      const dish = await updateDish(dishId, request.user.id, request.body);
      return reply.send(dish);
    },
  );

  fastify.delete<{ Params: { dishId: string } }>(
    "/dishes/:dishId",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        response: {
          200: Type.Object({ success: Type.Boolean() }),
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const dishId = parseInt(request.params.dishId);
      await deleteDish(dishId, request.user.id);
      return reply.send({ success: true });
    },
  );
}
