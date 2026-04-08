import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import {
  createRestaurant,
  getAllRestaurants,
  getMyRestaurants,
  updateRestaurant,
} from "../services/restaurant.service.js";
import {
  CreateRestaurantBody,
  UpdateRestaurantBody,
  RestaurantResponse,
} from "../schemas/restaurant.schema.js";
import { PaginatedResponse } from "../schemas/pagination.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

const RestaurantQuery = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
  city: Type.Optional(Type.String()),
  category: Type.Optional(Type.String()),
});

export default async function restaurantRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: Static<typeof RestaurantQuery> }>(
    "/",
    {
      schema: {
        querystring: RestaurantQuery,
        response: {
          200: PaginatedResponse(RestaurantResponse),
        },
      },
    },
    async (request, reply) => {
      const result = await getAllRestaurants({
        limit: request.query.limit ?? 20,
        offset: request.query.offset ?? 0,
        city: request.query.city,
        category: request.query.category,
      });
      return reply.send(result);
    },
  );

  fastify.post<{ Body: Static<typeof CreateRestaurantBody> }>(
    "/",
    {
      preHandler: [fastify.authorize(["ADMIN"])],
      schema: {
        body: CreateRestaurantBody,
        response: {
          201: RestaurantResponse,
          409: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurant = await createRestaurant(request.body);
      return reply.status(201).send(restaurant);
    },
  );

  fastify.get(
    "/mine",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        response: {
          200: Type.Array(RestaurantResponse),
        },
      },
    },
    async (request, reply) => {
      const restaurants = await getMyRestaurants(request.user.id);
      return reply.send(restaurants);
    },
  );

  fastify.put<{
    Params: { restaurantId: string };
    Body: Static<typeof UpdateRestaurantBody>;
  }>(
    "/:restaurantId",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        body: UpdateRestaurantBody,
        response: {
          200: RestaurantResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurantId = parseInt(request.params.restaurantId);
      const restaurant = await updateRestaurant(
        restaurantId,
        request.user.id,
        request.body,
      );
      return reply.send(restaurant);
    },
  );
}
