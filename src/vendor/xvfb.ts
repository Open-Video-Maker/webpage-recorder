import { Subprocess } from "bun";
import fs from "node:fs";
// import { execa, type ExecaChildProcess } from "execa";
import retry from "p-retry";

interface XvfbOptions {
  display: number;
  screen: number;
  width: number;
  height: number;
  depth: number;
}

export class Xvfb {
  private options: XvfbOptions;
  childProcess?: Subprocess;

  constructor({
    display = 0,
    screen = 0,
    width = 1280,
    height = 720,
    depth = 24,
  }: Partial<XvfbOptions> = {}) {
    this.options = { display, screen, width, height, depth };
  }

  static async getAvailableDisplayNumber(): Promise<number> {
    for (let i = 0; i < 100; i++) {
      try {
        // eslint-disable-next-line -- temp
        await fs.promises.stat(`/tmp/.X${i}-lock`);
      } catch (e) {
        return i;
      }
    }
    throw new Error("No available display number found");
  }

  get display(): number {
    return this.options.display;
  }

  get screen(): number {
    return this.options.screen;
  }

  get width(): number {
    return this.options.width;
  }

  get height(): number {
    return this.options.height;
  }

  get env(): { DISPLAY: string } {
    return {
      DISPLAY: `:${this.display}`,
    };
  }

  private lockFile(): string {
    return `/tmp/.X${this.display}-lock`;
  }

  async start(): Promise<this> {
    const { display, screen, width, height, depth } = this.options;

    this.childProcess = Bun.spawn(
      [
        "Xvfb",
        `:${display}`,
        "-ac",
        "-nocursor",
        "-screen",
        String(screen),
        `${width}x${height}x${depth}`,
      ],
      { stdin: "inherit" }
    );

    await retry(() => fs.promises.stat(this.lockFile()));

    return this;
  }

  async stop(): Promise<void> {
    if (this.childProcess && this.childProcess.pid) {
      this.childProcess.kill(2);
      await this.childProcess.exited;
    }
  }
}
