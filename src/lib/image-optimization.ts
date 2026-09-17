"use client";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TARGET_SIZE = 2 * 1024 * 1024;
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSIONS = [1920, 1600, 1280, 1024, 800];
const JPEG_QUALITIES = [0.82, 0.76, 0.7, 0.64, 0.58];

export class ImageOptimizationError extends Error {}

type DecodedImage = { width: number; height: number; draw: (context: CanvasRenderingContext2D, width: number, height: number) => void; close?: () => void };

async function decodeImage(file: File): Promise<DecodedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { width: bitmap.width, height: bitmap.height, draw: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height), close: () => bitmap.close() };
    } catch {
      // Fall through to the image element decoder for browsers without bitmap support.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new ImageOptimizationError("This image could not be read."));
      element.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight, draw: (context, width, height) => context.drawImage(image, 0, 0, width, height) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function optimizeVehicleImage(file: File, fileName: string): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new ImageOptimizationError("Use a JPG, PNG or WEBP image.");
  if (!file.size) throw new ImageOptimizationError("Select a non-empty vehicle photo.");
  const decoded = await decodeImage(file);
  try {
    if (!decoded.width || !decoded.height) throw new ImageOptimizationError("This image could not be read.");
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const extension = outputType === "image/png" ? "png" : "jpg";
    const safeName = fileName.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "vehicle-photo";
    for (const maxDimension of MAX_DIMENSIONS) {
      const scale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height));
      const width = Math.max(1, Math.round(decoded.width * scale));
      const height = Math.max(1, Math.round(decoded.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new ImageOptimizationError("Image optimization is not available in this browser.");
      decoded.draw(context, width, height);
      const qualities = outputType === "image/jpeg" ? JPEG_QUALITIES : [undefined];
      for (const quality of qualities) {
        const blob = await canvasBlob(canvas, outputType, quality);
        if (!blob) continue;
        if (blob.size <= TARGET_SIZE || blob.size <= MAX_SIZE)
          return new File([blob], `${safeName}.${extension}`, { type: outputType, lastModified: Date.now() });
      }
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    decoded.close?.();
  }
  throw new ImageOptimizationError("Photo could not be optimized below 5 MB. Please choose another photo.");
}
