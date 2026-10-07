export interface EyewearSymmetrySpecs {
  leftTempleLength: number;
  rightTempleLength: number;
  leftLensWidth: number;
  rightLensWidth: number;
  allowAsymmetry: boolean;
}

export class SymmetryManager {
  public static normalizeDimensions(specs: EyewearSymmetrySpecs): EyewearSymmetrySpecs {
    if (specs.allowAsymmetry) {
      return specs;
    }

    const uniformTempleLength = Math.max(specs.leftTempleLength, specs.rightTempleLength);
    const uniformLensWidth = Math.max(specs.leftLensWidth, specs.rightLensWidth);

    return {
      leftTempleLength: uniformTempleLength,
      rightTempleLength: uniformTempleLength,
      leftLensWidth: uniformLensWidth,
      rightLensWidth: uniformLensWidth,
      allowAsymmetry: false,
    };
  }
}
