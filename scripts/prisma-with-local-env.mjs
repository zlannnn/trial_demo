import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolvePrismaDatabaseEnv } from "./prisma-env.mjs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

resolvePrismaDatabaseEnv();

const args = process.argv.slice(2);
const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
