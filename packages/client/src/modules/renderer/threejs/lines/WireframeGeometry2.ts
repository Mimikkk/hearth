import { WireframeGeometry } from '../Three.js';
import { LineSegmentsGeometry } from './LineSegmentsGeometry.js';

export class WireframeGeometry2 extends LineSegmentsGeometry {
  declare isWireframeGeometry2: true;
  declare type: string | 'WireframeGeometry2';

  constructor(geometry: WireframeGeometry) {
    super();

    this.fromWireframeGeometry(new WireframeGeometry(geometry));
  }
}
WireframeGeometry2.prototype.isWireframeGeometry2 = true;
WireframeGeometry2.prototype.type = 'WireframeGeometry2';
