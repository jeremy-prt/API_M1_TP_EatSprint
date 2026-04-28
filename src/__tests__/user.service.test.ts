import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../lib/prisma.js";
import { updateUser, deleteUser } from "../services/user.service.js";
import { ConflictError, NotFoundError } from "../common/exceptions.js";

const mockUser = {
  id: 1,
  email: "test@example.com",
  password: "hashed",
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

describe("updateUser", () => {
  it("met à jour et retourne l'utilisateur sans mot de passe", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      name: "Nouveau Nom",
    });

    const result = await updateUser(1, { name: "Nouveau Nom" });

    expect(result).not.toHaveProperty("password");
    expect(result.name).toBe("Nouveau Nom");
  });

  it("lève ConflictError si le nouvel email est déjà pris par un autre utilisateur", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      id: 99,
    });

    await expect(updateUser(1, { email: "pris@example.com" })).rejects.toThrow(
      ConflictError,
    );
  });

  it("autorise le même utilisateur à garder son email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

    const result = await updateUser(1, { email: "test@example.com" });

    expect(result.email).toBe("test@example.com");
  });
});

describe("deleteUser", () => {
  it("supprime l'utilisateur s'il existe", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.user.delete).mockResolvedValue(mockUser);

    await deleteUser(1);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("lève NotFoundError si l'utilisateur n'existe pas", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(deleteUser(999)).rejects.toThrow(NotFoundError);
  });
});
