import { Subprocess } from "bun";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
// import { execa, type ExecaChildProcess } from "execa";
import { type Xvfb } from "./xvfb";

interface FFmpegOptions {
  id: string;
  /** xvfb instance */
  xvfb: Xvfb;
  /** @commonValues 24 30 60 120 (fps)  */
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
        // the format of the input data or source
        "-f",
        // capture video from the X Window System (X11)
        "x11grab",
        // set the video frame size
        "-video_size",
        `${width}x${height}`,
        // desired frame rate (frames per second) of the captured video
        "-framerate",
        `${framerate}`,
        // sets the output frame rate of the video
        "-r",
        `${framerate}`,
        // The probe size allows ffmpeg to identify the input stream's format correctly without consuming
        // excessive resources by probing the entire stream.
        // A larger probe size may help ffmpeg to identify complex or non-standard formats accurately.
        "-probesize",
        "8M",
        // setting the maximum data sizes that ffmpeg can buffer in memory before encoding and outputting it.
        "-rtbufsize",
        "100M",
        "-draw_mouse",
        // 0 means the cursor/mouse pointer should not be drawn in the captured video
        "0",
        // we have to put the `-i` after `-f`, otherwise ffmpeg will try to handle it as an invalid file,
        // and report error: ':99.0: Protocol not found, did you mean file ::99.0?'
        // specify the input source: capture video from a specific X11 display and screen
        "-i",
        `:${display}.${screen}`,
        // represent the duration (in seconds) that ffmpeg should capture video
        "-t",
        `${duration}`,
        // pixel format
        "-pix_fmt",
        "yuv420p",
        // specifies the video codec to be used for encoding the output video
        "-c:v",
        // H.264 video codec
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
