import { type Elysia, t } from "elysia";
import fs from "node:fs";
import path from "node:path";
import { Xvfb } from "../vendor/xvfb";
import { FFmpeg } from "../vendor/ffmpeg";
import { play } from "../record/play";

const cwd = process.cwd();

export const record = (app: Elysia) =>
  app.get(
    "/record",
    async ({ query }) => {
      const url = query.url || "https://www.baidu.com";
      const width = query.w ?? 1920;
      const height = query.h ?? 1080;
      const framerate = query.f ?? 60;

      const display = await Xvfb.getAvailableDisplayNumber();
      const xvfb = await new Xvfb({ width, height }).start();

      const ffmpeg = new FFmpeg({ xvfb, framerate });
      const { id, filename } = ffmpeg;

      await fs.promises.mkdir(path.resolve(cwd, "output"), { recursive: true });
      await fs.promises.writeFile(
        path.resolve(cwd, "output", `${id}.json`),
        JSON.stringify({ id, filename, progress: 0 }, null, 2)
      );

      const record = async () => {
        try {
          await play({
            url,
            chromiumOptions: { xvfb },
            onReady: () => {
              // eslint-disable-next-line -- for async exectuion
              ffmpeg.record();
            },
            onProgress: (progress) => {
              // eslint-disable-next-line -- for async exectuion
              fs.promises.writeFile(
                path.resolve(cwd, "output", `${id}.json`),
                JSON.stringify({ id, filename, progress }, null, 2)
              );
            },
          });

          // eslint-disable-next-line -- logging
          console.log("Recorder: stop ffmpeg");
          await ffmpeg.stop();
          await fs.promises.writeFile(
            path.resolve(cwd, "output", `${id}.json`),
            JSON.stringify({ id, filename, progress: 100 }, null, 2)
          );
        } catch (error) {
          await fs.promises.writeFile(
            path.resolve(cwd, "output", `${id}.json`),
            // eslint-disable-next-line -- error logging
            JSON.stringify(
              { id, filename, error: (error as any).message },
              null,
              2
            )
          );
          throw error;
        } finally {
          await ffmpeg.stop();
          await xvfb.stop();
        }
      };
      record();

      return { id, display };
    },
    {
      query: t.Object({
        url: t.String(),
        w: t.Optional(t.Number()),
        h: t.Optional(t.Number()),
        f: t.Optional(t.Number()),
      }),
    }
  );
