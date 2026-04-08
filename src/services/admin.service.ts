import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../common/exceptions.js";
import type { UserRole } from "../generated/prisma/client.js";

const SALT_ROUNDS = parseInt(process.env["BCRYPT_SALT_ROUNDS"] || "10");

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    omit: { password: true },
  });
}

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  address?: string;
  city?: string;
  zipCode?: string;
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError("Email déjà utilisé");
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      ...input,
      password: hashedPassword,
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
}

export async function updateUserAsAdmin(
  userId: number,
  input: UpdateUserInput,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError("Utilisateur introuvable");
  }

  if (input.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictError("Email déjà utilisé");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: input,
  });

  const { password: _, ...userWithoutPassword } = updated;
  return userWithoutPassword;
}

export async function deleteUserAsAdmin(userId: number, currentUserId: number) {
  if (userId === currentUserId) {
    throw new ForbiddenError("Impossible de supprimer son propre compte");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError("Utilisateur introuvable");
  }

  await prisma.user.delete({ where: { id: userId } });
}

export async function getAllRestaurantsAdmin() {
  return prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });
}

export async function assignRestaurantOwner(
  restaurantId: number,
  ownerId: number | null,
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant introuvable");
  }

  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: { ownerId },
  });
}
