import { Subprocess } from "bun";
import fs from "node:fs";
// import { execa, type ExecaChildProcess } from "execa";
import retry from "p-retry";

interface XvfbOptions {
  /** determines which X server instance a client application should connect to */
  display: number;
  /** the identifier assigned to a physical or virtual screen (display) connected to an X server */
  screen: number;
  /** screen resolution: width */
  width: number;
  /** screen resolution: height */
  height: number;
  /** Setting about how many bits are used to represent each pixel's color information
   * @commonValue:
   * 1 bit: Monochrome (black and white).
   * 8 bits: 256 colors (commonly used for older systems).
   * 16 bits: Thousands of colors (commonly used for older systems).
   * 24 bits: Millions of colors (commonly used for modern displays).
   * 32 bits: Millions of colors with an alpha (transparency) channel.
   */
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
        "-ac", // X server permit access control by the server
        "-nocursor", // disable the cursor
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
