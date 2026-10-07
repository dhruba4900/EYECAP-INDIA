# EYECAP 3D Studio — complete AI integration

## 1. Copy files

Copy:

- `app/api/3d/generate/route.ts`
- `components/3d-studio/AI3DGenerator/AI3DGeneratorPanel.tsx`

into the Next.js project.

## 2. Environment

Add to `.env.local`:

```env
EYECAP_PYTHON=C:\Users\dhiman_new\anaconda3\envs\eyecap3d\python.exe
```

Restart `npm run dev` after changing `.env.local`.

## 3. Integrate the AI panel into the Studio

In the Studio page that already owns:

```ts
const engineRef = useRef<EngineContext | null>(null);
```

add:

```ts
import AI3DGeneratorPanel from "@/components/3d-studio/AI3DGenerator/AI3DGeneratorPanel";
```

Then render:

```tsx
<AI3DGeneratorPanel engineRef={engineRef} />
```

The best location is the top of the existing right sidebar, before Transform Mode.

## 4. What works

- Single image upload
- Multiple image upload (up to 12)
- Individual image removal
- Primary image selection
- Generate GLB
- Regenerate / redefine using the current uploaded image set
- Generated GLB automatically loads into EngineContext
- Reload generated GLB
- Download GLB
- Generation history in the current Studio session
- Product selection
- Publish generated GLB through the existing `/api/admin/assets/3d`
- 25 MB per-image validation
- Python process timeout
- Python stdout/stderr capture
- Clear API error reporting
- Temporary job cleanup

## Important model limitation

The supplied `generate.py` calls Stable Fast 3D's single-image `model.run_image(...)`.

Therefore multiple uploaded images are currently supported as a multi-reference workflow, but they are NOT mathematically fused into one multi-view reconstruction by Stable Fast 3D.

The `primaryIndex` image is the actual reconstruction input.

For true multi-view geometry fusion, the Python inference backend must later be replaced/extended with a multi-view reconstruction model. The Studio/API contract does not need to change.

## 5. Run

From the Next.js project root:

```powershell
npm run dev
```

Then open:

```text
http://localhost:3000/3d-studio
```

The Python environment must be available on the same machine as the Next.js server for this local synchronous implementation.
