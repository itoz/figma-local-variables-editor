import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function rgbaToHex(rgba: string): string {
  const match = rgba.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(?:\.\d+)?)\)/
  );
  if (!match) return rgba;

  const [_, r, g, b, a] = match;
  const alpha = parseFloat(a);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hexR = toHex(parseInt(r));
  const hexG = toHex(parseInt(g));
  const hexB = toHex(parseInt(b));

  if (alpha < 1) {
    const hexA = toHex(Math.round(alpha * 255));
    return `#${hexR}${hexG}${hexB}${hexA}`;
  }

  return `#${hexR}${hexG}${hexB}`;
}
