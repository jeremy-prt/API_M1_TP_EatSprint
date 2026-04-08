import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../common/exceptions.js";

const SALT_ROUNDS = parseInt(process.env["BCRYPT_SALT_ROUNDS"] || "10");

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface CreateRestaurantInput {
  name: string;
  address: string;
  city: string;
  category: string;
  image: string;
  cuisine: string;
  priceRange: string;
  deliveryTimeMin: number;
  ownerEmail: string;
  ownerPassword: string;
  ownerName: string;
}

interface UpdateRestaurantInput {
  name?: string;
  address?: string;
  city?: string;
  category?: string;
  image?: string;
  cuisine?: string;
  priceRange?: string;
  deliveryTimeMin?: number;
}

export async function createRestaurant(input: CreateRestaurantInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.ownerEmail },
  });

  if (existingUser) {
    throw new ConflictError("Email du propriétaire déjà utilisé");
  }

  const hashedPassword = await bcrypt.hash(input.ownerPassword, SALT_ROUNDS);
  const slug = generateSlug(input.name);

  const restaurant = await prisma.restaurant.create({
    data: {
      name: input.name,
      address: input.address,
      city: input.city,
      category: input.category,
      image: input.image,
      cuisine: input.cuisine,
      priceRange: input.priceRange,
      deliveryTimeMin: input.deliveryTimeMin,
      slug,
      owner: {
        create: {
          email: input.ownerEmail,
          password: hashedPassword,
          name: input.ownerName,
          role: "RESTAURANT_OWNER",
        },
      },
    },
  });

  return restaurant;
}

interface RestaurantFilters {
  city?: string;
  category?: string;
  limit: number;
  offset: number;
}

export async function getAllRestaurants(filters: RestaurantFilters) {
  const where: Record<string, unknown> = {};

  if (filters.city) where.city = filters.city;
  if (filters.category) where.category = filters.category;

  const [data, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy: { name: "asc" },
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.restaurant.count({ where }),
  ]);

  return {
    data,
    pagination: { total, limit: filters.limit, offset: filters.offset },
  };
}

export async function getMyRestaurants(userId: number) {
  return prisma.restaurant.findMany({
    where: { ownerId: userId },
  });
}

export async function updateRestaurant(
  restaurantId: number,
  userId: number,
  input: UpdateRestaurantInput,
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant introuvable");
  }

  if (restaurant.ownerId !== userId) {
    throw new ForbiddenError(
      "Vous n'êtes pas le propriétaire de ce restaurant",
    );
  }

  const data: UpdateRestaurantInput & { slug?: string } = { ...input };

  if (input.name) {
    data.slug = generateSlug(input.name);
  }

  return prisma.restaurant.update({
    where: { id: restaurant.id },
    data,
  });
}
