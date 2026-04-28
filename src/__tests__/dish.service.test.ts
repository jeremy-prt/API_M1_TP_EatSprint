import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  default: {
    restaurant: { findUnique: vi.fn() },
    dish: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from "../lib/prisma.js";
import {
  getDishesByRestaurant,
  getDishById,
} from "../services/dish.service.js";
import { NotFoundError } from "../common/exceptions.js";

const mockRestaurant = {
  id: 1,
  name: "Le Bistrot",
  address: "1 rue de la Paix",
  city: "Paris",
  category: "French",
  image: "img.jpg",
  cuisine: "French",
  rating: 4.5,
  reviewCount: 10,
  priceRange: "$$",
  deliveryTimeMin: 30,
  slug: "le-bistrot",
  ownerId: 42,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDish = {
  id: 1,
  name: "Croque Monsieur",
  slug: "croque-monsieur",
  price: 8.5,
  description: "Un classique",
  category: "Sandwich",
  restaurantId: 1,
  calories: 450,
  preparationTime: 10,
  isVegetarian: false,
  isVegan: false,
  isSpicy: false,
  allergens: null,
  isAvailable: true,
  image: "dish.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDishesByRestaurant", () => {
  it("retourne les plats paginés du restaurant", async () => {
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue(mockRestaurant);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish]);
    vi.mocked(prisma.dish.count).mockResolvedValue(1);

    const result = await getDishesByRestaurant(1, { limit: 20, offset: 0 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("retourne une liste vide si aucun plat pour ce restaurant", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dish.count).mockResolvedValue(0);

    const result = await getDishesByRestaurant(99, { limit: 20, offset: 0 });

    expect(result.data).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });
});

describe("getDishById", () => {
  it("retourne le plat si trouvé", async () => {
    vi.mocked(prisma.dish.findUnique).mockResolvedValue(mockDish);

    const result = await getDishById(1);

    expect(result.id).toBe(1);
    expect(result.name).toBe("Croque Monsieur");
  });

  it("lève NotFoundError si le plat n'existe pas", async () => {
    vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);

    await expect(getDishById(999)).rejects.toThrow(NotFoundError);
  });
});
