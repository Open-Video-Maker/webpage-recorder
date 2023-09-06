import { Subprocess } from "bun";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
// import { execa, type ExecaChildProcess } from "execa";
import { type Xvfb } from "./xvfb";

interface FFmpegOptions {
  id: string;
  xvfb: Xvfb;
  framerate: number;
  /** record or transcode "duration" seconds of audio/video, @defaultValue 300 */
  duration: number;
}

export class FFmpeg {
  private options: FFmpegOptions;
  childProcess?: Subprocess;

  constructor({
    id = Date.now().toString(),
    xvfb,
    framerate = 30,
    duration = 300,
  }: Partial<FFmpegOptions> = {}) {
    assert(xvfb, "xvfb instance is required");
    this.options = { id, xvfb, framerate, duration };
  }

  get id(): string {
    return this.options.id;
  }

  get filename(): string {
    return `${this.id}.mp4`;
  }

  get output(): string {
    return `output/${this.filename}`;
  }

  async record(): Promise<this> {
    const {
      xvfb: { display, screen, width, height },
      framerate,
      duration,
    } = this.options;

    const output = path.resolve(process.cwd(), this.output);
    await fs.promises.mkdir(path.dirname(output), { recursive: true });

    this.childProcess = Bun.spawn(
      [
        "ffmpeg",
        "-f",
        "x11grab",
        "-video_size",
        `${width}x${height}`,
        "-framerate",
        `${framerate}`,
        "-r",
        `${framerate}`,
        "-probesize",
        "8M",
        "-rtbufsize",
        "100M",
        "-draw_mouse",
        "0",
        // we have to put the `-i` after `-f`, otherwise ffmpeg will try to handle it as an invalid file,
        // and report error: ':99.0: Protocol not found, did you mean file ::99.0?'
        "-i",
        `:${display}.${screen}`,
        "-t",
        `${duration}`,
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        // '-y', // overwrite existing file without asking
        path.resolve(process.cwd(), `output/${this.filename}`),
      ],
      { stdin: "inherit" }
    );

    return this;
  }

  async stop(): Promise<void> {
    if (this.childProcess && this.childProcess.pid) {
      this.childProcess.kill(2);
      await this.childProcess.exited;
    }
  }
}
