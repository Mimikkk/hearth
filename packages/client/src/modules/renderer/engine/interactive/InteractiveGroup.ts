import { Group } from '../objects/Group.js';
import { Vector2 } from '../math/Vector2.js';
import { Raycaster } from '../core/Raycaster.js';
import { Camera } from '../cameras/Camera.js';
import { Renderer } from '../renderers/webgpu/Renderer.js';

type InteractionType = 'pointerdown' | 'pointerup' | 'pointermove' | 'mousedown' | 'mouseup' | 'mousemove' | 'click';

interface InteractionEvent {
  type: InteractionType;
  data: Vector2;
}
const createInteractionEvent = (type: InteractionType, data: Vector2): InteractionEvent => ({ type, data });

export class InteractiveGroup extends Group {
  listenToPointerEvents(renderer: Renderer, camera: Camera) {
    const scope = this;
    const raycaster = new Raycaster(undefined!, undefined!);

    const element = renderer.domElement;

    const onPointerEvent = (event: PointerEvent) => {
      event.stopPropagation();

      const { width, height, left, top } = renderer.domElement.getBoundingClientRect();
      const pointer = new Vector2(((event.clientX - left) / width) * 2 - 1, (-(event.clientY - top) / height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);

      const intersection = raycaster.intersectObjects(scope.children, false)[0];
      if (intersection === undefined) return;
      intersection.object.eventDispatcher.dispatch(
        createInteractionEvent(event.type as InteractionType, intersection.uv!),
        this,
      );
    };

    element.addEventListener('pointerdown', onPointerEvent);
    element.addEventListener('pointerup', onPointerEvent);
    element.addEventListener('pointermove', onPointerEvent);
    element.addEventListener('mousedown', onPointerEvent);
    element.addEventListener('mouseup', onPointerEvent);
    element.addEventListener('mousemove', onPointerEvent);
    element.addEventListener('click', onPointerEvent);
  }
}
