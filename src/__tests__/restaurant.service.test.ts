import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    restaurant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../lib/prisma.js";
import {
  getAllRestaurants,
  getMyRestaurants,
  updateRestaurant,
  deleteRestaurant,
  createRestaurant,
} from "../services/restaurant.service.js";
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../common/exceptions.js";

const mockRestaurant = {
  id: 1,
  name: "Le Bistrot",
  address: "1 rue de la Paix",
  city: "Paris",
  category: "French",
  image: "image.jpg",
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAllRestaurants", () => {
  it("retourne les restaurants paginés", async () => {
    vi.mocked(prisma.restaurant.findMany).mockResolvedValue([mockRestaurant]);
    vi.mocked(prisma.restaurant.count).mockResolvedValue(1);

    const result = await getAllRestaurants({ limit: 20, offset: 0 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("filtre par city et category", async () => {
    vi.mocked(prisma.restaurant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.restaurant.count).mockResolvedValue(0);

    await getAllRestaurants({
      limit: 10,
      offset: 0,
      city: "Paris",
      category: "French",
    });

    expect(prisma.restaurant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { city: "Paris", category: "French" } }),
    );
  });
});

describe("getMyRestaurants", () => {
  it("retourne les restaurants du propriétaire", async () => {
    vi.mocked(prisma.restaurant.findMany).mockResolvedValue([mockRestaurant]);

    const result = await getMyRestaurants(42);

    expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
      where: { ownerId: 42 },
    });
    expect(result).toHaveLength(1);
  });
});

describe("createRestaurant", () => {
  const input = {
    name: "Le Bistrot",
    address: "1 rue de la Paix",
    city: "Paris",
    category: "French",
    image: "image.jpg",
    cuisine: "French",
    priceRange: "$$",
    deliveryTimeMin: 30,
    ownerEmail: "owner@test.com",
    ownerPassword: "password123",
    ownerName: "Owner Name",
  };

  it("lève ConflictError si l'email du propriétaire est déjà utilisé", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: "owner@test.com",
      password: "hash",
      name: "existing",
      address: null,
      city: null,
      zipCode: null,
      role: "RESTAURANT_OWNER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(createRestaurant(input)).rejects.toThrow(ConflictError);
  });
});

describe("updateRestaurant", () => {
  it("lève NotFoundError si le restaurant n'existe pas", async () => {
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue(null);

    await expect(
      updateRestaurant(99, 42, { name: "Nouveau nom" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lève ForbiddenError si l'utilisateur n'est pas le propriétaire", async () => {
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue(mockRestaurant);

    await expect(
      updateRestaurant(1, 999, { name: "Nouveau nom" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("met à jour le restaurant et génère un nouveau slug si le nom change", async () => {
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue(mockRestaurant);
    vi.mocked(prisma.restaurant.update).mockResolvedValue({
      ...mockRestaurant,
      name: "Le Nouveau Bistrot",
      slug: "le-nouveau-bistrot",
    });

    const result = await updateRestaurant(1, 42, {
      name: "Le Nouveau Bistrot",
    });

    expect(prisma.restaurant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "le-nouveau-bistrot" }),
      }),
    );
    expect(result.slug).toBe("le-nouveau-bistrot");
  });
});

describe("deleteRestaurant", () => {
  it("lève NotFoundError si le restaurant n'existe pas", async () => {
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue(null);

    await expect(deleteRestaurant(99, 42)).rejects.toThrow(NotFoundError);
  });

  it("lève ForbiddenError si l'utilisateur n'est pas le propriétaire", async () => {
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue(mockRestaurant);

    await expect(deleteRestaurant(1, 999)).rejects.toThrow(ForbiddenError);
  });

  it("supprime le restaurant si l'utilisateur est propriétaire", async () => {
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue(mockRestaurant);
    vi.mocked(prisma.restaurant.delete).mockResolvedValue(mockRestaurant);

    await deleteRestaurant(1, 42);

    expect(prisma.restaurant.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
