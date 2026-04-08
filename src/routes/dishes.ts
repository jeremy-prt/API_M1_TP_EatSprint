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
} from "../schemas/dish.schema.js";
import { PaginatedResponse } from "../schemas/pagination.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

const DishQuery = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
  category: Type.Optional(Type.String()),
  isVegetarian: Type.Optional(Type.Boolean()),
  minPrice: Type.Optional(Type.Number({ minimum: 0 })),
  maxPrice: Type.Optional(Type.Number({ minimum: 0 })),
});

export default async function dishRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { restaurantId: string };
    Querystring: Static<typeof DishQuery>;
  }>(
    "/restaurants/:restaurantId/dishes",
    {
      schema: {
        querystring: DishQuery,
        response: {
          200: PaginatedResponse(DishResponse),
        },
      },
    },
    async (request, reply) => {
      const restaurantId = parseInt(request.params.restaurantId);
      const result = await getDishesByRestaurant(restaurantId, {
        limit: request.query.limit ?? 20,
        offset: request.query.offset ?? 0,
        category: request.query.category,
        isVegetarian: request.query.isVegetarian,
        minPrice: request.query.minPrice,
        maxPrice: request.query.maxPrice,
      });
      return reply.send(result);
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
