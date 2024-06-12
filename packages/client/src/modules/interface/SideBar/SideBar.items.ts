import { AccordionItem } from '@components/control/Accordion/Accordion.js';
import { Example } from '@modules/renderer/examples/examples.js';

export const SideBarItems: AccordionItem[] = [
  {
    id: 'compute',
    title: 'Compute',
    icon: 'BsHddRack',
    children: [
      {
        id: Example.ComputeAudio,
        title: 'Compute Audio',
      },
      {
        id: Example.ComputeParticles,
        title: 'Compute Particles',
      },
      {
        id: Example.ComputeParticlesRain,
        title: 'Compute Particles Rain',
      },
      {
        id: Example.ComputeParticlesSnow,
        title: 'Compute Particles Snow',
      },
      {
        id: Example.ComputePoints,
        title: 'Compute Points',
      },
      {
        id: Example.ComputeTexture,
        title: 'Compute Texture',
      },
      {
        id: Example.ComputeTexturePingPong,
        title: 'Compute Texture Ping Pong',
      },
    ],
  },
  {
    id: 'environment',
    title: 'Environment',
    icon: 'IoEarth',
    children: [
      { id: Example.Backdrop, title: 'Backdrop' },
      { id: Example.BackdropArea, title: 'Backdrop Area' },
      { id: Example.BackdropWater, title: 'Backdrop Water' },
      { id: Example.CustomFog, title: 'Custom Fog' },
      { id: Example.CustomFogBackground, title: 'Custom Fog Background' },
      { id: Example.Reflection, title: 'Reflection' },
    ],
  },
  {
    id: 'materials_textures',
    title: 'Materials & Textures',
    icon: 'SiLbry',
    children: [
      { id: Example.Clearcoat, title: 'Clearcoat' },
      { id: Example.Materials, title: 'Materials' },
      { id: Example.MaterialsSss, title: 'Materials Sss' },
      { id: Example.MaterialsTextureAnisotropy, title: 'Materials Texture Anisotropy' },
      { id: Example.MaterialsTexturePartialUpdate, title: 'Materials Texture Partial Update' },
      { id: Example.MaterialsVideo, title: 'Materials Video' },
      {
        id: Example.LinesFat,

        title: 'Lines Fat',
      },
      { id: Example.MaterialXNoise, title: 'Material X Noise' },
    ],
  },
  {
    id: 'lighting',
    title: 'Lighting',
    icon: 'BsLightbulb',
    children: [
      { id: Example.LightsCustom, title: 'Lights Custom' },
      { id: Example.LightsIesSpotlight, title: 'Lights Ies Spotlight' },
      { id: Example.LightsPhong, title: 'Lights Phong' },
      { id: Example.LightsSelective, title: 'Lights Selective' },
    ],
  },
  {
    id: 'geometry_meshes',
    title: 'Geometry & Meshes',
    icon: 'SiMetro',
    children: [
      { id: Example.InstanceMesh, title: 'Instance Mesh' },
      { id: Example.InstancePoints, title: 'Instance Points' },
      { id: Example.InstanceUniform, title: 'Instance Uniform' },
      { id: Example.Mirror, title: 'Mirror' },
      { id: Example.MorphTargets, title: 'Morph Targets' },
      { id: Example.MorphTargetsFace, title: 'Morph Targets Face' },
      { id: Example.Sprites, title: 'Sprites' },
    ],
  },
  {
    id: 'postprocessing_effects',
    title: 'Postprocessing & Effects',
    icon: 'CgEye',
    children: [
      { id: Example.PostprocessingAfterimage, title: 'Postprocessing Afterimage' },
      { id: Example.PostprocessingAnamorphic, title: 'Postprocessing Anamorphic' },
      { id: Example.ShaderToy, title: 'Shader Toy' },
    ],
  },
  {
    id: 'loading_data_management',
    title: 'Loading & Data Management',
    icon: 'TiDownload',
    children: [
      { id: Example.LoaderObj, title: 'Loader Obj' },
      { id: Example.LoaderObjMtl, title: 'Loader Obj+Mtl' },
      { id: Example.LoaderTtf, title: 'Loader Ttf' },
      { id: Example.LoaderGltf, title: 'Loader Gltf' },
      { id: Example.LoaderGltfCompressed, title: 'Loader Gltf Compressed' },
      { id: Example.LoaderGltfIridescence, title: 'Loader Gltf Iridescence' },
      { id: Example.LoaderGltfSheen, title: 'Loader Gltf Sheen' },
      { id: Example.LoaderMaterialX, title: 'Loader Material X' },
      { id: Example.StorageBuffer, title: 'Storage Buffer' },
    ],
  },
  {
    id: 'cameras_rendering',
    title: 'Cameras & Rendering',
    icon: 'BsCamera',
    children: [
      { id: Example.CameraLogarithmicDepthBuffer, title: 'Camera Logarithmic Depth Buffer' },
      { id: Example.DepthTexture, title: 'Depth Texture' },
      { id: Example.Equirectangular, title: 'Equirectangular' },
      { id: Example.MultipleRenderTargets, title: 'Multiple Render Targets' },
      { id: Example.MultiSampledRenderBuffers, title: 'Multi Sampled Render Buffers' },
      { id: Example.Rtt, title: 'Rtt' },
    ],
  },
  {
    id: 'special_techniques',
    title: 'Special Techniques',
    icon: 'SiChainguard',
    children: [
      { id: Example.Clipping, title: 'Clipping' },
      { id: Example.CubemapAdjustments, title: 'Cubemap Adjustments' },
      { id: Example.CubemapDynamic, title: 'Cubemap Dynamic' },
      { id: Example.CubemapMix, title: 'Cubemap Mix' },
      { id: Example.Occlusion, title: 'Occlusion' },
      { id: Example.ParallaxUv, title: 'Parallax Uv' },
      { id: Example.Particles, title: 'Particles' },
      { id: Example.PmRemCubemap, title: 'Pm Rem Cubemap' },
      { id: Example.PmRemEquirectangular, title: 'Pm Rem Equirectangular' },
      { id: Example.PmRemScene, title: 'Pm Rem Scene' },
      { id: Example.Portal, title: 'Portal' },
      { id: Example.Sandbox, title: 'Sandbox' },
      { id: Example.ShadowMap, title: 'Shadow Map' },
      { id: Example.Skinning, title: 'Skinning' },
      { id: Example.SkinningInstancing, title: 'Skinning Instancing' },
      { id: Example.SkinningPoints, title: 'Skinning Points' },
      { id: Example.Textures2dArray, title: 'Textures 2d Array' },
      { id: Example.TslEditor, title: 'Tsl Editor' },
      { id: Example.TslTranspiler, title: 'Tsl Transpiler' },
      { id: Example.VideoPanorama, title: 'Video Panorama' },
    ],
  },
];
