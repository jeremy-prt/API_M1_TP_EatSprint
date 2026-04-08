import prisma from "../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../common/exceptions.js";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface CreateDishInput {
  name: string;
  price: number;
  description: string;
  category: string;
  calories: number;
  preparationTime: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  allergens?: string | null;
  isAvailable: boolean;
  image: string;
}

interface UpdateDishInput {
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  calories?: number;
  preparationTime?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  allergens?: string | null;
  isAvailable?: boolean;
  image?: string;
}

async function verifyRestaurantOwnership(restaurantId: number, userId: number) {
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

  return restaurant;
}

export async function createDish(
  restaurantId: number,
  userId: number,
  input: CreateDishInput,
) {
  await verifyRestaurantOwnership(restaurantId, userId);

  return prisma.dish.create({
    data: {
      ...input,
      slug: generateSlug(input.name),
      restaurantId,
    },
  });
}

interface DishFilters {
  limit: number;
  offset: number;
  category?: string;
  isVegetarian?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export async function getDishesByRestaurant(
  restaurantId: number,
  filters: DishFilters,
) {
  const where: Record<string, unknown> = { restaurantId };

  if (filters.category) where.category = filters.category;
  if (filters.isVegetarian !== undefined)
    where.isVegetarian = filters.isVegetarian;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
      ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
    };
  }

  const [data, total] = await Promise.all([
    prisma.dish.findMany({
      where,
      orderBy: { name: "asc" },
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.dish.count({ where }),
  ]);

  return {
    data,
    pagination: { total, limit: filters.limit, offset: filters.offset },
  };
}

export async function getDishById(dishId: number) {
  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
  });

  if (!dish) {
    throw new NotFoundError("Plat introuvable");
  }

  return dish;
}

export async function updateDish(
  dishId: number,
  userId: number,
  input: UpdateDishInput,
) {
  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
  });

  if (!dish) {
    throw new NotFoundError("Plat introuvable");
  }

  await verifyRestaurantOwnership(dish.restaurantId, userId);

  const data: UpdateDishInput & { slug?: string } = { ...input };

  if (input.name) {
    data.slug = generateSlug(input.name);
  }

  return prisma.dish.update({
    where: { id: dishId },
    data,
  });
}

export async function deleteDish(dishId: number, userId: number) {
  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
  });

  if (!dish) {
    throw new NotFoundError("Plat introuvable");
  }

  await verifyRestaurantOwnership(dish.restaurantId, userId);

  await prisma.dish.delete({ where: { id: dishId } });
}
