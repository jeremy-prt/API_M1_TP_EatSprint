import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../common/exceptions.js";

const SALT_ROUNDS = 10;

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
