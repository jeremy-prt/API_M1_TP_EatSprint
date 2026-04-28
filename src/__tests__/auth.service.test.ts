import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

vi.mock("../lib/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import prisma from "../lib/prisma.js";
import { register, login, getProfile } from "../services/auth.service.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../common/exceptions.js";

const mockUser = {
  id: 1,
  email: "test@example.com",
  password: await bcrypt.hash("password123", 10),
  name: "Test User",
  address: null,
  city: null,
  zipCode: null,
  role: "CUSTOMER" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("register", () => {
  it("crée un utilisateur et retourne les données sans mot de passe", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

    const result = await register({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(prisma.user.create).toHaveBeenCalledOnce();
    expect(result).not.toHaveProperty("password");
    expect(result.email).toBe("test@example.com");
  });

  it("lève ConflictError si l'email est déjà utilisé", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    await expect(
      register({
        email: "test@example.com",
        password: "password123",
        name: "Test",
      }),
    ).rejects.toThrow(ConflictError);
  });
});

describe("login", () => {
  it("retourne l'utilisateur sans mot de passe si les credentials sont valides", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const result = await login({
      email: "test@example.com",
      password: "password123",
    });

    expect(result).not.toHaveProperty("password");
    expect(result.email).toBe("test@example.com");
  });

  it("lève UnauthorizedError si l'utilisateur n'existe pas", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      login({ email: "inconnu@example.com", password: "password123" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lève UnauthorizedError si le mot de passe est incorrect", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    await expect(
      login({ email: "test@example.com", password: "mauvais_mdp" }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

describe("getProfile", () => {
  it("retourne le profil sans mot de passe", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const result = await getProfile(1);

    expect(result).not.toHaveProperty("password");
    expect(result.id).toBe(1);
  });

  it("lève NotFoundError si l'utilisateur n'existe pas", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(getProfile(999)).rejects.toThrow(NotFoundError);
  });
});
