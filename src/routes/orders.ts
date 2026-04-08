import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
} from "../services/order.service.js";
import {
  CreateOrderBody,
  UpdateStatusBody,
  OrderResponse,
} from "../schemas/order.schema.js";
import { PaginatedResponse } from "../schemas/pagination.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

const OrderQuery = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
  status: Type.Optional(Type.String()),
});

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: Static<typeof CreateOrderBody> }>(
    "/orders",
    {
      preHandler: [fastify.authorize(["CUSTOMER"])],
      schema: {
        body: CreateOrderBody,
        response: {
          201: OrderResponse,
          400: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const order = await createOrder(
        request.user.id,
        request.body.restaurantId,
        request.body.items,
      );
      return reply.status(201).send(order);
    },
  );

  fastify.get<{ Querystring: Static<typeof OrderQuery> }>(
    "/orders",
    {
      preHandler: [fastify.authorize(["CUSTOMER"])],
      schema: {
        querystring: OrderQuery,
        response: {
          200: PaginatedResponse(OrderResponse),
        },
      },
    },
    async (request, reply) => {
      const result = await getUserOrders(request.user.id, {
        limit: request.query.limit ?? 20,
        offset: request.query.offset ?? 0,
        status: request.query.status,
      });
      return reply.send(result);
    },
  );

  fastify.get<{ Params: { orderId: string } }>(
    "/orders/:orderId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: OrderResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const orderId = parseInt(request.params.orderId);
      const order = await getOrderById(orderId, request.user.id);
      return reply.send(order);
    },
  );

  fastify.patch<{
    Params: { orderId: string };
    Body: Static<typeof UpdateStatusBody>;
  }>(
    "/orders/:orderId/status",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        body: UpdateStatusBody,
        response: {
          200: OrderResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const orderId = parseInt(request.params.orderId);
      const order = await updateOrderStatus(
        orderId,
        request.user.id,
        request.body.status,
      );
      return reply.send(order);
    },
  );

  fastify.post<{ Params: { orderId: string } }>(
    "/orders/:orderId/cancel",
    {
      preHandler: [fastify.authorize(["CUSTOMER"])],
      schema: {
        response: {
          200: OrderResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const orderId = parseInt(request.params.orderId);
      const order = await cancelOrder(orderId, request.user.id);
      return reply.send(order);
    },
  );

  fastify.get<{ Params: { restaurantId: string } }>(
    "/restaurants/:restaurantId/orders",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        response: {
          200: Type.Array(OrderResponse),
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurantId = parseInt(request.params.restaurantId);
      const orders = await getRestaurantOrders(restaurantId, request.user.id);
      return reply.send(orders);
    },
  );
}
