import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { buildTestServer } from "./helpers/server.js";

vi.mock("../../lib/prisma.js", () => ({
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

import prisma from "../../lib/prisma.js";

const hashedPassword = await bcrypt.hash("password123", 10);

const mockUser = {
  id: 1,
  email: "test@example.com",
  password: hashedPassword,
  name: "Test User",
  address: null,
  city: null,
  zipCode: null,
  role: "CUSTOMER" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

let server: FastifyInstance;

beforeAll(async () => {
  server = await buildTestServer();
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /auth/register", () => {
  it("crée un compte et retourne 201 avec accessToken", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({
      id: 1,
      token: "refresh_token",
      userId: 1,
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const response = await server.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty("accessToken");
    expect(body).toHaveProperty("refreshToken");
    expect(body.user).not.toHaveProperty("password");
  });

  it("retourne 409 si l'email est déjà utilisé", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await server.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });

    expect(response.statusCode).toBe(409);
  });
});

describe("POST /auth/login", () => {
  it("retourne 200 avec tokens si les credentials sont valides", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({
      id: 1,
      token: "refresh_token",
      userId: 1,
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com", password: "password123" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty("accessToken");
    expect(body.user.email).toBe("test@example.com");
  });

  it("retourne 401 si le mot de passe est incorrect", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com", password: "mauvais_mdp" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("retourne 401 si l'utilisateur n'existe pas", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "inconnu@example.com", password: "password123" },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("retourne 200 avec le profil si le token est valide", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const loginResponse = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com", password: "password123" },
    });
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({
      id: 1,
      token: "refresh_token",
      userId: 1,
      expiresAt: new Date(),
      createdAt: new Date(),
    });
    const { accessToken } = loginResponse.json();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const response = await server.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user.email).toBe("test@example.com");
  });

  it("retourne 401 sans token", async () => {
    const response = await server.inject({ method: "GET", url: "/auth/me" });
    expect(response.statusCode).toBe(401);
  });
});
