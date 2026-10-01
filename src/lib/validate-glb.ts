import { z } from "zod";

export type GlbMetadata = {
  triangleCount: number;
  textureCount: number;
};

const gltfDocumentSchema = z.object({
  asset: z.object({ version: z.string() }).passthrough(),
  buffers: z.array(z.object({ uri: z.string().optional() }).passthrough()).optional(),
  images: z.array(z.object({ uri: z.string().optional() }).passthrough()).optional(),
  accessors: z.array(z.object({ count: z.number().int().nonnegative().optional() }).passthrough()).optional(),
  meshes: z.array(z.object({
    primitives: z.array(z.object({
      mode: z.number().int().optional(),
      indices: z.number().int().nonnegative().optional(),
      attributes: z.record(z.number().int().nonnegative()).optional(),
    }).passthrough()).optional(),
  }).passthrough()).optional(),
  textures: z.array(z.unknown()).optional(),
}).passthrough();

export function validateGlb(buffer: Buffer): GlbMetadata {
  if (buffer.byteLength < 20) throw new Error("GLB file is truncated.");
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("Model must be a binary glTF (.glb) file.");
  if (view.getUint32(4, true) !== 2) throw new Error("Only glTF binary version 2 is supported.");
  if (view.getUint32(8, true) !== buffer.byteLength) throw new Error("GLB header length does not match the uploaded file.");

  let offset = 12;
  let gltf: z.infer<typeof gltfDocumentSchema> | null = null;
  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > buffer.byteLength) throw new Error("GLB contains an invalid chunk length.");
    if (offset === 12 && chunkType !== 0x4e4f534a) {
      throw new Error("GLB must begin with a glTF JSON chunk.");
    }
    if (chunkType === 0x4e4f534a && !gltf) {
      try {
        const parsed = gltfDocumentSchema.safeParse(
          JSON.parse(buffer.subarray(chunkStart, chunkEnd).toString("utf8").replace(/[\u0000\s]+$/g, ""))
        );
        if (!parsed.success) throw new Error("invalid schema");
        gltf = parsed.data;
      } catch {
        throw new Error("GLB contains invalid model metadata.");
      }
    } else if (chunkType === 0x4e4f534a) {
      throw new Error("GLB must contain exactly one JSON chunk.");
    }
    offset = chunkEnd;
  }
  if (offset !== buffer.byteLength || !gltf || gltf.asset?.version !== "2.0") {
    throw new Error("GLB must contain valid glTF 2.0 metadata.");
  }

  for (const resource of [...(gltf.buffers || []), ...(gltf.images || [])]) {
    if (resource.uri && !resource.uri.startsWith("data:")) {
      throw new Error("External model resources are not allowed. Embed textures and buffers in the GLB.");
    }
  }

  const accessors = gltf.accessors || [];
  let triangleCount = 0;
  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const mode = primitive.mode ?? 4;
      if (mode !== 4 && mode !== 5 && mode !== 6) continue;
      const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION;
      const count = accessorIndex === undefined ? 0 : accessors[accessorIndex]?.count || 0;
      triangleCount += mode === 4 ? Math.floor(count / 3) : Math.max(0, count - 2);
    }
  }

  return { triangleCount, textureCount: gltf.textures?.length || 0 };
}
