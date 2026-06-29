export function deriveDirectUrl(pooledUrl) {
  try {
    const url = new URL(pooledUrl);
    url.hostname = url.hostname.replace("-pooler", "");
    url.searchParams.delete("pgbouncer");
    url.searchParams.delete("connection_limit");
    return url.toString();
  } catch {
    return pooledUrl;
  }
}

/** Resolve DATABASE_URL / DIRECT_URL for Prisma CLI (local + Vercel Postgres). */
export function resolvePrismaDatabaseEnv() {
  if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  }

  if (!process.env.DIRECT_URL && process.env.POSTGRES_URL_NON_POOLING) {
    process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING;
  }

  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = deriveDirectUrl(process.env.DATABASE_URL);
  }

  // prisma generate only needs the variable to exist during schema parsing
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL =
      "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }
}
