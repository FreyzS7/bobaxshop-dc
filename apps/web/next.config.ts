import type { NextConfig } from "next";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Load root .env (monorepo root)
const envPath = resolve(process.cwd(), "../../.env");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    });
}

const nextConfig: NextConfig = {
  transpilePackages: ["@bobaxshop/database", "@bobaxshop/shared", "@bobaxshop/config"],
};

export default nextConfig;
