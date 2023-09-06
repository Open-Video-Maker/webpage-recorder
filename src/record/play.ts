import { Chromium, type ChromiumOptions } from "../vendor/chromium";

interface PlayOptions {
  url: string;
  chromiumOptions: ChromiumOptions;
  onReady?: () => void;
  onProgress?: (percentage: number) => void;
}

export const play = async ({
  url,
  chromiumOptions,
  onReady,
  onProgress,
}: PlayOptions): Promise<void> => {
  onProgress?.(0);

  const page = await new Chromium(chromiumOptions).newPage();
  onProgress?.(10);

  // eslint-disable-next-line -- logging
  console.log("Recorder: navitating to", url);
  await page.goto(url);
  onProgress?.(20);

  onReady?.();

  // eslint-disable-next-line -- logging
  console.log("Recorder: executing script");

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000 * 10);
  });
};
