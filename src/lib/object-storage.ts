import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

function getStorageConfig() {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured.");
  }
  return { bucket, accessKeyId, secretAccessKey };
}

function getClient() {
  if (!client) {
    const { accessKeyId, secretAccessKey } = getStorageConfig();
    client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export async function storePrivateObject(key: string, body: Buffer, contentType: string) {
  const { bucket } = getStorageConfig();
  await getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentLength: body.byteLength,
    ContentType: contentType,
    CacheControl: "private, no-store",
  }));
}

export async function deletePrivateObject(key: string) {
  const { bucket } = getStorageConfig();
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function createObjectDownloadUrl(key: string, expiresIn = 600) {
  const { bucket } = getStorageConfig();
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}
