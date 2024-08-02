import { f32, i32, NodeStack, tsl, vec2, vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { abs, all, clamp, cos, cross, exp2, floor, fract, log2, max, mix, normalize, sin } from '../math/MathNode.js';
import { mul } from '../math/OperatorNode.js';
import { cond } from '../math/CondNode.js';
import { Break, loop } from '../utils/LoopNode.js';

const cubeUV_r0 = f32(1.0);
const cubeUV_m0 = f32(-2.0);
const cubeUV_r1 = f32(0.8);
const cubeUV_m1 = f32(-1.0);
const cubeUV_r4 = f32(0.4);
const cubeUV_m4 = f32(2.0);
const cubeUV_r5 = f32(0.305);
const cubeUV_m5 = f32(3.0);
const cubeUV_r6 = f32(0.21);
const cubeUV_m6 = f32(4.0);

const cubeUV_minMipLevel = f32(4.0);
const cubeUV_minTileSize = f32(16.0);

const getFace = tsl(([direction]) => {
  const absDirection = vec3(abs(direction)).toVar();
  const face = f32(-1.0).toVar();

  NodeStack.if(absDirection.x.greaterThan(absDirection.z), () => {
    NodeStack.if(absDirection.x.greaterThan(absDirection.y), () => {
      face.assign(cond(direction.x.greaterThan(0.0), 0.0, 3.0));
    }).else(() => {
      face.assign(cond(direction.y.greaterThan(0.0), 1.0, 4.0));
    });
  }).else(() => {
    NodeStack.if(absDirection.z.greaterThan(absDirection.y), () => {
      face.assign(cond(direction.z.greaterThan(0.0), 2.0, 5.0));
    }).else(() => {
      face.assign(cond(direction.y.greaterThan(0.0), 1.0, 4.0));
    });
  });

  return face;
}).setLayout({
  name: 'getFace',
  type: 'f32',
  inputs: [{ name: 'direction', type: 'vec3' }],
});

const getUV = tsl(([direction, face]) => {
  const uv = vec2().toVar();

  NodeStack.if(face.equal(0.0), () => {
    uv.assign(vec2(direction.z, direction.y).div(abs(direction.x)));
  })
    .elseif(face.equal(1.0), () => {
      uv.assign(vec2(direction.x.negate(), direction.z.negate()).div(abs(direction.y)));
    })
    .elseif(face.equal(2.0), () => {
      uv.assign(vec2(direction.x.negate(), direction.y).div(abs(direction.z)));
    })
    .elseif(face.equal(3.0), () => {
      uv.assign(vec2(direction.z.negate(), direction.y).div(abs(direction.x)));
    })
    .elseif(face.equal(4.0), () => {
      uv.assign(vec2(direction.x.negate(), direction.z).div(abs(direction.y)));
    })
    .else(() => {
      uv.assign(vec2(direction.x, direction.y).div(abs(direction.z)));
    });

  return mul(0.5, uv.add(1.0));
}).setLayout({
  name: 'getUV',
  type: 'vec2',
  inputs: [
    { name: 'direction', type: 'vec3' },
    { name: 'face', type: 'f32' },
  ],
});

const roughnessToMip = tsl(([roughness]) => {
  const mip = f32(0.0).toVar();

  NodeStack.if(roughness.greaterThanEqual(cubeUV_r1), () => {
    mip.assign(cubeUV_r0.sub(roughness).mul(cubeUV_m1.sub(cubeUV_m0)).div(cubeUV_r0.sub(cubeUV_r1)).add(cubeUV_m0));
  })
    .elseif(roughness.greaterThanEqual(cubeUV_r4), () => {
      mip.assign(cubeUV_r1.sub(roughness).mul(cubeUV_m4.sub(cubeUV_m1)).div(cubeUV_r1.sub(cubeUV_r4)).add(cubeUV_m1));
    })
    .elseif(roughness.greaterThanEqual(cubeUV_r5), () => {
      mip.assign(cubeUV_r4.sub(roughness).mul(cubeUV_m5.sub(cubeUV_m4)).div(cubeUV_r4.sub(cubeUV_r5)).add(cubeUV_m4));
    })
    .elseif(roughness.greaterThanEqual(cubeUV_r6), () => {
      mip.assign(cubeUV_r5.sub(roughness).mul(cubeUV_m6.sub(cubeUV_m5)).div(cubeUV_r5.sub(cubeUV_r6)).add(cubeUV_m5));
    })
    .else(() => {
      mip.assign(f32(-2.0).mul(log2(mul(1.16, roughness))));
    });

  return mip;
}).setLayout({
  name: 'roughnessToMip',
  type: 'f32',
  inputs: [{ name: 'roughness', type: 'f32' }],
});

export const getDirection = tsl(([uv_immutable, face]) => {
  const uv = uv_immutable.toVar();
  uv.assign(mul(2.0, uv).sub(1.0));
  const direction = vec3(uv, 1.0).toVar();

  NodeStack.if(face.equal(0.0), () => {
    direction.assign(direction.zyx);
  })
    .elseif(face.equal(1.0), () => {
      direction.assign(direction.xzy);
      direction.xz.mulAssign(-1.0);
    })
    .elseif(face.equal(2.0), () => {
      direction.x.mulAssign(-1.0);
    })
    .elseif(face.equal(3.0), () => {
      direction.assign(direction.zyx);
      direction.xz.mulAssign(-1.0);
    })
    .elseif(face.equal(4.0), () => {
      direction.assign(direction.xzy);
      direction.xy.mulAssign(-1.0);
    })
    .elseif(face.equal(5.0), () => {
      direction.z.mulAssign(-1.0);
    });

  return direction;
}).setLayout({
  name: 'getDirection',
  type: 'vec3',
  inputs: [
    { name: 'uv', type: 'vec2' },
    { name: 'face', type: 'f32' },
  ],
});

export const textureCubeUV = tsl(
  ([envMap, sampleDir_immutable, roughness_immutable, CUBEUV_TEXEL_WIDTH, CUBEUV_TEXEL_HEIGHT, CUBEUV_MAX_MIP]) => {
    const roughness = f32(roughness_immutable);
    const sampleDir = vec3(sampleDir_immutable);

    const mip = clamp(roughnessToMip(roughness), cubeUV_m0, CUBEUV_MAX_MIP);
    const mipF = fract(mip);
    const mipInt = floor(mip);
    const color0 = vec3(
      bilinearCubeUV(envMap, sampleDir, mipInt, CUBEUV_TEXEL_WIDTH, CUBEUV_TEXEL_HEIGHT, CUBEUV_MAX_MIP),
    ).toVar();

    NodeStack.if(mipF.notEqual(0.0), () => {
      const color1 = vec3(
        bilinearCubeUV(envMap, sampleDir, mipInt.add(1.0), CUBEUV_TEXEL_WIDTH, CUBEUV_TEXEL_HEIGHT, CUBEUV_MAX_MIP),
      ).toVar();

      color0.assign(mix(color0, color1, mipF));
    });

    return color0;
  },
);

const bilinearCubeUV = tsl(
  ([envMap, direction_immutable, mipInt_immutable, CUBEUV_TEXEL_WIDTH, CUBEUV_TEXEL_HEIGHT, CUBEUV_MAX_MIP]) => {
    const mipInt = f32(mipInt_immutable).toVar();
    const direction = vec3(direction_immutable);
    const face = f32(getFace(direction)).toVar();
    const filterInt = f32(max(cubeUV_minMipLevel.sub(mipInt), 0.0)).toVar();
    mipInt.assign(max(mipInt, cubeUV_minMipLevel));
    const faceSize = f32(exp2(mipInt)).toVar();
    const uv = vec2(getUV(direction, face).mul(faceSize.sub(2.0)).add(1.0)).toVar();

    NodeStack.if(face.greaterThan(2.0), () => {
      uv.y.addAssign(faceSize);
      face.subAssign(3.0);
    });

    uv.x.addAssign(face.mul(faceSize));
    uv.x.addAssign(filterInt.mul(mul(3.0, cubeUV_minTileSize)));
    uv.y.addAssign(mul(4.0, exp2(CUBEUV_MAX_MIP).sub(faceSize)));
    uv.x.mulAssign(CUBEUV_TEXEL_WIDTH);
    uv.y.mulAssign(CUBEUV_TEXEL_HEIGHT);

    return envMap.uv(uv);
  },
);

const getSample = tsl(
  ({ envMap, mipInt, outputDirection, theta, axis, CUBEUV_TEXEL_WIDTH, CUBEUV_TEXEL_HEIGHT, CUBEUV_MAX_MIP }) => {
    const cosTheta = cos(theta);

    const sampleDirection = outputDirection
      .mul(cosTheta)
      .add(axis.cross(outputDirection).mul(sin(theta)))
      .add(axis.mul(axis.dot(outputDirection).mul(cosTheta.oneMinus())));

    return bilinearCubeUV(envMap, sampleDirection, mipInt, CUBEUV_TEXEL_WIDTH, CUBEUV_TEXEL_HEIGHT, CUBEUV_MAX_MIP);
  },
);

export const blur = tsl(
  ({
    n,
    latitudinal,
    poleAxis,
    outputDirection,
    weights,
    samples,
    dTheta,
    mipInt,
    envMap,
    CUBEUV_TEXEL_WIDTH,
    CUBEUV_TEXEL_HEIGHT,
    CUBEUV_MAX_MIP,
  }) => {
    const axis = vec3(cond(latitudinal, poleAxis, cross(poleAxis, outputDirection))).toVar();

    NodeStack.if(all(axis.equals(vec3(0.0))), () => {
      axis.assign(vec3(outputDirection.z, 0.0, outputDirection.x.negate()));
    });

    axis.assign(normalize(axis));

    const gl_FragColor = vec3().toVar();
    gl_FragColor.addAssign(
      weights.element(i32(0)).mul(
        getSample({
          theta: 0.0,
          axis,
          outputDirection,
          mipInt,
          envMap,
          CUBEUV_TEXEL_WIDTH,
          CUBEUV_TEXEL_HEIGHT,
          CUBEUV_MAX_MIP,
        }),
      ),
    );

    loop({ start: i32(1), end: n }, ({ i }) => {
      NodeStack.if(i.greaterThanEqual(samples), () => {
        Break();
      });

      const theta = f32(dTheta.mul(f32(i))).toVar();
      gl_FragColor.addAssign(
        weights.element(i).mul(
          getSample({
            theta: theta.mul(-1.0),
            axis,
            outputDirection,
            mipInt,
            envMap,
            CUBEUV_TEXEL_WIDTH,
            CUBEUV_TEXEL_HEIGHT,
            CUBEUV_MAX_MIP,
          }),
        ),
      );
      gl_FragColor.addAssign(
        weights.element(i).mul(
          getSample({
            theta,
            axis,
            outputDirection,
            mipInt,
            envMap,
            CUBEUV_TEXEL_WIDTH,
            CUBEUV_TEXEL_HEIGHT,
            CUBEUV_MAX_MIP,
          }),
        ),
      );
    });

    return vec4(gl_FragColor, 1);
  },
);
