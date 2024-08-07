import { Node } from '../core/Node.js';
import { ref } from './ReferenceNode.js';
import { materialRef } from './MaterialReferenceNode.js';
import { normalView } from './NormalNode.js';
import { f32 } from '../shadernode/ShaderNode.primitves.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

const _property = new Map();

export class MaterialNode extends Node {
  constructor(public scope: Variant) {
    super();
  }

  getCache(property: string, type: TypeName) {
    let node = _property.get(property);

    if (node === undefined) {
      node = materialRef(property, type);

      _property.set(property, node);
    }

    return node;
  }

  getF32(property: string) {
    return this.getCache(property, TypeName.f32);
  }

  getColor(property: string) {
    return this.getCache(property, TypeName.color);
  }

  getTexture(property: string) {
    return this.getCache(property, TypeName.texture);
  }

  setup(builder: NodeBuilder): Node {
    const material = builder.context.material;
    if (!material) throw new Error('MaterialNode: Material is not defined');
    const scope = this.scope;

    switch (scope) {
      case Variant.Color: {
        const color = this.getColor('color');

        if (Texture.is(material.map)) {
          return color.mul(this.getTexture('map'));
        }
        return color;
      }
      case Variant.Opacity: {
        const opacity = this.getF32('opacity');

        if (Texture.is(material.alphaMap)) {
          return opacity.mul(this.getTexture('alphaMap'));
        }
        return opacity;
      }
      case Variant.SpecularStrength: {
        if (Texture.is(material.specularMap)) {
          return this.getTexture('specularMap').r;
        }
        return f32(1);
      }
      case Variant.Roughness: {
        const roughness = this.getF32('roughness');

        if (Texture.is(material.roughnessMap)) {
          return roughness.mul(this.getTexture('roughnessMap').g);
        }
        return roughness;
      }
      case Variant.Metalness: {
        const metalness = this.getF32('metalness');

        if (Texture.is(material.metalnessMap)) {
          return metalness.mul(this.getTexture('metalnessMap').b);
        }
        return metalness;
      }
      case Variant.Emissive: {
        const emissive = this.getColor('emissive');

        if (Texture.is(material.emissiveMap)) {
          return emissive.mul(this.getTexture('emmisiveMap'));
        }
        return emissive;
      }
      case Variant.Normal: {
        if (Texture.is(material.normalMap)) {
          return this.getTexture('normalMap').normalMap(this.getCache('normalScale', TypeName.vec2));
        }
        if (Texture.is(material.bumpMap)) {
          return this.getTexture('bumpMap').r.bumpMap(this.getF32('bumpScale'));
        }
        return normalView;
      }
      case Variant.Clearcoat: {
        const clearcoat = this.getF32('clearcoat');

        if (Texture.is(material.clearcoatMap)) {
          return clearcoat.mul(this.getTexture('clearcoatMap').r);
        }
        return clearcoat;
      }
      case Variant.ClearcoatRoughness: {
        const clearcoatRoughness = this.getF32('clearcoatRoughness');

        if (Texture.is(material.clearcoatRoughnessMap)) {
          return clearcoatRoughness.mul(this.getTexture('clearcoatRoughnessMap').r);
        }
        return clearcoatRoughness;
      }
      case Variant.ClearcoatNormal: {
        if (Texture.is(material.clearcoatNormalMap)) {
          return this.getTexture('clearcoatNormalMap').normalMap(this.getCache('clearcoatNormalScale', TypeName.vec2));
        }
        return normalView;
      }
      case Variant.Sheen: {
        const sheen = this.getColor('sheenColor').mul(this.getF32('sheen'));

        if (Texture.is(material.sheenColorMap)) {
          return sheen.mul(this.getTexture('sheenColorMap').rgb);
        }
        return sheen;
      }
      case Variant.SheenRoughness: {
        const sheenRoughness = this.getF32('sheenRoughness');

        if (Texture.is(material.sheenRoughnessMap)) {
          return sheenRoughness.mul(this.getTexture('sheenRoughnessMap').a);
        }
        return sheenRoughness.clamp(0.07, 1.0);
      }
      case Variant.IridescenceThickness: {
        const iridescenceThicknessMaximum = ref('1', TypeName.f32, material.iridescenceThicknessRange);

        if (Texture.is(material.iridescenceThicknessMap)) {
          const iridescenceThicknessMinimum = ref('0', TypeName.f32, material.iridescenceThicknessRange);

          return iridescenceThicknessMaximum
            .sub(iridescenceThicknessMinimum)
            .mul(this.getTexture('iridescenceThicknessMap').g)
            .add(iridescenceThicknessMinimum);
        }
        return iridescenceThicknessMaximum;
      }
      case Variant.AlphaTest:
      case Variant.Shininess:
      case Variant.SpecularColor:
      case Variant.Reflectivity:
      case Variant.Rotation:
      case Variant.Iridescence:
      case Variant.IridescenceIOR:
      case Variant.LineScale:
      case Variant.LineDashSize:
      case Variant.LineGapSize:
      case Variant.LineWidth:
      case Variant.LineDashOffset:
      case Variant.PointWidth:
        return this.getCache(scope, this.getNodeType(builder));
      default:
        throw new Error(`Unknown material scope: ${scope}`);
    }
  }
}

