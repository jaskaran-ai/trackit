import { spawnSync } from "node:child_process";
import "dotenv/config";

const PRODUCTION_APP_URL = "https://request.ivalt.com";

const entries = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: PRODUCTION_APP_URL,
  NEXT_PUBLIC_APP_URL: PRODUCTION_APP_URL,
  TRUSTED_ORIGINS: PRODUCTION_APP_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "public/uploads",
  MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB ?? "10",
  NEXT_PUBLIC_USE_UPLOADTHING: process.env.NEXT_PUBLIC_USE_UPLOADTHING ?? "true",
  UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
};

for (const [name, value] of Object.entries(entries)) {
  if (value === undefined || value === "") {
    console.warn(`skip ${name} (empty)`);
    continue;
  }

  for (const target of ["production", "preview"]) {
    const result = spawnSync(
      "vercel",
      ["env", "add", name, target, "--force"],
      {
        input: value,
        encoding: "utf8",
        stdio: ["pipe", "inherit", "inherit"],
      },
    );

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }

  console.log(`updated ${name}`);
}
