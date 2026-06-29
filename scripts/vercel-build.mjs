import { spawnSync } from "node:child_process";
import { resolvePrismaDatabaseEnv } from "./prisma-env.mjs";

const FAILED_RECOVERY_MIGRATION = "20260629120000_ensure_conversations_table";

function run(command, args, { optional = false } = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.status !== 0 && !optional) {
    process.exit(result.status ?? 1);
  }

  return result.status ?? 1;
}

resolvePrismaDatabaseEnv();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
  console.error(
    "Missing DATABASE_URL. Set DATABASE_URL or connect Vercel Postgres (POSTGRES_PRISMA_URL).",
  );
  process.exit(1);
}

console.log(
  `Recovering failed migration (if any): ${FAILED_RECOVERY_MIGRATION}...`,
);
run(
  "npx",
  [
    "prisma",
    "migrate",
    "resolve",
    "--rolled-back",
    FAILED_RECOVERY_MIGRATION,
  ],
  { optional: true },
);

console.log("Running prisma migrate deploy...");
run("npx", ["prisma", "migrate", "deploy"]);

console.log("Running next build...");
run("npx", ["next", "build"]);
