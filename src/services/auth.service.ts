import crypto from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../common/exceptions.js";

const SALT_ROUNDS = parseInt(process.env["BCRYPT_SALT_ROUNDS"] || "10");
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(
  process.env["REFRESH_TOKEN_EXPIRY_DAYS"] || "7",
);

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError("Email déjà utilisé");
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      address: input.address,
      city: input.city,
      zipCode: input.zipCode,
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new UnauthorizedError("Email ou mot de passe incorrect");
  }

  const isValid = await bcrypt.compare(input.password, user.password);

  if (!isValid) {
    throw new UnauthorizedError("Email ou mot de passe incorrect");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("Utilisateur introuvable");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function createRefreshToken(userId: number) {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function rotateRefreshToken(oldToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  });

  if (!stored) {
    throw new UnauthorizedError("Refresh token invalide");
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new UnauthorizedError("Refresh token expiré");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newToken = await createRefreshToken(stored.userId);
  const { password: _, ...userWithoutPassword } = stored.user;

  return { user: userWithoutPassword, refreshToken: newToken };
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}
