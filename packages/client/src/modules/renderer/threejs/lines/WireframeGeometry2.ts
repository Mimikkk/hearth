import { WireframeGeometry } from '../Three.js';
import { LineSegmentsGeometry } from './LineSegmentsGeometry.js';

export class WireframeGeometry2 extends LineSegmentsGeometry {
  constructor(geometry: WireframeGeometry) {
    super();

    this.fromWireframeGeometry(new WireframeGeometry(geometry));
  }
}
