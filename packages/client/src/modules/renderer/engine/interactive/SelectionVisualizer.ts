import type { Renderer } from '../renderers/webgpu/Renderer.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Box2 } from '@modules/renderer/engine/math/Box2.js';

export class SelectionVisualizer {
  element: HTMLDivElement;
  renderer: Renderer;
  start: Vec2;
  box: Box2;
  topLeft: Vec2;
  bottomRight: Vec2;
  isDown: boolean;
  enabled: boolean;
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;

  constructor(renderer: Renderer) {
    this.element = document.createElement('div');
    this.element.style.border = '1px solid #55aaff';
    this.element.style.borderRadius = '0.125rem';
    this.element.style.backgroundColor = 'rgba(75, 160, 255, 0.3)';
    this.element.style.position = 'fixed';
    this.element.style.pointerEvents = 'none';

    this.renderer = renderer;
    this.start = Vec2.new();

    this.box = Box2.new();
    this.topLeft = Vec2.new();
    this.bottomRight = Vec2.new();

    this.isDown = false;
    this.enabled = true;

    this.onPointerDown = (event: PointerEvent) => {
      if (!this.enabled) return;

      this.isDown = true;
      this.onSelectStart(event);
    };
    this.onPointerMove = (event: PointerEvent) => {
      if (!this.enabled) return;
      if (!this.isDown) return;
      this.onSelectMove(event);
    };
    this.onPointerUp = (event: PointerEvent) => {
      if (!this.enabled) return;

      this.isDown = false;
      this.onSelectOver(event);
    };

    this.renderer.parameters.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.parameters.canvas.addEventListener('pointermove', this.onPointerMove);
    this.renderer.parameters.canvas.addEventListener('pointerup', this.onPointerUp);
  }

  dispose() {
    this.renderer.parameters.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.parameters.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.parameters.canvas.removeEventListener('pointerup', this.onPointerUp);
  }

  onSelectStart(event: PointerEvent) {
    this.element.style.display = 'none';
    this.renderer.parameters.canvas.parentElement?.appendChild(this.element);

    this.element.style.left = event.clientX + 'px';
    this.element.style.top = event.clientY + 'px';
    this.element.style.width = '0px';
    this.element.style.height = '0px';

    this.start.x = event.clientX;
    this.start.y = event.clientY;
  }

  onSelectMove(event: PointerEvent) {
    this.element.style.display = 'block';

    this.bottomRight.x = Math.max(this.start.x, event.clientX);
    this.bottomRight.y = Math.max(this.start.y, event.clientY);
    this.topLeft.x = Math.min(this.start.x, event.clientX);
    this.topLeft.y = Math.min(this.start.y, event.clientY);

    this.element.style.left = this.topLeft.x + 'px';
    this.element.style.top = this.topLeft.y + 'px';
    this.element.style.width = this.bottomRight.x - this.topLeft.x + 'px';
    this.element.style.height = this.bottomRight.y - this.topLeft.y + 'px';
  }

  onSelectOver(event: PointerEvent) {
    this.element.parentElement?.removeChild(this.element);
  }
}
