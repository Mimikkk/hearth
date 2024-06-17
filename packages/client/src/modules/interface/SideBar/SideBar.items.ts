import { AccordionItem } from '@components/control/Accordion/Accordion.js';
import { Example } from '@modules/renderer/examples/examples.js';

export const SideBarItems: AccordionItem[] = [
  {
    id: 'compute',
    title: 'Compute',
    icon: 'BsHddRack',
    children: [
      {
        id: Example.Compute.Audio,
        title: 'Compute Audio',
      },
      {
        id: Example.Compute.Particles.Particle,
        title: 'Compute Particles',
      },
      {
        id: Example.Compute.Particles.Rain,
        title: 'Compute Particles Rain',
      },
      {
        id: Example.Compute.Particles.Snow,
        title: 'Compute Particles Snow',
      },
      {
        id: Example.Compute.Points,
        title: 'Compute Points',
      },
      {
        id: Example.Compute.Textures.Texture,
        title: 'Compute Texture',
      },
      {
        id: Example.Compute.Textures.PingPong,
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
      { id: Example.MaterialsTextureAnisotropy, title: 'Materials Texture Anisotropy' },
      { id: Example.MaterialsTexturePartialUpdate, title: 'Materials Texture Partial Update' },
      { id: Example.MaterialsVideo, title: 'Materials Video' },
      {
        id: Example.LinesFat,

        title: 'Lines Fat',
      },
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
      { id: Example.MorphTargetsFace, title: 'Morph Targets Face', maintenance: true },
      { id: Example.Sprites, title: 'Sprites', maintenance: true },
    ],
  },
  {
    id: 'postprocessing_effects',
    title: 'Postprocessing & Effects',
    icon: 'CgEye',
    children: [
      { id: Example.PostprocessingAfterimage, title: 'Postprocessing Afterimage' },
      { id: Example.PostprocessingAnamorphic, title: 'Postprocessing Anamorphic' },
      { id: Example.ShaderToy, title: 'Shader Toy', maintenance: true },
    ],
  },
  {
    id: 'loading_data_management',
    title: 'Loading & Data Management',
    icon: 'TiDownload',
    children: [
      { id: Example.Loaders.Obj, title: 'Loader Obj' },
      { id: Example.Loaders.ObjMtl, title: 'Loader Obj+Mtl' },
      { id: Example.Loaders.Tiff, title: 'Loader Tiff' },
      { id: Example.Loaders.Ttf, title: 'Loader Ttf' },
      { id: Example.Loaders.Stl, title: 'Loader Stl' },
      { id: Example.Loaders.Gltfs.Gltf, title: 'Loader Gltf' },
      { id: Example.Loaders.Gltfs.Ktx2, title: 'Loader Gltf + KTX2', maintenance: true },
      { id: Example.Loaders.Gltfs.Iridescence, title: 'Loader Gltf Iridescence' },
      { id: Example.Loaders.Gltfs.Sheen, title: 'Loader Gltf Sheen' },
      { id: Example.StorageBuffer, title: 'Storage Buffer' },
    ],
  },
  {
    id: 'cameras_rendering',
    title: 'Cameras & Rendering',
    icon: 'BsCamera',
    children: [
      { id: Example.CameraLogarithmicDepthBuffer, title: 'Camera Logarithmic Depth Buffer' },
      { id: Example.DepthTexture, title: 'Depth Texture', maintenance: true },
      { id: Example.Equirectangular, title: 'Equirectangular' },
      { id: Example.MultipleRenderTargets, title: 'Multiple Render Targets', maintenance: true },
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
      { id: Example.CubemapDynamic, title: 'Cubemap Dynamic', maintenance: true },
      { id: Example.CubemapMix, title: 'Cubemap Mix' },
      { id: Example.Occlusion, title: 'Occlusion' },
      { id: Example.ParallaxUv, title: 'Parallax Uv', maintenance: true },
      { id: Example.Particles, title: 'Particles' },
      { id: Example.PmRemCubemap, title: 'Pm Rem Cubemap' },
      { id: Example.PmRemEquirectangular, title: 'Pm Rem Equirectangular' },
      { id: Example.PmRemScene, title: 'Pm Rem Scene' },
      { id: Example.Portal, title: 'Portal', maintenance: true },
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
