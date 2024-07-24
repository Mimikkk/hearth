import {
  Geometry,
  Color,
  Material,
  Entity,
  RenderTarget,
  Revision,
  Scene,
  Texture,
  TextureDataType,
  Vec2,
  Vec3,
  Vec4,
} from '../../../engine.js';
import NodeUniformsGroup from '../../common/nodes/NodeUniformsGroup.js';
import NodeSampler from '../../common/nodes/NodeSampler.js';
import { NodeSampledCubeTexture, NodeSampledTexture } from '../../common/nodes/NodeSampledTexture.js';
import NodeUniformBuffer from '../../common/nodes/NodeUniformBuffer.js';
import NodeStorageBuffer from '../../common/nodes/NodeStorageBuffer.js';
import {
  LightsNode,
  NodeMaterial,
  NodeStack,
  NodeUpdateType,
  stack,
  UniformNode,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { getFormat } from '../utils/Backend.textures.js';
import ChainMap from '@modules/renderer/engine/renderers/common/ChainMap.js';
import NodeKeywords from '@modules/renderer/engine/nodes/core/NodeKeywords.js';
import NodeCache from '@modules/renderer/engine/nodes/core/NodeCache.js';
import NodeAttribute from '@modules/renderer/engine/nodes/core/NodeAttribute.js';
import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';
import NodeVar from '@modules/renderer/engine/nodes/core/NodeVar.js';
import NodeVarying from '@modules/renderer/engine/nodes/core/NodeVarying.js';
import NodeCode from '@modules/renderer/engine/nodes/core/NodeCode.js';
import FunctionNode from '@modules/renderer/engine/nodes/code/FunctionNode.js';
import ParameterNode from '@modules/renderer/engine/nodes/core/ParameterNode.js';
import {
  ColorNodeUniform,
  FloatNodeUniform,
  Mat3NodeUniform,
  Mat4NodeUniform,
  Vec2NodeUniform,
  Vec3NodeUniform,
  Vec4NodeUniform,
} from '@modules/renderer/engine/renderers/common/nodes/NodeUniform.js';
import { NodeMaterials } from '@modules/renderer/engine/nodes/materials/NodeMaterialMap.js';
import { FeatureMap, FeatureName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.features.ts';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import StackNode from '@modules/renderer/engine/nodes/core/StackNode.js';
import EnvironmentNode from '@modules/renderer/engine/nodes/lighting/EnvironmentNode.js';
import FogNode from '@modules/renderer/engine/nodes/fog/FogNode.js';
import ToneMappingNode from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import ClippingContext from '@modules/renderer/engine/renderers/common/ClippingContext.js';
import { TypedArray, TypedArrayConstructor } from '@modules/renderer/engine/math/MathUtils.js';
import { BuildStage, BuiltinType, ShaderStage, TypeMap, TypeName } from './NodeBuilder.types.js';
import { PolyfillMap, PolyfillName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.polyfills.js';
import StructTypeNode from '@modules/renderer/engine/nodes/core/StructTypeNode.js';
import { ShaderNode } from 'three/examples/jsm/nodes/shadernode/ShaderNode.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';
import ConstNode from '@modules/renderer/engine/nodes/core/ConstNode.js';
import NodeFunction from '@modules/renderer/engine/renderers/webgpu/nodes/NodeFunction.js';

type ParseFn = (source: string) => NodeFunction;

export class NodeBuilder {
  material: Material | null;
  geometry: Geometry | null;
  isCompute: boolean;

  parseFn: ParseFn;

  nodes: Node[];
  updateNodes: Node[];
  updateBeforeNodes: Node[];
  hashNodes: Record<string, Node>;
  lightsNode: LightsNode | null;
  environmentNode: EnvironmentNode | null;
  fogNode: FogNode | null;
  toneMappingNode: ToneMappingNode | null;
  clippingContext: ClippingContext | null;
  vertexShader: string | null;
  fragmentShader: string | null;
  computeShader: string | null;
  flowNodes: Record<ShaderStage, Node[]>;
  flowCode: Record<ShaderStage, string>;
  uniforms: Record<ShaderStage, NodeUniformsGroup[]> & { index: number };
  structs: Record<ShaderStage, StructTypeNode[]> & { index: number };
  bindings: Record<ShaderStage, NodeUniformsGroup[]>;
  bindingsOffset: Record<ShaderStage, number>;
  bindingsArray: NodeUniformBuffer | NodeStorageBuffer | null;
  attributes: NodeAttribute[];
  bufferAttributes: NodeAttribute[];
  varyings: NodeVarying[];
  codes: Record<ShaderStage, NodeCode[]>;
  vars: Record<ShaderStage, NodeVar[]>;
  flow: {
    code: string;
  };
  chaining: Node[];
  stack: StackNode;
  stacks: StackNode[];
  currentFunctionNode: FunctionNode | null;
  context: {
    keywords: NodeKeywords;
    material: Material | null;
    vertex?: Node;
  };
  cache: NodeCache;
  globalCache: NodeCache;
  flowsData: WeakMap<Node, any>;
  shaderStage: ShaderStage;
  buildStage: BuildStage;
  uniformGroups: Record<ShaderStage, Record<string, NodeUniformsGroup>>;
  builtins: Record<BuiltinType, Map<string, { name: string; property: string; type: string }>>;

  constructor(
    public object: Entity,
    public renderer: Renderer,
    public scene: Scene,
  ) {
    this.material = object?.material ?? null;
    this.geometry = object?.geometry ?? null;
    this.parseFn = (source: string) => new NodeFunction(source);

    this.nodes = [];
    this.updateNodes = [];
    this.updateBeforeNodes = [];
    this.hashNodes = {};

    this.lightsNode = null;
    this.environmentNode = null;
    this.fogNode = null;
    this.toneMappingNode = null;

    this.clippingContext = null;

    this.vertexShader = null;
    this.fragmentShader = null;
    this.computeShader = null;

    this.flowNodes = { vertex: [], fragment: [], compute: [] };
    this.flowCode = { vertex: '', fragment: '', compute: '' };
    this.uniforms = { vertex: [], fragment: [], compute: [], index: 0 };
    this.structs = { vertex: [], fragment: [], compute: [], index: 0 };
    this.bindings = { vertex: [], fragment: [], compute: [] };
    this.bindingsOffset = { vertex: 0, fragment: 0, compute: 0 };
    this.bindingsArray = null;
    this.attributes = [];
    this.bufferAttributes = [];
    this.varyings = [];
    this.codes = { vertex: [], compute: [], fragment: [] };
    this.vars = { vertex: [], compute: [], fragment: [] };
    this.flow = { code: '' };
    this.chaining = [];
    this.stacks = [];
    this.stack = stack();

    this.currentFunctionNode = null;

    this.context = {
      keywords: new NodeKeywords(),
      material: this.material,
    };

    this.cache = new NodeCache();
    this.globalCache = this.cache;

    this.flowsData = new WeakMap();

    this.shaderStage = null!;
    this.buildStage = null!;

    this.uniformGroups = { vertex: {}, compute: {}, fragment: {} };

    this.builtins = {
      vertex: new Map(),
      fragment: new Map(),
      compute: new Map(),
      attribute: new Map(),
      output: new Map(),
    };

    this.isCompute = !this.material;
  }

  createRenderTarget(width: number, height: number, options?: RenderTarget.Options): RenderTarget {
    return new RenderTarget(width, height, options);
  }

  _getSharedBindings(bindings: NodeUniformsGroup[]): NodeUniformsGroup[] {
    const shared = [];

    for (const binding of bindings) {
      if (binding.shared === true) {
        // nodes is the chainmap key
        const nodes = binding.getNodes();

        let sharedBinding = UniformsGroup.get(nodes);

        if (sharedBinding === undefined) {
          UniformsGroup.set(nodes, binding);

          sharedBinding = binding;
        }

        shared.push(sharedBinding);
      } else {
        shared.push(binding);
      }
    }

    return shared;
  }

  useBindings(): NodeUniformsGroup[] {
    let bindingsArray = this.bindingsArray;

    if (!bindingsArray) {
      const { compute, fragment, vertex } = this.bindings;

      this.bindingsArray = this._getSharedBindings(this.isCompute ? compute : [...vertex, ...fragment]);

      bindingsArray = this.bindingsArray;
    }

    return bindingsArray;
  }

  addNode(node: Node): void {
    if (this.nodes.includes(node)) return;
    this.nodes.push(node);
    this.hashNodes[node.getHash(this)] = node;
  }

  buildUpdateNodes(): void {
    for (const node of this.nodes) {
      const updateType = node.getUpdateType();
      const updateBeforeType = node.getUpdateBeforeType();

      if (updateType !== NodeUpdateType.NONE) {
        this.updateNodes.push(node.getSelf());
      }

      if (updateBeforeType !== NodeUpdateType.NONE) {
        this.updateBeforeNodes.push(node);
      }
    }
  }

  addChain(node: Node): void {
    this.chaining.push(node);
  }

  removeChain(node: Node): void {
    const lastChain = this.chaining.pop();

    if (lastChain !== node) {
      throw new Error('NodeBuilder: Invalid node chaining!');
    }
  }

  addFlow(shaderStage: ShaderStage, node: Node) {
    this.flowNodes[shaderStage].push(node);

    return node;
  }

  generateConst(type: TypeName, value: any = null): ConstNode {
    if (value === null) {
      if (type === 'f32' || type === 'i32' || type === 'u32') value = 0;
      else if (type === 'bool') value = false;
      else if (type === 'color') value = Color.new();
      else if (type === 'vec2') value = Vec2.new();
      else if (type === 'vec3') value = Vec3.new();
      else if (type === 'vec4') value = Vec4.new();
    }

    if (type === 'f32') return formatAsFloat(value);
    if (type === 'i32') return `${Math.round(value)}`;
    if (type === 'u32') return value >= 0 ? `${Math.round(value)}u` : '0u';
    if (type === 'bool') return value ? 'true' : 'false';
    if (type === 'color')
      return `${this.getType('vec3')}(${formatAsFloat(value.r)}, ${formatAsFloat(value.g)}, ${formatAsFloat(value.b)})`;

    const typeLength = this.getTypeLength(type);

    const componentType = this.getComponentType(type);

    const generateConst = value => this.generateConst(componentType, value);

    if (typeLength === 2) {
      return `${this.getType(type)}(${generateConst(value.x)}, ${generateConst(value.y)})`;
    } else if (typeLength === 3) {
      return `${this.getType(type)}(${generateConst(value.x)}, ${generateConst(value.y)}, ${generateConst(value.z)})`;
    } else if (typeLength === 4) {
      return `${this.getType(type)}(${generateConst(value.x)}, ${generateConst(value.y)}, ${generateConst(value.z)}, ${generateConst(value.w)})`;
    } else if (typeLength > 4 && value && (value.isMat3 || value.isMat4)) {
      return `${this.getType(type)}(${value.elements.map(generateConst).join(', ')})`;
    } else if (typeLength > 4) {
      return `${this.getType(type)}()`;
    }

    throw new Error(`NodeBuilder: Type '${type}' not found in generate constant attempt.`);
  }

  hasGeometryAttribute(name: string): boolean {
    return this.geometry && this.geometry.getAttribute(name) !== undefined;
  }

  getAttribute(name: string, type: TypeName): NodeAttribute {
    const attributes = this.attributes;

    // find attribute

    for (const attribute of attributes) {
      if (attribute.name === name) {
        return attribute;
      }
    }

    // create a new if no exist

    const attribute = new NodeAttribute(name, type);

    attributes.push(attribute);

    return attribute;
  }

  isVector(type: TypeName): boolean {
    return /vec\d/.test(type);
  }

  isMatrix(type: TypeName): boolean {
    return /mat\d/.test(type);
  }

  getComponentType(type: TypeName): TypeName | null {
    type = this.getVectorType(type);

    if (type === 'f32' || type === 'bool' || type === 'i32' || type === 'u32') return type;

    const componentType = /(b|i|u|)(vec|mat)([2-4])/.exec(type);

    if (componentType === null) return null;

    if (componentType[1] === 'b') return 'bool';
    if (componentType[1] === 'i') return 'i32';
    if (componentType[1] === 'u') return 'u32';

    return 'f32';
  }

  getVectorType(type: TypeName): TypeName {
    if (type === 'color') return 'vec3';
    if (type === 'texture' || type === 'cubeTexture' || type === 'storageTexture') return 'vec4';

    return type;
  }

  getTypeFromLength(length: number, componentType: string = 'f32'): TypeName {
    if (length === 1) return componentType;

    const baseType = TypeByLength.get(length);
    const prefix = componentType === 'f32' ? '' : componentType[0];

    return prefix + baseType;
  }

  getTypeFromArray(array: TypedArray): TypeName {
    return TypeByArray.get(array.constructor as TypedArrayConstructor);
  }

  getTypeFromAttribute(attribute: AttributeType): TypeName {
    let dataAttribute = attribute;

    if (attribute.isInterleavedBufferAttribute) dataAttribute = attribute.data;

    const array = dataAttribute.array;
    const itemSize = attribute.itemSize;
    const normalized = attribute.normalized;

    let arrayType;

    if (!normalized) arrayType = this.getTypeFromArray(array);
    return this.getTypeFromLength(itemSize, arrayType);
  }

  getTypeLength(type: TypeName): TypeName {
    const vecType = this.getVectorType(type);
    const vecNum = /vec([2-4])/.exec(vecType);

    if (vecNum !== null) return Number(vecNum[1]);
    if (vecType === 'f32' || vecType === 'bool' || vecType === 'i32' || vecType === 'u32') return 1;
    if (/mat2/.test(type) === true) return 4;
    if (/mat3/.test(type) === true) return 9;
    if (/mat4/.test(type) === true) return 16;

    return 0;
  }

  getVectorFromMatrix(type: TypeName): TypeName {
    return type.replace('mat', 'vec');
  }

  changeComponentType(type: TypeName, newComponentType: TypeName): TypeName {
    return this.getTypeFromLength(this.getTypeLength(type), newComponentType);
  }

  getIntegerType(type: TypeName) {
    const componentType = this.getComponentType(type);

    if (componentType === 'i32' || componentType === 'u32') return type;

    return this.changeComponentType(type, 'i32');
  }

  addStack(): void {
    this.stack = stack(this.stack);

    this.stacks.push(NodeStack.get() || this.stack);
    NodeStack.set(this.stack);

    return this.stack;
  }

  removeStack(): void {
    const lastStack = this.stack;
    this.stack = lastStack.parent;

    NodeStack.set(this.stacks.pop());

    return lastStack;
  }

  getDataFromNode(node: Node, shaderStage: ShaderStage | null = this.shaderStage, cache = null) {
    cache = cache === null ? (node.isGlobal(this) ? this.globalCache : this.cache) : cache;

    let nodeData = cache.get(node);

    if (nodeData === undefined) {
      nodeData = {};

      cache.set(node, nodeData);
    }

    if (nodeData[shaderStage] === undefined) nodeData[shaderStage] = {};

    return nodeData[shaderStage];
  }

  getNodeProperties(node: Node, shaderStage: ShaderStage | null = null) {
    const nodeData = this.getDataFromNode(node, shaderStage);

    return nodeData.properties || (nodeData.properties = { outputNode: null });
  }

  getBufferAttributeFromNode(node: Node, type: TypeName): NodeAttribute {
    const nodeData = this.getDataFromNode(node);

    let bufferAttribute = nodeData.bufferAttribute;

    if (bufferAttribute === undefined) {
      const index = this.uniforms.index++;

      bufferAttribute = new NodeAttribute('nodeAttribute' + index, type, node);

      this.bufferAttributes.push(bufferAttribute);

      nodeData.bufferAttribute = bufferAttribute;
    }

    return bufferAttribute;
  }

  getStructTypeFromNode(node: Node, shaderStage: ShaderStage = this.shaderStage): StructTypeNode {
    const nodeData = this.getDataFromNode(node, shaderStage);

    if (nodeData.structType === undefined) {
      const index = this.structs.index++;

      node.name = `StructType${index}`;
      this.structs[shaderStage].push(node);

      nodeData.structType = node;
    }

    return node;
  }

  getVarFromNode(node: Node, name = null, type = node.getNodeType(this), shaderStage = this.shaderStage): NodeVar {
    const nodeData = this.getDataFromNode(node, shaderStage);

    let nodeVar = nodeData.variable;

    if (nodeVar === undefined) {
      const vars = this.vars[shaderStage] || (this.vars[shaderStage] = []);

      if (name === null) name = 'nodeVar' + vars.length;

      nodeVar = new NodeVar(name, type);

      vars.push(nodeVar);

      nodeData.variable = nodeVar;
    }

    return nodeVar;
  }

  getVaryingFromNode(node: Node, name = null, type = node.getNodeType(this)) {
    const nodeData = this.getDataFromNode(node, 'any');

    let nodeVarying = nodeData.varying;

    if (nodeVarying === undefined) {
      const varyings = this.varyings;
      const index = varyings.length;

      if (name === null) name = 'nodeVarying' + index;

      nodeVarying = new NodeVarying(name, type);

      varyings.push(nodeVarying);

      nodeData.varying = nodeVarying;
    }

    return nodeVarying;
  }

  getCodeFromNode(node: Node, type: TypeName, shaderStage: ShaderStage = this.shaderStage) {
    const nodeData = this.getDataFromNode(node);

    let nodeCode = nodeData.code;

    if (nodeCode === undefined) {
      const codes = this.codes[shaderStage] || (this.codes[shaderStage] = []);
      const index = codes.length;

      nodeCode = new NodeCode('nodeCode' + index, type);

      codes.push(nodeCode);

      nodeData.code = nodeCode;
    }

    return nodeCode;
  }

  addLineFlowCode(code) {
    if (code === '') return this;

    code = '\t' + code;

    if (!/;\s*$/.test(code)) {
      code = code + ';\n';
    }

    this.flow.code += code;

    return this;
  }

  generate(node: Node): void {
    this.flowsData.set(node, this.flowChildNode(node, node.getNodeType(this)));
  }

  buildFunctionNode(shaderNode: ShaderNode): FunctionNode {
    const fn = new FunctionNode();

    const previous = this.currentFunctionNode;

    this.currentFunctionNode = fn;

    fn.code = this.buildFunctionCode(shaderNode);

    this.currentFunctionNode = previous;

    return fn;
  }

  flowShaderNode(shaderNode: ShaderNode): void {
    const layout = shaderNode.layout;

    let inputs;

    if (shaderNode.isArrayInput) {
      inputs = [];

      for (const input of layout.inputs) {
        inputs.push(new ParameterNode(input.type, input.name));
      }
    } else {
      inputs = {};

      for (const input of layout.inputs) {
        inputs[input.name] = new ParameterNode(input.type, input.name);
      }
    }

    //

    shaderNode.layout = null;

    const callNode = shaderNode.call(inputs);
    const flowData = this.flowStagesNode(callNode, layout.type);

    shaderNode.layout = layout;

    return flowData;
  }

  flowStagesNode(node: Node, output?: TypeName): any {
    const previousFlow = this.flow;
    const previousVars = this.vars;
    const previousBuildStage = this.buildStage;

    const flow = {
      code: '',
    };

    this.flow = flow;
    this.vars = {};

    for (const buildStage of BuildStage.order) {
      this.buildStage = buildStage;

      flow.result = node.build(this, output);
    }

    flow.vars = this.codeVariables(this.shaderStage);

    this.flow = previousFlow;
    this.vars = previousVars;
    this.buildStage = previousBuildStage;

    return flow;
  }

  flowChildNode(node: Node, output?: TypeName): any {
    const previousFlow = this.flow;
    const flow = { code: '' };

    this.flow = flow;
    flow.result = node.build(this, output);
    this.flow = previousFlow;

    return flow;
  }

  flowNodeFromShaderStage(shaderStage: ShaderStage, node: Node, output: Node, propertyName: string): any {
    const previousShaderStage = this.shaderStage;

    this.shaderStage = shaderStage;

    const flowData = this.flowChildNode(node, output);

    if (propertyName) {
      flowData.code += `${'\t' + propertyName} = ${flowData.result};\n`;
    }

    this.flowCode[shaderStage] = this.flowCode[shaderStage] + flowData.code;

    this.shaderStage = previousShaderStage;

    return flowData;
  }

  getAttributesArray(): NodeAttribute[] {
    return this.attributes.concat(this.bufferAttributes);
  }

  build(convertMaterial: boolean = true): this {
    const { object, material } = this;

    if (convertMaterial) {
      if (material) {
        NodeMaterial.fromMaterial(material).build(this);
      } else {
        this.addFlow(ShaderStage.Compute, object);
      }
    }

    for (const buildStage of BuildStage.order) {
      this.buildStage = buildStage;

      if (this.context.vertex?.isNode) this.flowNodeFromShaderStage(ShaderStage.Vertex, this.context.vertex);

      for (const stage of ShaderStage.order) {
        this.shaderStage = stage;

        for (const node of this.flowNodes[stage]) {
          if (BuildStage.Generate) {
            this.generate(node);
          } else {
            node.build(this);
          }
        }
      }
    }

    this.buildStage = null;
    this.shaderStage = null;

    this.code();
    this.buildUpdateNodes();

    return this;
  }

  getNodeUniform(uniformNode: NodeUniform, type: TypeName) {
    if (type === 'f32') return new FloatNodeUniform(uniformNode);
    if (type === 'vec2') return new Vec2NodeUniform(uniformNode);
    if (type === 'vec3') return new Vec3NodeUniform(uniformNode);
    if (type === 'vec4') return new Vec4NodeUniform(uniformNode);
    if (type === 'color') return new ColorNodeUniform(uniformNode);
    if (type === 'mat3') return new Mat3NodeUniform(uniformNode);
    if (type === 'mat4') return new Mat4NodeUniform(uniformNode);

    throw new Error(`Uniform "${type}" not declared.`);
  }

  createNodeMaterial(type: string = 'NodeMaterial'): NodeMaterial {
    return new (NodeMaterials.get(type))();
  }

  format(snippet: string, fromType: TypeName, toType: TypeName): string {
    fromType = this.getVectorType(fromType);
    toType = this.getVectorType(toType);

    if (fromType === toType || toType === null || this.isReference(toType)) {
      return snippet;
    }

    const fromTypeLength = this.getTypeLength(fromType);
    const toTypeLength = this.getTypeLength(toType);

    if (fromTypeLength > 4) {
      return snippet;
    }

    if (toTypeLength > 4 || toTypeLength === 0) {
      return snippet;
    }

    if (fromTypeLength === toTypeLength) {
      return `${this.getType(toType)}(${snippet})`;
    }

    if (fromTypeLength > toTypeLength) {
      return this.format(
        `${snippet}.${'xyz'.slice(0, toTypeLength)}`,
        this.getTypeFromLength(toTypeLength, this.getComponentType(fromType)),
        toType,
      );
    }

    if (toTypeLength === 4 && fromTypeLength > 1) {
      return `${this.getType(toType)}(${this.format(snippet, fromType, 'vec3')}, 1.0)`;
    }

    if (fromTypeLength === 2) {
      return `${this.getType(toType)}(${this.format(snippet, fromType, 'vec2')}, 0.0)`;
    }

    if (fromTypeLength === 1 && toTypeLength > 1 && fromType[0] !== toType[0]) {
      snippet = `${this.getType(this.getComponentType(toType))}(${snippet})`;
    }

    return `${this.getType(toType)}(${snippet})`;
  }

  needsColorSpaceToLinear(texture: Texture): boolean {
    return texture.isVideoTexture === true && texture.colorSpace !== null;
  }

  codeFunctions(shaderStage: ShaderStage): string {
    const codes = this.codes[shaderStage];

    let code = '';

    if (codes !== undefined) {
      for (const nodeCode of codes) {
        code += nodeCode.code + '\n';
      }
    }

    return code;
  }

  codeTextureSample(
    texture: Texture,
    textureProperty: string,
    uvSnippet: string,
    depthSnippet: string,
    shaderStage: ShaderStage = this.shaderStage,
  ): string {
    if (shaderStage === ShaderStage.Fragment) {
      if (depthSnippet) {
        return `textureSample(${textureProperty}, ${textureProperty}_sampler, ${uvSnippet}, ${depthSnippet})`;
      } else {
        return `textureSample(${textureProperty}, ${textureProperty}_sampler, ${uvSnippet})`;
      }
    } else {
      return this.codeTextureLod(texture, textureProperty, uvSnippet);
    }
  }

  codeVideoSample(textureProperty: string, uvSnippet: string, shaderStage: ShaderStage = this.shaderStage): string {
    if (shaderStage === ShaderStage.Fragment) {
      return `textureSampleBaseClampToEdge(${textureProperty}, ${textureProperty}_sampler, vec2<f32>(${uvSnippet}.x, 1.0 - ${uvSnippet}.y))`;
    } else {
      console.error(`WebGPURenderer: engine.VideoTexture does not support ${shaderStage} shader.`);
    }
  }

  codeTextureSampleLevel(
    texture: Texture,
    textureProperty: string,
    uvSnippet: string,
    levelSnippet: string,
    depthSnippet: string,
    shaderStage: ShaderStage = this.shaderStage,
  ) {
    if (shaderStage === ShaderStage.Fragment && !this.isUnfilterable(texture)) {
      return `textureSampleLevel(${textureProperty}, ${textureProperty}_sampler, ${uvSnippet}, ${levelSnippet})`;
    }
    return this.codeTextureLod(texture, textureProperty, uvSnippet, levelSnippet);
  }

  codeTextureLod(texture: Texture, textureProperty: string, uvSnippet: string, levelSnippet: string = '0'): string {
    this.polyfill('repeatWrapping');

    const dimension = `textureDimensions(${textureProperty}, 0)`;

    return `textureLoad(${textureProperty}, repeatWrapping(${uvSnippet}, ${dimension}), i32(${levelSnippet}))`;
  }

  codeTextureLoad(
    texture: Texture,
    textureProperty: string,
    uvIndexSnippet: string,
    depthSnippet: string,
    levelSnippet: string = '0u',
  ): string {
    if (depthSnippet) {
      return `textureLoad(${textureProperty}, ${uvIndexSnippet}, ${depthSnippet}, ${levelSnippet})`;
    } else {
      return `textureLoad(${textureProperty}, ${uvIndexSnippet}, ${levelSnippet})`;
    }
  }

  codeTextureStore(texture: Texture, textureProperty: string, uvIndexSnippet: string, valueSnippet: string): string {
    return `textureStore(${textureProperty}, ${uvIndexSnippet}, ${valueSnippet})`;
  }

  isUnfilterable(texture: Texture): boolean {
    return texture.isDataTexture === true && texture.type === TextureDataType.Float;
  }

  codeTexture(
    texture: Texture,
    textureProperty: string,
    uvSnippet: string,
    depthSnippet: string,
    shaderStage: ShaderStage = this.shaderStage,
  ): string {
    if (texture.isVideoTexture === true) {
      return this.codeVideoSample(textureProperty, uvSnippet, shaderStage);
    } else if (this.isUnfilterable(texture)) {
      return this.codeTextureLod(texture, textureProperty, uvSnippet, '0', depthSnippet, shaderStage);
    } else {
      return this.codeTextureSample(texture, textureProperty, uvSnippet, depthSnippet, shaderStage);
    }

    return '';
  }

  codeTextureCompare(
    texture: Texture,
    textureProperty: string,
    uvSnippet: string,
    compareSnippet: string,
    depthSnippet: string,
    shaderStage: ShaderStage = this.shaderStage,
  ): string {
    if (shaderStage === ShaderStage.Fragment) {
      return `textureSampleCompare(${textureProperty}, ${textureProperty}_sampler, ${uvSnippet}, ${compareSnippet})`;
    }
    return '';
  }

  codeTextureLevel(
    texture: Texture,
    textureProperty: string,
    uvSnippet: string,
    levelSnippet: string,
    depthSnippet: string,
    shaderStage: ShaderStage = this.shaderStage,
  ): string {
    let snippet = null;

    if (texture.isVideoTexture === true) {
      snippet = this.codeVideoSample(textureProperty, uvSnippet, shaderStage);
    } else {
      snippet = this.codeTextureSampleLevel(
        texture,
        textureProperty,
        uvSnippet,
        levelSnippet,
        depthSnippet,
        shaderStage,
      );
    }

    return snippet;
  }

  getPropertyName(node: Node, shaderStage: ShaderStage = this.shaderStage): string {
    if (node.isNodeVarying === true && node.needsInterpolation === true) {
      if (shaderStage === ShaderStage.Vertex) {
        return `vertex.${node.name}`;
      }
    } else if (node.isNodeUniform === true) {
      const name = node.name;
      const type = node.type;

      if (type === 'texture' || type === 'cubeTexture' || type === 'storageTexture') {
        return name;
      } else if (type === 'buffer' || type === 'storageBuffer') {
        return `NodeBuffer_${node.id}.${name}`;
      } else {
        return node.groupNode.name + '.' + name;
      }
    }

    return node.name;
  }

  getUniformFromNode(node: Node, type: TypeName, shaderStage: ShaderStage, name: string | null = null): UniformNode {
    const getUniformFromNode = (node, type, shaderStage = this.shaderStage, name = null) => {
      const nodeData = this.getDataFromNode(node, shaderStage, this.globalCache);

      let nodeUniform = nodeData.uniform;

      if (nodeUniform === undefined) {
        const index = this.uniforms.index++;

        nodeUniform = new NodeUniform(name || 'nodeUniform' + index, type, node);

        this.uniforms[shaderStage].push(nodeUniform);

        nodeData.uniform = nodeUniform;
      }

      return nodeUniform;
    };

    const uniformNode = getUniformFromNode(node, type, shaderStage, name);

    const nodeData = this.getDataFromNode(node, shaderStage, this.globalCache);

    if (nodeData.uniformGPU === undefined) {
      let uniformGPU;

      const bindings = this.bindings[shaderStage];

      if (type === 'texture' || type === 'cubeTexture' || type === 'storageTexture') {
        let texture = null;

        if (type === 'texture' || type === 'storageTexture') {
          texture = new NodeSampledTexture(uniformNode.name, uniformNode.node);
        } else if (type === 'cubeTexture') {
          texture = new NodeSampledCubeTexture(uniformNode.name, uniformNode.node);
        }

        texture.store = node.isStoreTextureNode === true;
        texture.setVisibility(GpuShaderStage[shaderStage]);

        if (
          shaderStage === ShaderStage.Fragment &&
          this.isUnfilterable(node.value) === false &&
          texture.store === false
        ) {
          const sampler = new NodeSampler(`${uniformNode.name}_sampler`, uniformNode.node);
          sampler.setVisibility(GpuShaderStage[shaderStage]);

          bindings.push(sampler, texture);

          uniformGPU = [sampler, texture];
        } else {
          bindings.push(texture);

          uniformGPU = [texture];
        }
      } else if (type === 'buffer' || type === 'storageBuffer') {
        const bufferClass = type === 'storageBuffer' ? NodeStorageBuffer : NodeUniformBuffer;
        const buffer = new bufferClass(node);
        buffer.setVisibility(GpuShaderStage[shaderStage]);

        bindings.push(buffer);

        uniformGPU = buffer;
      } else {
        const group = node.groupNode;
        const groupName = group.name;

        const uniformsStage = this.uniformGroups[shaderStage];

        let uniformsGroup = uniformsStage[groupName];

        if (uniformsGroup === undefined) {
          uniformsGroup = new NodeUniformsGroup(groupName, group);
          uniformsGroup.setVisibility(GpuShaderStage[shaderStage]);

          uniformsStage[groupName] = uniformsGroup;

          bindings.push(uniformsGroup);
        }

        uniformGPU = this.getNodeUniform(uniformNode, type);

        uniformsGroup.addUniform(uniformGPU);
      }

      nodeData.uniformGPU = uniformGPU;

      if (shaderStage === ShaderStage.Vertex) {
        this.bindingsOffset[ShaderStage.Fragment] = bindings.length;
      }
    }

    return uniformNode;
  }

  isReference(type: TypeName): boolean {
    return (
      type === 'void' ||
      type === 'property' ||
      type === 'sampler' ||
      type === 'texture' ||
      type === 'cubeTexture' ||
      type === 'storageTexture' ||
      type === 'texture_2d' ||
      type === 'texture_cube' ||
      type === 'texture_depth_2d' ||
      type === 'texture_storage_2d'
    );
  }

  buildFunctionCode(shaderNode: ShaderNode): string {
    const layout = shaderNode.layout;
    const flow = this.flowShaderNode(shaderNode);

    const parameters = [];

    for (const input of layout.inputs) {
      parameters.push(`${input.name}: ${this.getType(input.type)}`);
    }

    return `fn ${layout.name}(${parameters.join(', ')}) -> ${this.getType(layout.type)} {
${flow.vars}
${flow.code}
	return ${flow.result};
}`;
  }

  useBuiltin(name: string, property: string, type: TypeName, builtin: BuiltinType): string {
    const map = this.builtins[builtin];

    if (!map.has(name)) map.set(name, { name, property, type });

    return property;
  }

  useVertexIndex(): string {
    if (this.shaderStage === ShaderStage.Vertex) {
      return this.useBuiltin('vertex_index', 'vertexIndex', 'u32', BuiltinType.Attribute);
    }

    return 'vertexIndex';
  }

  UseInstanceIndex(): string {
    if (this.shaderStage === ShaderStage.Vertex)
      return this.useBuiltin('instance_index', 'instanceIndex', 'u32', BuiltinType.Attribute);
    return 'instanceIndex';
  }

  useFrontFacing(): string {
    return this.useBuiltin('front_facing', 'isFront', 'bool', BuiltinType.Fragment);
  }

  useFragCoord(): string {
    return this.useBuiltin('position', 'fragCoord', 'vec4<f32>', BuiltinType.Fragment) + '.xy';
  }

  useFragDepth(): string {
    return 'output.' + this.useBuiltin('frag_depth', 'depth', 'f32', BuiltinType.Output);
  }

  codeBuiltins(shaderStage: BuiltinType): string {
    const snippets = [];
    const builtins = this.builtins[shaderStage];

    if (builtins !== undefined) {
      for (const { name, property, type } of builtins.values()) {
        snippets.push(`@builtin(${name}) ${property}: ${type}`);
      }
    }

    return snippets.join(',\n\t');
  }

  codeParameters(shaderStage: ShaderStage): string {
    if (shaderStage === ShaderStage.Fragment) return '';

    const snippets = [];
    if (shaderStage === ShaderStage.Compute) {
      this.useBuiltin('global_invocation_id', 'id', 'vec3<u32>', BuiltinType.Attribute);
    }

    const builtins = this.codeBuiltins(BuiltinType.Attribute);

    if (builtins) snippets.push(builtins);

    const attributes = this.getAttributesArray();

    for (let index = 0, length = attributes.length; index < length; index++) {
      const attribute = attributes[index];
      const name = attribute.name;
      const type = this.getType(attribute.type);

      snippets.push(`@location(${index}) ${name}: ${type}`);
    }

    return snippets.join(',\n\t');
  }

  code(): void {
    if (this.isCompute) {
      this.computeShader = Snippet.compute({
        parameters: this.codeParameters(ShaderStage.Compute),
        uniforms: this.codeUniforms(ShaderStage.Compute),
        structures: this.codeStructures(ShaderStage.Compute),
        variables: this.codeVariables(ShaderStage.Compute),
        functions: this.codeFunctions(ShaderStage.Compute),
        size: this.codeComputeSize(),
        code: this.codeCompute(),
      });
    } else {
      this.fragmentShader = Snippet.fragment({
        parameters: this.codeVaryings(ShaderStage.Fragment),
        uniforms: this.codeUniforms(ShaderStage.Fragment),
        structures: this.codeStructures(ShaderStage.Fragment),
        variables: this.codeVariables(ShaderStage.Fragment),
        functions: this.codeFunctions(ShaderStage.Fragment),
        code: this.codeFragment(),
        return: this.codeFragmentReturn(),
      });
      this.vertexShader = Snippet.vertex({
        parameters: this.codeParameters(ShaderStage.Vertex),
        uniforms: this.codeUniforms(ShaderStage.Vertex),
        varyings: this.codeVaryings(ShaderStage.Vertex),
        functions: this.codeFunctions(ShaderStage.Vertex),
        variables: this.codeVariables(ShaderStage.Vertex),
        code: this.codeVertex(),
      });
    }
  }

  codeStructures(stage: ShaderStage): string {
    const snippets = [];
    const structs = this.structs[stage];

    for (const { name, types } of structs) {
      snippets.push(`struct ${name} {
      ${types.map((type, i) => `@location(${i}) m${i}: ${type}`).join(',\n')}
      }`);
    }

    if (stage === ShaderStage.Fragment) {
      const flowNodes = this.flowNodes[ShaderStage.Fragment];
      const mainNode = flowNodes[flowNodes.length - 1];
      const outputNode = mainNode.outputNode;

      if (outputNode?.isOutputStructNode) {
      } else {
        let members = '@location(0) color: vec4<f32>';

        const builtins = this.codeBuiltins(BuiltinType.Output);
        if (builtins) members += ',\n\t' + builtins;

        snippets.push(`
          ${Snippet.struct({ name: Inbuilt.Struct.Output, members })}
          var<private> output: ${Inbuilt.Struct.Output};
          `);
      }
    }

    return snippets.join('\n');
  }

  codeVariable(type: TypeName, name: string): string {
    return `var ${name}: ${this.getType(type)}`;
  }

  codeVariables(shaderStage: ShaderStage): string {
    const snippets = [];
    const vars = this.vars[shaderStage];

    if (vars !== undefined) {
      for (const variable of vars) {
        snippets.push(`\t${this.codeVariable(variable.type, variable.name)};`);
      }
    }

    return `\n${snippets.join('\n')}\n`;
  }

  codeVaryings(shaderStage: ShaderStage): string {
    const snippets = [];

    if (shaderStage === ShaderStage.Vertex) {
      this.useBuiltin('position', 'Vertex', 'vec4<f32>', BuiltinType.Vertex);
    }

    if (shaderStage === ShaderStage.Vertex || shaderStage === ShaderStage.Fragment) {
      const varyings = this.varyings;
      const vars = this.vars[shaderStage];

      for (let index = 0; index < varyings.length; index++) {
        const varying = varyings[index];

        if (varying.needsInterpolation) {
          let attributesSnippet = `@location(${index})`;

          if (/^(i32|u32|ivec|uvec)/.test(varying.type)) {
            attributesSnippet += ' @interpolate(flat)';
          }

          snippets.push(`${attributesSnippet} ${varying.name}: ${this.getType(varying.type)}`);
        } else if (shaderStage === ShaderStage.Vertex && vars.includes(varying) === false) {
          vars.push(varying);
        }
      }
    }

    const builtins = this.codeBuiltins(shaderStage);

    if (builtins) snippets.push(builtins);

    const code = snippets.join(',\n\t');

    return shaderStage === ShaderStage.Vertex
      ? Snippet.struct({ name: Inbuilt.Struct.Vertex, members: '\t' + code })
      : code;
  }

  codeUniforms(shaderStage: ShaderStage): string {
    const uniforms = this.uniforms[shaderStage];

    const bindingSnippets = [];
    const bufferSnippets = [];
    const structSnippets = [];
    const uniformGroups = {};

    let index = this.bindingsOffset[shaderStage];

    for (const uniform of uniforms) {
      if (uniform.type === 'texture' || uniform.type === 'cubeTexture' || uniform.type === 'storageTexture') {
        const texture = uniform.node.value;

        if (
          shaderStage === ShaderStage.Fragment &&
          this.isUnfilterable(texture) === false &&
          uniform.node.isStoreTextureNode !== true
        ) {
          if (texture.isDepthTexture === true && texture.compareFunction !== null) {
            bindingSnippets.push(`@binding(${index++}) @group(0) var ${uniform.name}_sampler: sampler_comparison;`);
          } else {
            bindingSnippets.push(`@binding(${index++}) @group(0) var ${uniform.name}_sampler: sampler;`);
          }
        }

        let textureType;

        if (texture.isCubeTexture === true) {
          textureType = 'texture_cube<f32>';
        } else if (texture.isDataArrayTexture === true) {
          textureType = 'texture_2d_array<f32>';
        } else if (texture.isDepthTexture === true) {
          textureType = 'texture_depth_2d';
        } else if (texture.isVideoTexture === true) {
          textureType = 'texture_external';
        } else if (uniform.node.isStoreTextureNode === true) {
          const format = getFormat(texture);

          textureType = 'texture_storage_2d<' + format + ', write>';
        } else {
          textureType = 'texture_2d<f32>';
        }

        bindingSnippets.push(`@binding(${index++}) @group(0) var ${uniform.name}: ${textureType};`);
      } else if (uniform.type === 'buffer' || uniform.type === 'storageBuffer') {
        const bufferNode = uniform.node;
        const bufferType = this.getType(bufferNode.bufferType);
        const bufferCount = bufferNode.bufferCount;

        bufferSnippets.push(
          Snippet.structBinding({
            name: `NodeBuffer_${bufferNode.id}`,
            members: `\t${uniform.name}: array<${bufferType}${bufferCount ? `, ${bufferCount}` : ''}>\n`,
            access: bufferNode.isStorageBufferNode ? 'storage, read_write' : 'uniform',
            binding: index++,
          }),
        );
      } else {
        const vectorType = this.getType(this.getVectorType(uniform.type));
        const groupName = uniform.groupNode.name;

        const group =
          uniformGroups[groupName] ||
          (uniformGroups[groupName] = {
            index: index++,
            snippets: [],
          });

        group.snippets.push(`\t${uniform.name}: ${vectorType}`);
      }
    }

    for (const name in uniformGroups) {
      const group = uniformGroups[name];

      structSnippets.push(
        Snippet.structBinding({ name, members: group.snippets.join(',\n'), access: 'uniform', binding: group.index }),
      );
    }

    let code = bindingSnippets.join('\n');
    code += bufferSnippets.join('\n');
    code += structSnippets.join('\n');

    return code;
  }

  codeComputeSize(): string {
    return this.object.workgroupSize?.join(', ') || '64';
  }

  codeFragmentReturn(): string {
    const flowNodes = this.flowNodes[ShaderStage.Fragment];
    const mainNode = flowNodes[flowNodes.length - 1];
    const outputNode = mainNode.outputNode;

    if (outputNode?.isOutputStructNode) return outputNode.nodeType;
    return Inbuilt.Struct.Output;
  }

  codeFragment(): string {
    let code = this.flowCode[ShaderStage.Fragment];

    const flowNodes = this.flowNodes[ShaderStage.Fragment];
    const mainNode = flowNodes[flowNodes.length - 1] as StackNode;
    const outputNode = mainNode.outputNode;

    for (const node of flowNodes) {
      const slot = this.flowsData.get(node);
      const slotName = node.name;

      if (slotName) code += `\n\t// flow -> ${slotName}\n\t`;

      code += `${slot.code}\n\t`;

      if (node === mainNode) {
        code += '// result\n\t';

        if (outputNode?.isOutputStructNode) {
          code += `return ${slot.result};`;
        } else {
          let structSnippet = '\t@location(0) color: vec4<f32>';

          const builtins = this.codeBuiltins(BuiltinType.Output);
          if (builtins) structSnippet += ',\n\t' + builtins;

          code += `output.color = ${slot.result};\n\treturn output;`;
        }
      }
    }

    return code;
  }

  codeVertex(): string {
    let code = this.flowCode[ShaderStage.Vertex];

    const flowNodes = this.flowNodes[ShaderStage.Vertex];
    const mainNode = flowNodes[flowNodes.length - 1];

    for (const node of flowNodes) {
      const slot = this.flowsData.get(node);
      const slotName = node.name;

      if (slotName) code += `\n\t// flow -> ${slotName}\n\t`;

      code += `${slot.code}\n\t`;
      if (node === mainNode) {
        code += '// result\n\t';
        code += `vertex.Vertex = ${slot.result};`;
      }
    }

    return code;
  }

  codeCompute(): string {
    let code = this.flowCode[ShaderStage.Compute];

    for (const node of this.flowNodes[ShaderStage.Compute]) {
      const slot = this.flowsData.get(node);

      if (node.name) code += `\n\t// flow -> ${node.name}\n\t`;
      code += `${slot.code}\n\t`;
    }

    return code;
  }

  codeMethod(method: PolyfillName | string, output: TypeName): string {
    if (method in PolyfillMap) this.polyfill(method as PolyfillName);

    if (output) {
      const name = `${method}_${output}`;

      if (name in PolyfillMap) {
        this.polyfill(name as PolyfillName);
        return name;
      }
    }

    return method;
  }

  getType(type: TypeName): string {
    return TypeMap[type] || type;
  }

  isAvailable(name: FeatureName): boolean {
    return FeatureMap.has(name);
  }

  polyfill(name: PolyfillName): void {
    const node = PolyfillMap[name];

    node.build(this);
    this.currentFunctionNode?.includes.push(node);
  }
}

namespace Snippet {
  const Signature = `// @mimi r${Revision}`;

  export const block = (block: string, code?: string) => (code ? `// ${block}\n${code}\n` : '');

  export interface Compute {
    uniforms?: string;
    structures?: string;
    functions?: string;
    variables?: string;
    parameters?: string;
    code?: string;
    size?: string | number;
  }

  export const compute = ({ uniforms, functions, variables, parameters, code, structures, size }: Compute): string => `
${Signature}
${block('uniforms', uniforms)}
${block('structures', structures)}
${block('functions', functions)}

var<private> instanceIndex: u32;
@compute @workgroup_size(${size})
fn main(${parameters}) {
	instanceIndex = id.x;
	${block('variables', variables)}
	${block('code', code)}
}
`;

  export interface Vertex {
    parameters?: string;
    uniforms?: string;
    varyings?: string;
    functions?: string;
    code?: string;
    variables?: string;
  }

  export const vertex = ({ uniforms, varyings, functions, parameters, code, variables }: Vertex): string => `
${Signature}
${block('uniforms', uniforms)}
${block('varyings', varyings)}
var<private> vertex: ${Inbuilt.Struct.Vertex};
${block('functions', functions)}
@vertex
fn main(${parameters}) -> ${Inbuilt.Struct.Vertex} {
  ${block('variables', variables)}
  ${block('code', code)}
	return vertex;
}
`;

  export interface Fragment {
    parameters?: string;
    structures?: string;
    functions?: string;
    uniforms?: string;
    code?: string;
    variables?: string;
    return?: string;
  }

  export const fragment = ({
    parameters,
    uniforms,
    structures,
    functions,
    code,
    variables,
    return: returnType,
  }: Fragment): string => `
${Signature}
${block('uniforms', uniforms)}
${block('structures', structures)}
${block('functions', functions)}
@fragment
fn main(${parameters}) -> ${returnType} {
  ${block('variables', variables)}
  ${block('code', code)}
}
`;

  export interface Struct {
    name: string;
    members: string;
  }

  export const struct = ({ name, members }: Struct): string => `
struct ${name} {
${members}
};
`;

  export interface StructBinding {
    name: string;
    members: string;
    access: string;
    binding?: string | number;
    group?: string | number;
  }

  export const structBinding = ({ name, members, access, binding = 0, group = 0 }: StructBinding): string => `
${Snippet.struct({ name: name + 'Struct', members })}
@binding(${binding}) @group(${group})
var<${access}> ${name}: ${name}Struct;
`;
}

namespace Inbuilt {
  export enum Struct {
    Vertex = 'VertexStruct',
    Output = 'OutputStruct',
  }
}

const formatAsFloat = (value: number): string => value + (value % 1 ? '' : '.0');

const UniformsGroup = new ChainMap();
const TypeByLength = new Map<number, TypeName>([
  [2, TypeName.vec2],
  [3, TypeName.vec3],
  [4, TypeName.vec4],
  [9, TypeName.mat3],
  [16, TypeName.mat4],
]);
const TypeByArray = new Map<TypedArrayConstructor, TypeName>([
  [Int8Array, TypeName.i32],
  [Int16Array, TypeName.i32],
  [Int32Array, TypeName.i32],
  [Uint8Array, TypeName.u32],
  [Uint16Array, TypeName.u32],
  [Uint32Array, TypeName.u32],
  [Float32Array, TypeName.f32],
]);
const GpuShaderStage: Record<ShaderStage, number> = {
  vertex: GPUShaderStage.VERTEX,
  fragment: GPUShaderStage.FRAGMENT,
  compute: GPUShaderStage.COMPUTE,
};
