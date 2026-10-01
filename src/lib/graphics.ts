import { z } from "zod";

export const graphicsConfigSchema = z.object({
  cameraFov: z.number().min(35).max(70),
  cameraDistance: z.number().min(3).max(7),
  ambientIntensity: z.number().min(0.1).max(2.5),
  keyLightIntensity: z.number().min(0.1).max(5),
  fillLightIntensity: z.number().min(0).max(3),
  rimLightIntensity: z.number().min(0).max(3),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  animationPreset: z.enum(["off", "slow-turn", "floating"]),
  qualityPreset: z.enum(["auto", "high", "medium", "low"]),
});

export type GraphicsConfig = z.infer<typeof graphicsConfigSchema>;

export const defaultGraphicsConfig: GraphicsConfig = {
  cameraFov: 45,
  cameraDistance: 4.5,
  ambientIntensity: 1.2,
  keyLightIntensity: 2.5,
  fillLightIntensity: 1.2,
  rimLightIntensity: 1.5,
  backgroundColor: "#08090c",
  animationPreset: "slow-turn",
  qualityPreset: "auto",
};

export function parseGraphicsConfig(value: string | null | undefined): GraphicsConfig {
  if (!value) return defaultGraphicsConfig;
  return graphicsConfigSchema.parse(JSON.parse(value));
}