enum Variant {
  AlphaTest = 'alphaTest',
  Color = 'color',
  Opacity = 'opacity',
  Shininess = 'shininess',
  SpecularColor = 'specular',
  SpecularStrength = 'specularStrength',
  Reflectivity = 'reflectivity',
  Roughness = 'roughness',
  Metalness = 'metalness',
  Normal = 'normal',
  Clearcoat = 'clearcoat',
  ClearcoatRoughness = 'clearcoatRoughness',
  ClearcoatNormal = 'clearcoatNormal',
  Emissive = 'emissive',
  Rotation = 'rotation',
  Sheen = 'sheen',
  SheenRoughness = 'sheenRoughness',
  Iridescence = 'iridescence',
  IridescenceIOR = 'iridescenceIOR',
  IridescenceThickness = 'iridescenceThickness',
  LineScale = 'scale',
  LineDashSize = 'dashSize',
  LineGapSize = 'gapSize',
  LineWidth = 'linewidth',
  LineDashOffset = 'dashOffset',
  PointWidth = 'pointWidth',
}

export const materialAlphaTest = new MaterialNode(Variant.AlphaTest);
export const materialColor = new MaterialNode(Variant.Color);
export const materialShininess = new MaterialNode(Variant.Shininess);
export const materialEmissive = new MaterialNode(Variant.Emissive);
export const materialOpacity = new MaterialNode(Variant.Opacity);
export const materialSpecularColor = new MaterialNode(Variant.SpecularColor);
export const materialSpecularStrength = new MaterialNode(Variant.SpecularStrength);
export const materialReflectivity = new MaterialNode(Variant.Reflectivity);
export const materialRoughness = new MaterialNode(Variant.Roughness);
export const materialMetalness = new MaterialNode(Variant.Metalness);
export const materialNormal = new MaterialNode(Variant.Normal);
export const materialClearcoat = new MaterialNode(Variant.Clearcoat);
export const materialClearcoatRoughness = new MaterialNode(Variant.ClearcoatRoughness);
export const materialClearcoatNormal = new MaterialNode(Variant.ClearcoatNormal);
export const materialRotation = new MaterialNode(Variant.Rotation);
export const materialSheen = new MaterialNode(Variant.Sheen);
export const materialSheenRoughness = new MaterialNode(Variant.SheenRoughness);
export const materialIridescence = new MaterialNode(Variant.Iridescence);
export const materialIridescenceIOR = new MaterialNode(Variant.IridescenceIOR);
export const materialIridescenceThickness = new MaterialNode(Variant.IridescenceThickness);
export const materialLineScale = new MaterialNode(Variant.LineScale);
export const materialLineDashSize = new MaterialNode(Variant.LineDashSize);
export const materialLineGapSize = new MaterialNode(Variant.LineGapSize);
export const materialLineWidth = new MaterialNode(Variant.LineWidth);
export const materialLineDashOffset = new MaterialNode(Variant.LineDashOffset);
export const materialPointWidth = new MaterialNode(Variant.PointWidth);
