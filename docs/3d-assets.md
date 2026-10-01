# Secure 3D asset storage

The 3D asset manager requires a private S3-compatible bucket. Add these server-only variables to `.env` (or the deployment secret store):

```text
S3_BUCKET=eyecap-assets
S3_REGION=us-east-1
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

For AWS S3, leave `S3_ENDPOINT` empty. For another S3-compatible service, set its HTTPS endpoint and the region required by that service. Never prefix these names with `NEXT_PUBLIC_` or expose the credentials to browser code. Use a private bucket and an access key limited to the asset bucket and the `models/*` prefix.

The browser uploads through the authenticated server API. The server accepts a glTF 2.0 binary `.glb` up to 20 MB and an optional Blender `.blend` master up to 50 MB. GLB metadata is checked, external buffer and image URLs are rejected, and the model is kept private until published. Blender files are signature-checked and remain private; they are never sent to the customer viewer.

Published GLBs are delivered to the storefront using 15-minute signed download URLs. Admin-only Blender source downloads use 5-minute signed URLs and are audit logged. Configure bucket CORS to allow `GET` and `HEAD` only from the storefront origin so browsers can load signed models; do not make the bucket public. Admin upload and download operations are performed server-side.

The current pipeline validates and records file size, triangle count, and texture count. It does not yet run Draco/Meshopt/KTX2 compression, create LODs, or transcode textures; export optimized assets from Blender before upload when those optimizations are required.
