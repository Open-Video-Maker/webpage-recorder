import type Elysia from "elysia";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

export const video = (app: Elysia) =>
  app.get("/video", ({ query }) => {
    const filename = query.filename;

    const filePath = path.resolve(cwd, "output", `${filename}`);
    if (fs.existsSync(filePath)) {
      const fileStream = fs.readFileSync(filePath);
      return new Response(fileStream, {
        headers: {
          "Content-Type": "video/mp4",
        },
      });
    }
    return "not found";
  });
