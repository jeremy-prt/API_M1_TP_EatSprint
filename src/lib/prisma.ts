import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env["DATABASE_HOST"] || "localhost",
  user: process.env["DATABASE_USER"] || "root",
  password: process.env["DATABASE_PASSWORD"] || "root",
  database: process.env["DATABASE_NAME"] || "eatsprint",
});

const prisma = new PrismaClient({ adapter });

export default prisma;
