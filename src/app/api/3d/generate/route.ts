import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROJECT_ROOT = process.cwd();

const GENERATOR_DIR = path.join(
  PROJECT_ROOT,
  "3d-generator",
  "stable-fast-3d",
  "3d-generator",
  "worker"
);

const GENERATOR_FILE = path.join(
  GENERATOR_DIR,
  "generate.py"
);

const PYTHON =
  process.env.EYECAP_PYTHON ||
  "python";

const INPUT_DIR = path.join(
  GENERATOR_DIR,
  "input"
);

const OUTPUT_DIR = path.join(
  GENERATOR_DIR,
  "output"
);

const TEMP_DIR = path.join(
  GENERATOR_DIR,
  "temp"
);

const MAX_FILES = 12;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const TIMEOUT_MS = 15 * 60 * 1000;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

type StoredImage = {
  path: string;
  originalName: string;
};

function jsonError(
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details
        ? {
            details:
              typeof details === "string"
                ? details
                : String(details),
          }
        : {}),
    },
    { status }
  );
}

function safeFilename(name: string) {
  const ext = path.extname(name).toLowerCase();

  const base = path
    .basename(name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);

  return `${base || "image"}${ext}`;
}

function isAllowedImage(file: File) {
  const extension = path
    .extname(file.name)
    .toLowerCase();

  return (
    ALLOWED_TYPES.has(file.type) &&
    ALLOWED_EXTENSIONS.has(extension)
  );
}

async function runGenerator(
  inputImage: string,
  outputGlb: string,
  jobId: string
) {
  return new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    const args = [
      GENERATOR_FILE,
      inputImage,
      "--output",
      outputGlb,
      "--job-id",
      jobId,
    ];

    const child = spawn(
      PYTHON,
      args,
      {
        cwd: GENERATOR_DIR,
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
      }
    );

    let stdout = "";
    let stderr = "";

    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;

      finished = true;

      try {
        child.kill();
      } catch {
        // Ignore kill errors.
      }

      reject(
        new Error(
          `3D generator timed out after ${
            TIMEOUT_MS / 60000
          } minutes.`
        )
      );
    }, TIMEOUT_MS);

    child.stdout.on(
      "data",
      (chunk: Buffer) => {
        stdout += chunk.toString();
      }
    );

    child.stderr.on(
      "data",
      (chunk: Buffer) => {
        stderr += chunk.toString();
      }
    );

    child.on("error", (error) => {
      if (finished) return;

      finished = true;
      clearTimeout(timer);

      reject(error);
    });

    child.on("close", (code) => {
      if (finished) return;

      finished = true;
      clearTimeout(timer);

      resolve({
        code,
        stdout,
        stderr,
      });
    });
  });
}

