import { NodeMaterial } from './NodeMaterial.js';
import { InstancedPointsNodeMaterial } from './InstancedPointsNodeMaterial.js';
import { LineBasicNodeMaterial } from './LineBasicNodeMaterial.js';
import { LineDashedNodeMaterial } from './LineDashedNodeMaterial.js';
import { Line2NodeMaterial } from './Line2NodeMaterial.js';
import { MeshNormalNodeMaterial } from './MeshNormalNodeMaterial.js';
import { MeshBasicNodeMaterial } from './MeshBasicNodeMaterial.js';
import { MeshLambertNodeMaterial } from './MeshLambertNodeMaterial.js';
import { MeshPhongNodeMaterial } from './MeshPhongNodeMaterial.js';
import { MeshStandardNodeMaterial } from './MeshStandardNodeMaterial.js';
import { MeshPhysicalNodeMaterial } from './MeshPhysicalNodeMaterial.js';
import { MeshSSSNodeMaterial } from './MeshSSSNodeMaterial.js';
import { PointsNodeMaterial } from './PointsNodeMaterial.js';
import { MeshMatcapNodeMaterial } from './MeshMatcapNodeMaterial.js';
import { MeshToonNodeMaterial } from './MeshToonNodeMaterial.js';
import { ShadowNodeMaterial } from './ShadowNodeMaterial.js';
import { SpriteNodeMaterial } from './SpriteNodeMaterial.ts';

export const NodeMaterialMap = {
  InstancedPointsNodeMaterial,
  MeshStandardNodeMaterial,
  MeshPhysicalNodeMaterial,
  MeshLambertNodeMaterial,
  LineDashedNodeMaterial,
  MeshNormalNodeMaterial,
  MeshMatcapNodeMaterial,
  MeshBasicNodeMaterial,
  MeshPhongNodeMaterial,
  LineBasicNodeMaterial,
  MeshToonNodeMaterial,
  MeshSSSNodeMaterial,
  PointsNodeMaterial,
  ShadowNodeMaterial,
  SpriteNodeMaterial,
  Line2NodeMaterial,
  NodeMaterial,
} as const;
