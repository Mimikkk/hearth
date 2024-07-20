export function cloneUniforms(src: object) {
  const dst = {};

  for (const u in src) {
    dst[u] = {};

    for (const p in src[u]) {
      const property = src[u][p];

      if (
        property &&
        (property.isColor ||
          property.isMatrix3 ||
          property.isMatrix4 ||
          property.isVector2 ||
          property.isVector3 ||
          property.isVector4 ||
          property.isTexture ||
          property.isQuaternion)
      ) {
        if (property.isRenderTargetTexture) {
          console.warn(
            'UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().',
          );
          dst[u][p] = null;
        } else {
          dst[u][p] = property.clone();
        }
      } else if (Array.isArray(property)) {
        dst[u][p] = property.slice();
      } else {
        dst[u][p] = property;
      }
    }
  }

  return dst;
}
