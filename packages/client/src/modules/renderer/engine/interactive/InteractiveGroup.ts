import { Group } from '../objects/Group.js';
import { Vec2 } from '../math/Vec2.js';
import { Raycaster } from '../core/Raycaster.js';
import { Camera } from '../cameras/Camera.js';
import { Renderer } from '../renderers/webgpu/Renderer.js';

type InteractionType = 'pointerdown' | 'pointerup' | 'pointermove' | 'mousedown' | 'mouseup' | 'mousemove' | 'click';

interface InteractionEvent {
  type: InteractionType;
  data: Vec2;
}
const createInteractionEvent = (type: InteractionType, data: Vec2): InteractionEvent => ({ type, data });

export class InteractiveGroup extends Group {
  listenToPointerEvents(renderer: Renderer, camera: Camera) {
    const scope = this;
    const raycaster = new Raycaster();

    const element = renderer.parameters.canvas;

    const onPointerEvent = (event: PointerEvent) => {
      event.stopPropagation();

      const { width, height, left, top } = renderer.parameters.canvas.getBoundingClientRect();
      const pointer = Vec2.new(((event.clientX - left) / width) * 2 - 1, (-(event.clientY - top) / height) * 2 + 1);
      raycaster.fromCamera(pointer, camera);

      const intersection = raycaster.intersects(scope.children, false)[0];
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
