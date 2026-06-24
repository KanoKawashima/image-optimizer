import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

type OutputFile = {
  originalName: string;
  name: string;
  mime: string;
  file: string;
  preview?: string;
  beforeSize: number;
  afterSize: number;
  previewMime?: string;
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const files = formData.getAll("images") as File[];

  const outputOriginal =
    formData.get("outputOriginal") === "true";

  const outputWebp =
    formData.get("outputWebp") === "true";

  const outputAvif =
    formData.get("outputAvif") === "true";

  const jpgQuality = Number(formData.get("jpgQuality")) || 80;
  const webpQuality = Number(formData.get("webpQuality")) || 80;
  const avifQuality = Number(formData.get("avifQuality")) || 50;

  if (files.length === 0) {
    return NextResponse.json({
      success: false,
      message: "画像がありません",
      files: [],
    });
  }

  const outputFiles: OutputFile[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();
    const baseName = file.name.replace(/\.[^.]+$/, "");

    if (outputOriginal) {
      let optimizedBuffer: Buffer;
      let outputName = file.name;
      let mime = file.type;

      if (metadata.format === "jpeg") {
        optimizedBuffer = await sharp(buffer)
          .jpeg({
            quality: jpgQuality,
            mozjpeg: true,
          })
          .toBuffer();

        mime = "image/jpeg";
      } else if (metadata.format === "png") {
        optimizedBuffer = await sharp(buffer)
          .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
          })
          .toBuffer();

        mime = "image/png";
      } else {
        continue;
      }

      outputFiles.push({
        originalName: file.name,
        name: outputName,
        mime,
        file: optimizedBuffer.toString("base64"),
        preview: buffer.toString("base64"),
        beforeSize: file.size,
        afterSize: optimizedBuffer.length,
        previewMime: file.type,
      });
    }

    if (outputWebp) {
      const webpBuffer = await sharp(buffer)
        .webp({
          quality: webpQuality,
        })
        .toBuffer();

      outputFiles.push({
        originalName: file.name,
        name: `${baseName}.webp`,
        mime: "image/webp",
        file: webpBuffer.toString("base64"),
        preview: buffer.toString("base64"),
        beforeSize: file.size,
        afterSize: webpBuffer.length,
        previewMime: file.type,
      });
    }

    if (outputAvif) {
      const avifBuffer = await sharp(buffer)
        .avif({
          quality: avifQuality,
        })
        .toBuffer();

      outputFiles.push({
        originalName: file.name,
        name: `${baseName}.avif`,
        mime: "image/avif",
        file: avifBuffer.toString("base64"),
        preview: buffer.toString("base64"),
        beforeSize: file.size,
        afterSize: avifBuffer.length,
        previewMime: file.type,
      });
    }
  }

  return NextResponse.json({
    success: true,
    files: outputFiles,
  });
}