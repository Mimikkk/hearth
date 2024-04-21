import { Group, Raycaster, Vector2 } from '../Three.js';

const _pointer = new Vector2();
const _event = { type: '', data: _pointer };

class InteractiveGroup extends Group {
  listenToPointerEvents(renderer, camera) {
    const scope = this;
    const raycaster = new Raycaster();

    const element = renderer.domElement;

    function onPointerEvent(event) {
      event.stopPropagation();

      const rect = renderer.domElement.getBoundingClientRect();

      _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointer, camera);

      const intersects = raycaster.intersectObjects(scope.children, false);

      if (intersects.length > 0) {
        const intersection = intersects[0];

        const object = intersection.object;
        const uv = intersection.uv;

        _event.type = event.type;
        _event.data.set(uv.x, 1 - uv.y);

        object.dispatch(_event, this);
      }
    }

    element.addEventListener('pointerdown', onPointerEvent);
    element.addEventListener('pointerup', onPointerEvent);
    element.addEventListener('pointermove', onPointerEvent);
    element.addEventListener('mousedown', onPointerEvent);
    element.addEventListener('mouseup', onPointerEvent);
    element.addEventListener('mousemove', onPointerEvent);
    element.addEventListener('click', onPointerEvent);
  }
}

export { InteractiveGroup };
