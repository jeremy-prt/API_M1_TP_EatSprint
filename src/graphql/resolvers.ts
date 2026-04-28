import type { MercuriusContext } from "mercurius";
import prisma from "../lib/prisma.js";
import { updateUser } from "../services/user.service.js";
import { createDish, updateDish } from "../services/dish.service.js";

type AuthContext = MercuriusContext & {
  user?: { id: number; email: string; role: string };
};

function requireAuth(ctx: AuthContext) {
  if (!ctx.user) throw new Error("Non authentifié");
  return ctx.user;
}

function requireRole(ctx: AuthContext, role: string) {
  const user = requireAuth(ctx);
  if (user.role !== role) throw new Error("Accès interdit");
  return user;
}

export const resolvers = {
  Query: {
    restaurants: async (
      _: unknown,
      args: {
        limit?: number;
        offset?: number;
        city?: string;
        category?: string;
      },
    ) => {
      const where: Record<string, unknown> = {};
      if (args.city) where.city = args.city;
      if (args.category) where.category = args.category;

      return prisma.restaurant.findMany({
        where,
        orderBy: { name: "asc" },
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
      });
    },

    restaurant: async (_: unknown, args: { id: number }) => {
      return prisma.restaurant.findUnique({ where: { id: args.id } });
    },

    dishes: async (
      _: unknown,
      args: { restaurantId: number; limit?: number; offset?: number },
    ) => {
      return prisma.dish.findMany({
        where: { restaurantId: args.restaurantId },
        orderBy: { name: "asc" },
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
      });
    },

    dish: async (_: unknown, args: { id: number }) => {
      return prisma.dish.findUnique({ where: { id: args.id } });
    },

    me: async (
      _: unknown,
      _args: unknown,
      context: MercuriusContext & { user?: { id: number } },
    ) => {
      if (!context.user) {
        throw new Error("Non authentifié");
      }

      return prisma.user.findUnique({
        where: { id: context.user.id },
        omit: { password: true },
      });
    },

    myOrders: async (
      _: unknown,
      _args: unknown,
      context: MercuriusContext & { user?: { id: number } },
    ) => {
      if (!context.user) {
        throw new Error("Non authentifié");
      }

      return prisma.order.findMany({
        where: { userId: context.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: { dish: true },
          },
        },
      });
    },
  },

  Mutation: {
    updateMe: async (
      _: unknown,
      args: {
        input: {
          name?: string;
          email?: string;
          address?: string;
          city?: string;
          zipCode?: string;
        };
      },
      context: AuthContext,
    ) => {
      const user = requireAuth(context);
      return updateUser(user.id, args.input);
    },

    createDish: async (
      _: unknown,
      args: {
        restaurantId: number;
        input: Parameters<typeof createDish>[2];
      },
      context: AuthContext,
    ) => {
      const user = requireRole(context, "RESTAURANT_OWNER");
      return createDish(args.restaurantId, user.id, args.input);
    },

    updateDish: async (
      _: unknown,
      args: { id: number; input: Parameters<typeof updateDish>[2] },
      context: AuthContext,
    ) => {
      const user = requireRole(context, "RESTAURANT_OWNER");
      return updateDish(args.id, user.id, args.input);
    },
  },

  Restaurant: {
    dishes: async (parent: { id: number }) => {
      return prisma.dish.findMany({
        where: { restaurantId: parent.id },
        orderBy: { name: "asc" },
      });
    },
  },

  OrderItem: {
    dish: async (parent: { dishId: number }) => {
      return prisma.dish.findUnique({ where: { id: parent.dishId } });
    },
  },
};
