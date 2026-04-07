# EatSprint API

API REST pour le frontend de mon projet scolaire EatSprint M1.

## Stack

- **Fastify** + TypeScript
- **Prisma** (MySQL)

## Lancer le projet

```bash
npm install
cp .env.example .env  # configurer la DB
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Routes

| Préfixe                   | Description                           |
| ------------------------- | ------------------------------------- |
| `/auth`                   | Register, login, refresh, logout, me  |
| `/users/me`               | Profil utilisateur (GET, PUT, DELETE) |
| `/restaurants`            | CRUD restaurants                      |
| `/restaurants/:id/dishes` | Plats par restaurant                  |
| `/dishes/:id`             | CRUD plats                            |
| `/orders`                 | Commandes (création, liste, statuts)  |

`insomnia.yaml` pour import la collection complète si besoin (dans insomnia en gros équivalent postman)
