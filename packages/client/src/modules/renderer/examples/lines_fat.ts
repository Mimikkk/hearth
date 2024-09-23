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
} from '@mimi/hearth';
import { Line2NodeMaterial, LineBasicNodeMaterial, LineDashedNodeMaterial } from '@mimi/hearth';
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

  const mesh = new Line2(geometry, material);
  mesh.computeLineDistances();
  mesh.scale.set(1, 1, 1);
  mesh.count = positions.length / 3 - 1;

  return { mesh, material };
};
const createLine2 = () => {
  const geometry = new Geometry();
  geometry.setAttribute('position', new Attribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new Attribute(new Float32Array(colors), 3));

  const normal = new LineBasicNodeMaterial({ vertexColors: true });
  const dashed = new LineDashedNodeMaterial({ vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 });

  const mesh = new Line(geometry, normal);
  mesh.computeLineDistances();
  mesh.visible = false;

  return { mesh, normal, dashed };
};

const [positions, colors] = createBuffers();
const line1 = createLine1();
const line2 = createLine2();

const scene = Scene.of(line1.mesh, line2.mesh);
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
    size: 1,
  },
})
  .option('lineType', 'Line type', { LineGeometry: 'LineGeometry', 'line-strip': 'LineStrip' }, type => {
    line1.mesh.visible = type === 'LineGeometry';
    line2.mesh.visible = type === 'line-strip';
  })
  .boolean('useWorldUnits', '(geo) World units', value => {
    line1.material.worldUnits = value;
    line1.material.useUpdate = true;
  })
  .number('width', '(geo) Width', 1, 10, 0.1, width => {
    line1.material.linewidth = width;
  })
  .boolean('alphaToCoverage', '(geo) Alpha to coverage', value => {
    line1.material.alphaToCoverage = value;
  })
  .boolean('dash.enabled', 'Dashed', enabled => {
    line1.material.dashed = enabled;
    line2.mesh.material = enabled ? line2.dashed : line2.normal;
  })
  .number('dash.scale', 'Dash scale', 0.5, 2, 0.1, val => {
    line1.material.scale = val;
    line2.dashed.scale = val;
  })
  .number('dash.offset', 'Dash offset', 0, 5, 0.1, val => {
    line1.material.dashOffset = val;
    line2.dashed.dashOffset = val;
  })
  .number('dash.gap', 'Dash gap', 0, 5, 0.1, val => {
    line1.material.gapSize = val;
    line2.dashed.gapSize = val;
  })
  .number('dash.size', 'Dash size', 0, 2, 0.1, val => {
    line1.material.dashSize = val;
    line2.dashed.dashSize = val;
  });
