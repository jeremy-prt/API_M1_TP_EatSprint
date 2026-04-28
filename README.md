# EatSprint API

API REST pour la plateforme de livraison EatSprint (projet M1).

## Configuration

```bash
cp .env.example .env
```

| Variable                    | Défaut      | Description                                                                               |
| --------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`              | —           | URL complète de connexion MySQL utilisée par Prisma pour les migrations                   |
| `DATABASE_HOST`             | `localhost` | Hôte du serveur MySQL                                                                     |
| `DATABASE_USER`             | `root`      | Utilisateur MySQL                                                                         |
| `DATABASE_PASSWORD`         | `root`      | Mot de passe MySQL                                                                        |
| `DATABASE_NAME`             | `eatsprint` | Nom de la base de données                                                                 |
| `JWT_SECRET`                | —           | Clé secrète utilisée pour signer les access tokens JWT                                    |
| `ACCESS_TOKEN_EXPIRY`       | `5m`        | Durée de validité de l'access token (format `1h`, `15m`, etc.)                            |
| `REFRESH_TOKEN_EXPIRY_DAYS` | `7`         | Durée de validité du refresh token, en jours                                              |
| `BCRYPT_SALT_ROUNDS`        | `10`        | Coût bcrypt pour le hachage des mots de passe (plus élevé = plus sécurisé mais plus lent) |

## Lancer avec Docker

```bash
docker compose up --build -d
```

Démarre MySQL, crée la base `eatsprint`, applique les migrations Prisma puis lance l'API.

- API : `http://localhost:4000`
- Swagger : `http://localhost:4000/docs`
- MySQL : `localhost:3307`

Pour insérer les données de test (40 restaurants, 102 plats, comptes admin/client/owners) :

```bash
docker compose exec api npx prisma db seed
```

## Lancer en local

Prérequis : Node.js 22+ et un MySQL local.

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

API sur `http://localhost:3000`, Swagger sur `http://localhost:3000/docs`.

## Comptes de test (après seed)

| Rôle             | Email                              | Mot de passe |
| ---------------- | ---------------------------------- | ------------ |
| Admin            | `admin@eatsprint.com`              | `123456`     |
| Client           | `client@test.com`                  | `123456`     |
| Restaurant owner | `owner-<slug-resto>@eatsprint.com` | `123456`     |

Exemple owner : `owner-le-bistrot-parisien@eatsprint.com`.

## Tests

```bash
npm test
npm run test:coverage
```
