import type { DownloadedImage, LanhuProjectImage, RestorationPage } from "../types.js";

export function buildLocalImageInfo(
  image: LanhuProjectImage,
  downloadedImage: DownloadedImage | undefined
): RestorationPage["localImage"] | undefined {
  if (!downloadedImage) {
    return undefined;
  }

  return {
    path: downloadedImage.path,
    contentType: downloadedImage.contentType,
    fileSizeBytes: downloadedImage.fileSizeBytes,
    pixelSize: downloadedImage.pixelSize,
    apiToPixelScale: downloadedImage.pixelSize
      ? {
          x: image.width ? roundScale(downloadedImage.pixelSize.width / image.width) : undefined,
          y: image.height ? roundScale(downloadedImage.pixelSize.height / image.height) : undefined
        }
      : undefined
  };
}

function roundScale(value: number): number {
  return Math.round(value * 1000) / 1000;
}
