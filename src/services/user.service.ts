import prisma from "../lib/prisma.js";
import { ConflictError, NotFoundError } from "../common/exceptions.js";

interface UpdateUserInput {
  name?: string;
  email?: string;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
}

export async function updateUser(userId: number, input: UpdateUserInput) {
  if (input.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictError("Email déjà utilisé");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function deleteUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("Utilisateur introuvable");
  }

  await prisma.user.delete({ where: { id: userId } });
}