export async function POST(
  request: NextRequest
) {
  const jobId = crypto
    .randomBytes(12)
    .toString("hex");

  const jobTempDir = path.join(
    TEMP_DIR,
    jobId
  );

  const jobOutputDir = path.join(
    OUTPUT_DIR,
    jobId
  );

  try {
    /*
     * ---------------------------------------------------------
     * VALIDATE GENERATOR
     * ---------------------------------------------------------
     */

    try {
      await fs.access(GENERATOR_FILE);
    } catch {
      return jsonError(
        `Generator not found: ${GENERATOR_FILE}`,
        500
      );
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE PYTHON
     * ---------------------------------------------------------
     */

    if (!PYTHON) {
      return jsonError(
        "EYECAP_PYTHON is not configured.",
        500
      );
    }

    /*
     * ---------------------------------------------------------
     * CREATE JOB DIRECTORIES
     * ---------------------------------------------------------
     */

    await fs.mkdir(
      jobTempDir,
      { recursive: true }
    );

    await fs.mkdir(
      jobOutputDir,
      { recursive: true }
    );

    /*
     * ---------------------------------------------------------
     * READ MULTIPART FORM
     * ---------------------------------------------------------
     */

    const formData =
      await request.formData();

    const files = formData
      .getAll("images")
      .filter(
        (value): value is File =>
          value instanceof File
      );

    /*
     * Backward compatibility:
     * also accept a single "image" field.
     */

    if (files.length === 0) {
      const single =
        formData.get("image");

      if (
        single instanceof File
      ) {
        files.push(single);
      }
    }

    if (files.length === 0) {
      return jsonError(
        "No image uploaded.",
        400
      );
    }

    if (files.length > MAX_FILES) {
      return jsonError(
        `Maximum ${MAX_FILES} images are allowed.`,
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE FILES
     * ---------------------------------------------------------
     */

    for (const file of files) {
      if (!isAllowedImage(file)) {
        return jsonError(
          `Unsupported image: ${file.name}. Use JPG, JPEG, PNG or WEBP.`,
          400
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return jsonError(
          `${file.name} exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
          400
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * STORE UPLOADED IMAGES
     * ---------------------------------------------------------
     */

    const storedImages: StoredImage[] = [];

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file = files[index];

      const filename =
        `${String(index + 1).padStart(2, "0")}_` +
        `${safeFilename(file.name)}`;

      const filePath = path.join(
        jobTempDir,
        filename
      );

      const buffer =
        Buffer.from(
          await file.arrayBuffer()
        );

      await fs.writeFile(
        filePath,
        buffer
      );

      storedImages.push({
        path: filePath,
        originalName: file.name,
      });
    }

    /*
     * ---------------------------------------------------------
     * PRIMARY IMAGE
     *
     * Stable Fast 3D currently accepts
     * one input image.
     *
     * Therefore the first image is the
     * reconstruction source.
     * Remaining images are retained for
     * future multi-view reconstruction.
     * ---------------------------------------------------------
     */

    const primaryImage =
      storedImages[0].path;

    /*
     * ---------------------------------------------------------
     * OUTPUT
     * ---------------------------------------------------------
     */

    const outputGlb =
      path.join(
        jobOutputDir,
        "model.glb"
      );

    /*
     * ---------------------------------------------------------
     * RUN PYTHON GENERATOR
     * ---------------------------------------------------------
     */

    const result =
      await runGenerator(
        primaryImage,
        outputGlb,
        jobId
      );

    /*
     * ---------------------------------------------------------
     * PYTHON FAILURE
     * ---------------------------------------------------------
     */

    if (result.code !== 0) {
      return jsonError(
        "3D generation failed.",
        500,
        [
          `Exit code: ${result.code}`,
          result.stdout,
          result.stderr,
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE OUTPUT
     * ---------------------------------------------------------
     */

    try {
      await fs.access(outputGlb);
    } catch {
      return jsonError(
        "Python generator completed but no GLB file was produced.",
        500,
        result.stdout || result.stderr
      );
    }

    const stat =
      await fs.stat(outputGlb);

    if (stat.size <= 0) {
      return jsonError(
        "Generated GLB is empty.",
        500
      );
    }

    /*
     * ---------------------------------------------------------
     * READ GLB
     * ---------------------------------------------------------
     */

    const glb =
      await fs.readFile(outputGlb);

    const outputFilename =
      `eyecap-${jobId}.glb`;

    /*
     * ---------------------------------------------------------
     * RETURN MODEL
     *
     * ArrayBuffer response allows the
     * Studio frontend to immediately
     * download/load the generated GLB.
     * ---------------------------------------------------------
     */

    return new NextResponse(
      glb as BodyInit,
      {
        status: 200,
        headers: {
          "Content-Type":
            "model/gltf-binary",

          "Content-Disposition":
            `attachment; filename="${outputFilename}"`,

          "X-EYECAP-Job-ID":
            jobId,

          "X-EYECAP-Input-Count":
            String(storedImages.length),

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "[EYECAP 3D] Generation error:",
      error
    );

    return jsonError(
      "Unexpected 3D generation error.",
      500,
      error instanceof Error
        ? error.message
        : String(error)
    );
  } finally {
    /*
     * ---------------------------------------------------------
     * CLEAN TEMP JOB
     * ---------------------------------------------------------
     */

    try {
      await fs.rm(
        jobTempDir,
        {
          recursive: true,
          force: true,
        }
      );
    } catch {
      // Ignore cleanup errors.
    }
  }
}