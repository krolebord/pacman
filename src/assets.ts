import { assetPaths } from "./assetPaths";

export const assets = Object.fromEntries(
  Object.keys(assetPaths).map((key) => [
    key,
    document.getElementById(`asset-${key}`)! as HTMLImageElement,
  ])
) as Record<keyof typeof assetPaths, HTMLImageElement>;
