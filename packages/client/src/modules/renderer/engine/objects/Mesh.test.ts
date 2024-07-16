import { describe, expect, it } from 'vitest';
import { Raycaster } from '@modules/renderer/engine/core/Raycaster.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { BoxGeometry } from '@modules/renderer/engine/geometries/BoxGeometry.js';
import { MeshStandardMaterial } from '@modules/renderer/engine/materials/MeshStandardMaterial.js';
import { IVec2 } from '@modules/renderer/engine/math/Vector2.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';

describe('Objects - Mesh', () => {
  it('should intersect with ray', () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    const raycaster = new Raycaster();
    const camera = new PerspectiveCamera(70, 1, 0.1, 500);
    camera.position.z = 3;

    // center has two triangles
    raycaster.setFromCamera(IVec2.create(0, 0), camera);
    expect(raycaster.intersects([mesh], true).length).toEqual(2);

    raycaster.setFromCamera(IVec2.create(0, 0.2), camera);
    expect(raycaster.intersects([mesh], true).length).toEqual(1);

    raycaster.setFromCamera(IVec2.create(0, -0.2), camera);
    expect(raycaster.intersects([mesh], true).length).toEqual(1);

    raycaster.setFromCamera(IVec2.create(1, 1), camera);
    expect(raycaster.intersects([mesh], true).length).toEqual(0);
  });
});
