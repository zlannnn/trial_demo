import { spawnSync } from "node:child_process";
import { resolvePrismaDatabaseEnv } from "./prisma-env.mjs";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

resolvePrismaDatabaseEnv();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
  console.error(
    "Missing DATABASE_URL. Set DATABASE_URL or connect Vercel Postgres (POSTGRES_PRISMA_URL).",
  );
  process.exit(1);
}

console.log("Running prisma migrate deploy...");
run("npx", ["prisma", "migrate", "deploy"]);

console.log("Running next build...");
run("npx", ["next", "build"]);
