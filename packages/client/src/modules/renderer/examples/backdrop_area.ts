import {
  checker,
  color,
  linearDepth,
  MeshBasicNodeMaterial,
  modelScale,
  toneMapping,
  uv,
  viewportLinearDepth,
  viewportMipTexture,
  viewportSharedTexture,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/nodes.js';
import {
  AnimationMixer,
  BoxGeometry,
  Color,
  GLTFLoader,
  Hearth,
  Mesh,
  MeshBasicMaterial,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  Side,
  ToneMapping,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { MiniUi } from '@mimi/mini-ui';

const createMaterials = () => {
  const depthDistance = viewportLinearDepth; //.distance(linearDepth());
  const depthAlpha = depthDistance; //.oneMinus(); //.smoothstep(0.9, 2).mul(20).saturate();

  const createMaterialBlur = () => {
    const blur = viewportMipTexture()
      .bicubic(
        depthDistance
          .smoothstep(0, 0.6)
          .mul(40 * 5)
          .clamp(0, 5),
      )
      .add(depthAlpha.mix(color(0x0066ff), 0));

    return new MeshBasicNodeMaterial({
      backdropNode: blur,
      transparent: true,
      side: Side.Double,
    });
  };
  const createMaterialVolume = () => {
    return new MeshBasicNodeMaterial({
      colorNode: color(0x0066ff),
      backdropNode: viewportSharedTexture(),
      backdropAlphaNode: depthAlpha,
      transparent: true,
      side: Side.Double,
    });
  };
  const createMaterialDepth = () => {
    return new MeshBasicNodeMaterial({
      backdropNode: depthAlpha,
      transparent: true,
      side: Side.Double,
    });
  };
  const createMaterialBicubic = () => {
    return new MeshBasicNodeMaterial({
      backdropNode: viewportMipTexture().bicubic(5),
      backdropAlphaNode: checker(uv().mul(3).mul(modelScale.xy)),
      opacityNode: depthAlpha,
      transparent: true,
      side: Side.Double,
    });
  };
  const createMaterialPixel = () => {
    return new MeshBasicNodeMaterial({
      backdropNode: viewportSharedTexture(viewportTopLeft.mul(100).floor().div(100)),
      transparent: true,
    });
  };

  return {
    blur: createMaterialBlur(),
    volume: createMaterialVolume(),
    depth: createMaterialDepth(),
    bicubic: createMaterialBicubic(),
    pixel: createMaterialPixel(),
  };
};

const createScene = () => {
  const scene = new Scene();
  scene.background = Color.new(0x333333);
  camera.lookAt(0, 1, 0);
  return scene;
};
const loadMichelle = async () => {
  const gltf = await GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');
  const michelle = gltf.scene;
  const mixer = new AnimationMixer(michelle);

  const action = mixer.clipAction(gltf.animations[0]);
  action.play();

  return { michelle, mixer };
};
const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(3, 2, 3);
  return camera;
};
const createBox = (material: MeshBasicMaterial) => {
  const box = new Mesh(new BoxGeometry(2, 2, 2), material);
  box.position.set(0, 1, 0);
  return box;
};
const createFloor = () => {
  const floor = new Mesh(new BoxGeometry(1.99, 0.01, 1.99), new MeshBasicNodeMaterial({ color: 0x333333 }));
  floor.position.set(0, 0, 0);
  return floor;
};

const camera = createCamera();

const { michelle, mixer } = await loadMichelle();

const materials = createMaterials();

const box = createBox(materials.depth);
const floor = createFloor();

const scene = createScene().add(michelle, box, floor);
const hearth = await Hearth.as({
  animate() {
    hearth.render(scene, camera);
  },
  toneMappingNode: toneMapping(ToneMapping.Linear, 0.15),
});

OrbitControls.attach(hearth, camera, { target: Vec3.new(0, 1, 0) });
mixer.attach(hearth);
useWindowResizer(hearth, camera);

MiniUi.create('Controls', { box, material: 'pixel' as keyof typeof materials })
  .number('box.scale.x', 'Box scale x', 0.1, 2, 0.01)
  .number('box.scale.z', 'Box scale z', 0.1, 2, 0.01)
  .option(
    'material',
    'Material',
    {
      blur: 'Blur',
      volume: 'Volume',
      depth: 'Depth',
      bicubic: 'Bicubic',
      pixel: 'Pixel',
    },
    name => {
      box.material = materials[name];
    },
  );
