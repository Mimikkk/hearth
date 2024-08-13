import {
  Attribute,
  Color,
  ColorSpace,
  Curves,
  Geometry,
  GeometryUtils,
  Hearth,
  Line,
  Line2,
  LineGeometry,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import {
  Line2NodeMaterial,
  LineBasicNodeMaterial,
  LineDashedNodeMaterial,
} from '@modules/renderer/engine/nodes/nodes.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { MiniUi } from '@mimi/mini-ui';

const createCamera = () => {
  const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(-40, 0, 60);
  return camera;
};
const createBuffers = () => {
  const positions = [];
  const colors = [];
  const points = GeometryUtils.generateHilbert(new Vec3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);
  const spline = new Curves.CatmullRomCurve3(points);
  const divisions = Math.round(12 * points.length);
  const point = new Vec3();
  const lineColor = new Color();

  for (let i = 0, l = divisions; i < l; i++) {
    const t = i / l;

    spline.getPoint(t, point);
    positions.push(point.x, point.y, point.z);

    lineColor.setHSL(t, 1.0, 0.5, ColorSpace.SRGB);
    colors.push(lineColor.r, lineColor.g, lineColor.b);
  }

  return [positions, colors];
};
const createLine1 = () => {
  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);
  const material = new Line2NodeMaterial({
    color: 0xffffff,
    linewidth: 5,
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true,
  });

  const line = new Line2(geometry, material);
  line.computeLineDistances();
  line.scale.set(1, 1, 1);
  line.count = positions.length / 3 - 1;

  return [line, material];
};
const createLine2 = () => {
  const geometry = new Geometry();
  geometry.setAttribute('position', new Attribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new Attribute(new Float32Array(colors), 3));

  const normal = new LineBasicNodeMaterial({ vertexColors: true });
  const dashed = new LineDashedNodeMaterial({ vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 });

  const line = new Line(geometry, normal);
  line.computeLineDistances();
  line.visible = false;

  return [line, normal, dashed];
};

const [positions, colors] = createBuffers();
const [line1, matLine] = createLine1();
const [line2, matLineBasic, matLineDashed] = createLine2();

const scene = Scene.of(line1, line2);
const camera = createCamera();

const hearth = await Hearth.as({
  async animate() {
    await hearth.render(scene, camera);
  },
});
OrbitControls.attach(hearth, camera);
useWindowResizer(hearth, camera);

MiniUi.create('Controls', {
  lineType: 'LineGeometry',
  useWorldUnits: false,
  width: 5,
  alphaToCoverage: true,
  dash: {
    enabled: false,
    offset: 0,
    scale: 1,
    gap: 1,
  },
})
  .option('lineType', 'Line type', { LineGeometry: 'LineGeometry', 'line-strip': 'LineStrip' }, type => {
    line1.visible = type === 'LineGeometry';
    line2.visible = type === 'line-strip';
  })
  .boolean('useWorldUnits', 'World units', value => {
    matLine.worldUnits = value;
    matLine.useUpdate = true;
  })
  .number('width', 'Width', 1, 10, 0.1, width => {
    matLine.linewidth = width;
  })
  .boolean('alphaToCoverage', 'Alpha to coverage', value => {
    matLine.alphaToCoverage = value;
  })
  .boolean('dash.enabled', 'Dashed', enabled => {
    matLine.dashed = enabled;
    line2.material = enabled ? matLineDashed : matLineBasic;
  })
  .number('dash.scale', 'Dash scale', 0.5, 2, 0.1, val => {
    matLine.scale = val;
    matLineDashed.scale = val;
  })
  .number('dash.offset', 'Dash offset', 0, 5, 0.1, val => {
    matLine.dashOffset = val;
    matLineDashed.dashOffset = val;
  })
  .option('dash.gap', 'Dash / gap', { 0: '2 : 1', 1: '1 : 1', 2: '1 : 2' }, val => {
    switch (val) {
      case 0:
        matLine.dashSize = 2;
        matLine.gapSize = 1;
        matLineDashed.dashSize = 2;
        matLineDashed.gapSize = 1;
        break;
      case 1:
        matLine.dashSize = 1;
        matLine.gapSize = 1;
        matLineDashed.dashSize = 1;
        matLineDashed.gapSize = 1;
        break;
      case 2:
        matLine.dashSize = 1;
        matLine.gapSize = 2;
        matLineDashed.dashSize = 1;
        matLineDashed.gapSize = 2;
        break;
    }
  });
