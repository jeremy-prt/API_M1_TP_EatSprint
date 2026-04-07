import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";
import {
  createRestaurant,
  getAllRestaurants,
  getMyRestaurants,
  updateMyRestaurant,
} from "../services/restaurant.service.js";
import {
  CreateRestaurantBody,
  UpdateRestaurantBody,
  RestaurantResponse,
  RestaurantListResponse,
} from "../schemas/restaurant.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

export default async function restaurantRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: RestaurantListResponse,
        },
      },
    },
    async (_request, reply) => {
      const restaurants = await getAllRestaurants();
      return reply.send(restaurants);
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
          200: RestaurantListResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurants = await getMyRestaurants(request.user.id);
      return reply.send(restaurants);
    },
  );

  fastify.patch<{ Body: Static<typeof UpdateRestaurantBody> }>(
    "/me",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        body: UpdateRestaurantBody,
        response: {
          200: RestaurantResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurant = await updateMyRestaurant(
        request.user.id,
        request.body,
      );
      return reply.send(restaurant);
    },
  );
}
