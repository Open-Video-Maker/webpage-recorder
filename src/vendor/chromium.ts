import assert from "node:assert";
import { launch, type Browser, type Page } from "puppeteer";
import type { Xvfb } from "./xvfb";

export interface ChromiumOptions {
  xvfb: Xvfb;
}

export class Chromium {
  private options: ChromiumOptions;

  constructor({ xvfb }: Partial<ChromiumOptions> = {}) {
    assert(xvfb, "xvfb instance is required");
    this.options = { xvfb };
  }

  async launch(): Promise<Browser> {
    const { width, height, env } = this.options.xvfb;

    return launch({
      headless: false,
      args: [
        "--kiosk", // make it fullscreen on load
        `--window-size=${width},${height}`,
        `--no-sandbox`, // run as root
        `--disable-dev-shm-usage`, // use /tmp instead of /dev/shm
        `--disable-infobars`, // hide the windows address bars
      ],
      ignoreDefaultArgs: ["--enable-automation"], // don't show the warning "Chrome is being controlled by automated test software."
      env,
      defaultViewport: {
        width,
        height,
      },
    });
  }

  async newPage(): Promise<Page> {
    const browser = await this.launch();
    return browser.newPage();

    // 'https://player.vimeo.com/video/451122439?autoplay=1&background=1#t=62'
  }
}
