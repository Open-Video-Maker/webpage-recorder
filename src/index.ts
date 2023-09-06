import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { html } from "@elysiajs/html";

import { record } from "./plugins/record";
import { video } from "./plugins/video";
import { page } from "./templates";

const app = new Elysia()
  .use(swagger())
  .use(html())
  .state("version", 1)
  .decorate("getDate", () => Date.now())
  .group("/v1", (app) => app.use(record).use(video))
  .get("/", ({ html }) => html(page))
  .get(
    "/version",
    ({ getDate, store: { version } }) => `${version} ${getDate()}`
  )
  .onError(({ code, error }) => {
    return new Response(error.toString());
  })
  .listen(process.env.PORT || 3300);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
