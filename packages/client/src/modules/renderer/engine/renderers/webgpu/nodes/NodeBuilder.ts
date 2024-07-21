import {
  BufferGeometry,
  Color,
  ColorSpace,
  Float16BufferAttribute,
  Material,
  Object3D,
  RenderTarget,
  Revision,
  Scene,
  TextureDataType,
  Vec2,
  Vec3,
  Vec4,
} from '../../../engine.js';
import NodeUniformsGroup from '../../common/nodes/NodeUniformsGroup.ts';
import NodeSampler from '../../common/nodes/NodeSampler.ts';
import { NodeSampledCubeTexture, NodeSampledTexture } from '../../common/nodes/NodeSampledTexture.ts';
import NodeUniformBuffer from '../../common/nodes/NodeUniformBuffer.ts';
import NodeStorageBuffer from '../../common/nodes/NodeStorageBuffer.ts';
import {
  buildStages,
  CodeNode,
  LightsNode,
  Node,
  NodeMaterial,
  NodeStack,
  NodeUpdateType,
  shaderStages,
  stack,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { getFormat } from '../utils/BackendTextures.ts';
import WGSLNodeParser from './WGSLNodeParser.js';
import ChainMap from '@modules/renderer/engine/renderers/common/ChainMap.js';
import NodeKeywords from '@modules/renderer/engine/nodes/core/NodeKeywords.js';
import NodeCache from '@modules/renderer/engine/nodes/core/NodeCache.js';
import PMREMGenerator from '@modules/renderer/engine/renderers/common/extras/PMREMGenerator.js';
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
  ValueNodeUniform,
  Vec2NodeUniform,
  Vec3NodeUniform,
  Vec4NodeUniform,
} from '@modules/renderer/engine/renderers/common/nodes/NodeUniform.js';
import { NodeMaterials } from '@modules/renderer/engine/nodes/materials/NodeMaterialMap.js';
import { FeatureName, FeatureSupportMap } from '@modules/renderer/engine/renderers/webgpu/nodes/FeatureSupportMap.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import StackNode from '@modules/renderer/engine/nodes/core/StackNode.js';
import EnvironmentNode from '@modules/renderer/engine/nodes/lighting/EnvironmentNode.js';
import FogNode from '@modules/renderer/engine/nodes/fog/FogNode.js';
import ToneMappingNode from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import ClippingContext from '@modules/renderer/engine/renderers/common/ClippingContext.js';
import { TypedArrayConstructor } from '@modules/renderer/engine/math/MathUtils.js';

const Signature = `// @mimi/engine r${Revision}`;

namespace Snippet {}

export class NodeBuilder {
  material: Material | null;
  geometry: BufferGeometry | null;

  parser: WGSLNodeParser;

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
  structs: Record<ShaderStage, NodeUniformsGroup[]> & { index: number };
  bindings: Record<ShaderStage, NodeUniformsGroup[]>;
  bindingsOffset: Record<ShaderStage, number>;
  bindingsArray: NodeUniformsGroup[];
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
  tab: string;
  currentFunctionNode: FunctionNode | null;
  context: {
    keywords: NodeKeywords;
    material: Material | null;
  };
  cache: NodeCache;
  globalCache: NodeCache;
  flowsData: WeakMap<Node, any>;
  shaderStage: ShaderStage;
  buildStage: BuildStage;
  uniformGroups: Record<ShaderStage, Record<string, NodeUniformsGroup>>;
  builtins: Record<BuiltinType, Map<string, { name: string; property: string; type: string }>>;

  constructor(
    public object: Object3D,
    public renderer: Renderer,
    public scene: Scene,
  ) {
    this.material = object?.material ?? null;
    this.geometry = object?.geometry ?? null;
    this.parser = new WGSLNodeParser();

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
    this.tab = '\t';

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
  }

  createRenderTarget(width: number, height: number, options?: RenderTarget.Options) {
    return new RenderTarget(width, height, options);
  }

  createPMREMGenerator() {
    // TODO: Move Materials.ts to outside of the Nodes.ts in order to remove this function and improve tree-shaking support

    return new PMREMGenerator(this.renderer);
  }

  includes(node: Node): boolean {
    return this.nodes.includes(node);
  }

  _getSharedBindings(bindings: NodeUniformsGroup[]): NodeUniformsGroup[] {
    const shared: NodeUniformsGroup[] = [];

    for (const binding of bindings) {
      if (binding.shared) {
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

  getBindings() {
    let array = this.bindingsArray;

    if (array === null) {
      const bindings = this.bindings;

      array = this._getSharedBindings(this.material ? [...bindings.vertex, ...bindings.fragment] : bindings.compute);

      this.bindingsArray = array;
    }

    return array;
  }

  setHashNode(node: Node, hash: string): void {
    this.hashNodes[hash] = node;
  }

  addNode(node: Node) {
    if (this.nodes.includes(node) === false) {
      this.nodes.push(node);

      this.setHashNode(node, node.getHash(this));
    }
  }

  buildUpdateNodes() {
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
    const chain = this.chaining.pop();

    if (chain !== node) throw Error('NodeBuilder: Invalid node chaining.');
  }

  getNodeFromHash(hash: string): Node {
    return this.hashNodes[hash];
  }

  addFlow(shaderStage: ShaderStage, node: Node): Node {
    this.flowNodes[shaderStage].push(node);
    return node;
  }

  setContext(context: any) {
    this.context = context;
  }

  getContext() {
    return this.context;
  }

  setCache(cache: any) {
    this.cache = cache;
  }

  getCache() {
    return this.cache;
  }

  generateConst(type, value = null) {
    if (value === null) {
      if (type === 'float' || type === 'int' || type === 'uint') value = 0;
      else if (type === 'bool') value = false;
      else if (type === 'color') value = new Color();
      else if (type === 'vec2') value = new Vec2();
      else if (type === 'vec3') value = new Vec3();
      else if (type === 'vec4') value = new Vec4();
    }

    if (type === 'float') return formatAsFloat(value);

    if (type === 'int') return `${Math.round(value)}`;

    if (type === 'uint') return value >= 0 ? `${Math.round(value)}u` : '0u';

    if (type === 'bool') return value ? 'true' : 'false';

    if (type === 'color')
      return `${this.getType('vec3')}( ${formatAsFloat(value.r)}, ${formatAsFloat(value.g)}, ${formatAsFloat(value.b)} )`;

    const typeLength = this.getTypeLength(type);

    const componentType = this.getComponentType(type);

    const generateConst = value => this.generateConst(componentType, value);

    if (typeLength === 2) {
      return `${this.getType(type)}( ${generateConst(value.x)}, ${generateConst(value.y)} )`;
    } else if (typeLength === 3) {
      return `${this.getType(type)}( ${generateConst(value.x)}, ${generateConst(value.y)}, ${generateConst(value.z)} )`;
    } else if (typeLength === 4) {
      return `${this.getType(type)}( ${generateConst(value.x)}, ${generateConst(value.y)}, ${generateConst(value.z)}, ${generateConst(value.w)} )`;
    } else if (typeLength > 4 && value && (value.isMat3 || value.isMat4)) {
      return `${this.getType(type)}( ${value.elements.map(generateConst).join(', ')} )`;
    } else if (typeLength > 4) {
      return `${this.getType(type)}()`;
    }

    throw new Error(`NodeBuilder: Type '${type}' not found in generate constant attempt.`);
  }

  generateMethod(method) {
    return method;
  }

  hasGeometryAttribute(name) {
    return this.geometry && this.geometry.getAttribute(name) !== undefined;
  }

  getAttribute(name, type) {
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

  isVector(type) {
    return type === 'vec2' || type === 'vec3' || type === 'vec4';
  }

  isMatrix(type) {
    return type === 'mat3' || type === 'mat4';
  }

  getTextureColorSpaceFromMap(map) {
    let colorSpace;

    if (map && map.isTexture) {
      colorSpace = map.colorSpace;
    } else {
      colorSpace = ColorSpace.No;
    }

    return colorSpace;
  }

  getComponentType(type) {
    type = this.getVectorType(type);

    if (type === 'float' || type === 'bool' || type === 'int' || type === 'uint') return type;

    const componentType = /(b|i|u|)(vec|mat)([2-4])/.exec(type);

    if (componentType === null) return null;

    if (componentType[1] === 'b') return 'bool';
    if (componentType[1] === 'i') return 'int';
    if (componentType[1] === 'u') return 'uint';

    return 'float';
  }

  getVectorType(type) {
    if (type === 'color') return 'vec3';
    if (type === 'texture' || type === 'cubeTexture' || type === 'storageTexture') return 'vec4';

    return type;
  }

  getTypeFromLength(length, componentType = 'float') {
    if (length === 1) return componentType;

    const baseType = TypeByLength.get(length);
    const prefix = componentType === 'float' ? '' : componentType[0];

    return prefix + baseType;
  }

  getTypeFromArray(array) {
    return TypeByArray.get(array.constructor);
  }

  getTypeFromAttribute(attribute) {
    let dataAttribute = attribute;

    if (attribute.isInterleavedBufferAttribute) dataAttribute = attribute.data;

    const array = dataAttribute.array;
    const itemSize = attribute.itemSize;
    const normalized = attribute.normalized;

    let arrayType;

    if (!(attribute instanceof Float16BufferAttribute) && normalized !== true) {
      arrayType = this.getTypeFromArray(array);
    }

    return this.getTypeFromLength(itemSize, arrayType);
  }

  getTypeLength(type) {
    const vecType = this.getVectorType(type);
    const vecNum = /vec([2-4])/.exec(vecType);

    if (vecNum !== null) return Number(vecNum[1]);
    if (vecType === 'float' || vecType === 'bool' || vecType === 'int' || vecType === 'uint') return 1;
    if (/mat2/.test(type) === true) return 4;
    if (/mat3/.test(type) === true) return 9;
    if (/mat4/.test(type) === true) return 16;

    return 0;
  }

  getVectorFromMatrix(type) {
    return type.replace('mat', 'vec');
  }

  changeComponentType(type, newComponentType) {
    return this.getTypeFromLength(this.getTypeLength(type), newComponentType);
  }

  getIntegerType(type) {
    const componentType = this.getComponentType(type);

    if (componentType === 'int' || componentType === 'uint') return type;

    return this.changeComponentType(type, 'int');
  }

  addStack() {
    this.stack = stack(this.stack);

    this.stacks.push(NodeStack.get() || this.stack);
    NodeStack.set(this.stack);

    return this.stack;
  }

  removeStack() {
    const lastStack = this.stack;
    this.stack = lastStack.parent;

    NodeStack.set(this.stacks.pop());

    return lastStack;
  }

  getDataFromNode(node, shaderStage: ShaderStage | null = this.shaderStage, cache = null) {
    cache = cache === null ? (node.isGlobal(this) ? this.globalCache : this.cache) : cache;

    let nodeData = cache.getNodeData(node);

    if (nodeData === undefined) {
      nodeData = {};

      cache.setNodeData(node, nodeData);
    }

    if (nodeData[shaderStage] === undefined) nodeData[shaderStage] = {};

    return nodeData[shaderStage];
  }

  getNodeProperties(node, shaderStage: ShaderStage | null = null) {
    const nodeData = this.getDataFromNode(node, shaderStage);

    return nodeData.properties || (nodeData.properties = { outputNode: null });
  }

  getBufferAttributeFromNode(node, type) {
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

  getStructTypeFromNode(node, shaderStage: ShaderStage = this.shaderStage) {
    const nodeData = this.getDataFromNode(node, shaderStage);

    if (nodeData.structType === undefined) {
      const index = this.structs.index++;

      node.name = `StructType${index}`;
      this.structs[shaderStage].push(node);

      nodeData.structType = node;
    }

    return node;
  }

  getVarFromNode(node, name = null, type = node.getNodeType(this), shaderStage = this.shaderStage) {
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

  getVaryingFromNode(node, name = null, type = node.getNodeType(this)) {
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

  getCodeFromNode(node, type, shaderStage: ShaderStage = this.shaderStage) {
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

    code = this.tab + code;

    if (!/;\s*$/.test(code)) {
      code = code + ';\n';
    }

    this.flow.code += code;

    return this;
  }

  addFlowCode(code) {
    this.flow.code += code;

    return this;
  }

  addFlowTab() {
    this.tab += '\t';

    return this;
  }

  removeFlowTab() {
    this.tab = this.tab.slice(0, -1);

    return this;
  }

  getFlowData(node: Node) {
    return this.flowsData.get(node);
  }

  flowNode(node: Node) {
    const output = node.getNodeType(this);

    const flowData = this.flowChildNode(node, output);

    this.flowsData.set(node, flowData);

    return flowData;
  }

  buildFunctionNode(shaderNode: Node) {
    const fn = new FunctionNode();

    const previous = this.currentFunctionNode;

    this.currentFunctionNode = fn;

    fn.code = this.buildFunctionCode(shaderNode);

    this.currentFunctionNode = previous;

    return fn;
  }

  flowShaderNode(shaderNode) {
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

  flowStagesNode(node, output = null) {
    const previousFlow = this.flow;
    const previousVars = this.vars;
    const previousBuildStage = this.buildStage;

    const flow = {
      code: '',
    };

    this.flow = flow;
    this.vars = {};

    for (const buildStage of buildStages) {
      this.setBuildStage(buildStage);

      flow.result = node.build(this, output);
    }

    flow.vars = this.getVars(this.shaderStage);

    this.flow = previousFlow;
    this.vars = previousVars;
    this.setBuildStage(previousBuildStage);

    return flow;
  }

  flowChildNode(node, output = null) {
    const previousFlow = this.flow;

    const flow = {
      code: '',
    };

    this.flow = flow;

    flow.result = node.build(this, output);

    this.flow = previousFlow;

    return flow;
  }

  flowNodeFromShaderStage(shaderStage, node, output = null, propertyName = null) {
    const previousShaderStage = this.shaderStage;

    this.setShaderStage(shaderStage);

    const flowData = this.flowChildNode(node, output);

    if (propertyName !== null) {
      flowData.code += `${this.tab + propertyName} = ${flowData.result};\n`;
    }

    this.flowCode[shaderStage] = this.flowCode[shaderStage] + flowData.code;

    this.setShaderStage(previousShaderStage);

    return flowData;
  }

  getAttributesArray() {
    return this.attributes.concat(this.bufferAttributes);
  }

  getCodes(shaderStage) {
    const codes = this.codes[shaderStage];

    let code = '';

    if (codes !== undefined) {
      for (const nodeCode of codes) {
        code += nodeCode.code + '\n';
      }
    }

    return code;
  }

  getHash() {
    return this.vertexShader + this.fragmentShader + this.computeShader;
  }

  setShaderStage(shaderStage) {
    this.shaderStage = shaderStage;
  }

  getShaderStage() {
    return this.shaderStage;
  }

  setBuildStage(buildStage) {
    this.buildStage = buildStage;
  }

  getBuildStage() {
    return this.buildStage;
  }

  build(convertMaterial = true) {
    const { object, material } = this;

    if (convertMaterial) {
      if (material !== null) {
        NodeMaterial.fromMaterial(material).build(this);
      } else {
        this.addFlow('compute', object);
      }
    }

    // setup() -> stage 1: create possible new nodes and returns an output reference node
    // analyze()   -> stage 2: analyze nodes to possible optimization and validation
    // generate()  -> stage 3: generate shader

    for (const buildStage of buildStages) {
      this.setBuildStage(buildStage);

      if (this.context.vertex && this.context.vertex.isNode) {
        this.flowNodeFromShaderStage('vertex', this.context.vertex);
      }

      for (const shaderStage of shaderStages) {
        this.setShaderStage(shaderStage);

        const flowNodes = this.flowNodes[shaderStage];

        for (const node of flowNodes) {
          if (buildStage === 'generate') {
            this.flowNode(node);
          } else {
            node.build(this);
          }
        }
      }
    }

    this.setBuildStage(null);
    this.setShaderStage(null);

    // stage 4: build code for a specific output

    this.buildCode();
    this.buildUpdateNodes();

    return this;
  }

  getNodeUniform(uniformNode, type) {
    if (type === 'float') return new FloatNodeUniform(uniformNode);
    if (type === 'vec2') return new Vec2NodeUniform(uniformNode);
    if (type === 'vec3') return new Vec3NodeUniform(uniformNode);
    if (type === 'vec4') return new Vec4NodeUniform(uniformNode);
    if (type === 'color') return new ColorNodeUniform(uniformNode);
    if (type === 'mat3') return new Mat3NodeUniform(uniformNode);
    if (type === 'mat4') return new Mat4NodeUniform(uniformNode);

    throw new Error(`Uniform "${type}" not declared.`);
  }

  createNodeMaterial(type = 'NodeMaterial') {
    return new (NodeMaterials.get(type))();
  }

  format(snippet, fromType, toType) {
    fromType = this.getVectorType(fromType);
    toType = this.getVectorType(toType);

    if (fromType === toType || toType === null || this.isReference(toType)) {
      return snippet;
    }

    const fromTypeLength = this.getTypeLength(fromType);
    const toTypeLength = this.getTypeLength(toType);

    if (fromTypeLength > 4) {
      // fromType is matrix-like

      // @TODO: ignore for now

      return snippet;
    }

    if (toTypeLength > 4 || toTypeLength === 0) {
      // toType is matrix-like or unknown

      // @TODO: ignore for now

      return snippet;
    }

    if (fromTypeLength === toTypeLength) {
      return `${this.getType(toType)}( ${snippet} )`;
    }

    if (fromTypeLength > toTypeLength) {
      return this.format(
        `${snippet}.${'xyz'.slice(0, toTypeLength)}`,
        this.getTypeFromLength(toTypeLength, this.getComponentType(fromType)),
        toType,
      );
    }

    if (toTypeLength === 4 && fromTypeLength > 1) {
      // toType is vec4-like

      return `${this.getType(toType)}( ${this.format(snippet, fromType, 'vec3')}, 1.0 )`;
    }

    if (fromTypeLength === 2) {
      // fromType is vec2-like and toType is vec3-like

      return `${this.getType(toType)}( ${this.format(snippet, fromType, 'vec2')}, 0.0 )`;
    }

    if (fromTypeLength === 1 && toTypeLength > 1 && fromType[0] !== toType[0]) {
      // fromType is float-like

      // convert a number value to vector type, e.g:
      // vec3( 1u ) -> vec3( float( 1u ) )

      snippet = `${this.getType(this.getComponentType(toType))}( ${snippet} )`;
    }

    return `${this.getType(toType)}( ${snippet} )`; // fromType is float-like
  }

  needsColorSpaceToLinear(texture) {
    return texture.isVideoTexture === true && texture.colorSpace !== ColorSpace.No;
  }

  _generateTextureSample(texture, textureProperty, uvSnippet, depthSnippet, shaderStage = this.shaderStage) {
    if (shaderStage === 'fragment') {
      if (depthSnippet) {
        return `textureSample( ${textureProperty}, ${textureProperty}_sampler, ${uvSnippet}, ${depthSnippet} )`;
      } else {
        return `textureSample( ${textureProperty}, ${textureProperty}_sampler, ${uvSnippet} )`;
      }
    } else {
      return this.generateTextureLod(texture, textureProperty, uvSnippet);
    }
  }

  _generateVideoSample(textureProperty, uvSnippet, shaderStage = this.shaderStage) {
    if (shaderStage === 'fragment') {
      return `textureSampleBaseClampToEdge( ${textureProperty}, ${textureProperty}_sampler, vec2<f32>( ${uvSnippet}.x, 1.0 - ${uvSnippet}.y ) )`;
    } else {
      console.error(`WebGPURenderer: engine.VideoTexture does not support ${shaderStage} shader.`);
    }
  }

  _generateTextureSampleLevel(
    texture,
    textureProperty,
    uvSnippet,
    levelSnippet,
    depthSnippet,
    shaderStage = this.shaderStage,
  ) {
    if (shaderStage === 'fragment' && this.isUnfilterable(texture) === false) {
      return `textureSampleLevel( ${textureProperty}, ${textureProperty}_sampler, ${uvSnippet}, ${levelSnippet} )`;
    } else {
      return this.generateTextureLod(texture, textureProperty, uvSnippet, levelSnippet);
    }
  }

  generateTextureLod(texture, textureProperty, uvSnippet, levelSnippet = '0') {
    this._include('repeatWrapping');

    const dimension = `textureDimensions( ${textureProperty}, 0 )`;

    return `textureLoad( ${textureProperty}, engine_repeatWrapping( ${uvSnippet}, ${dimension} ), i32( ${levelSnippet} ) )`;
  }

  generateTextureLoad(texture, textureProperty, uvIndexSnippet, depthSnippet, levelSnippet = '0u') {
    if (depthSnippet) {
      return `textureLoad( ${textureProperty}, ${uvIndexSnippet}, ${depthSnippet}, ${levelSnippet} )`;
    } else {
      return `textureLoad( ${textureProperty}, ${uvIndexSnippet}, ${levelSnippet} )`;
    }
  }

  generateTextureStore(texture, textureProperty, uvIndexSnippet, valueSnippet) {
    return `textureStore( ${textureProperty}, ${uvIndexSnippet}, ${valueSnippet} )`;
  }

  isUnfilterable(texture) {
    return texture.isDataTexture === true && texture.type === TextureDataType.Float;
  }

  generateTexture(texture, textureProperty, uvSnippet, depthSnippet, shaderStage = this.shaderStage) {
    let snippet = null;

    if (texture.isVideoTexture === true) {
      snippet = this._generateVideoSample(textureProperty, uvSnippet, shaderStage);
    } else if (this.isUnfilterable(texture)) {
      snippet = this.generateTextureLod(texture, textureProperty, uvSnippet, '0', depthSnippet, shaderStage);
    } else {
      snippet = this._generateTextureSample(texture, textureProperty, uvSnippet, depthSnippet, shaderStage);
    }

    return snippet;
  }

  generateTextureCompare(
    texture,
    textureProperty,
    uvSnippet,
    compareSnippet,
    depthSnippet,
    shaderStage = this.shaderStage,
  ) {
    if (shaderStage === 'fragment') {
      return `textureSampleCompare( ${textureProperty}, ${textureProperty}_sampler, ${uvSnippet}, ${compareSnippet} )`;
    } else {
      console.error(`WebGPURenderer: engine.DepthTexture.compareFunction() does not support ${shaderStage} shader.`);
    }
  }

  generateTextureLevel(
    texture,
    textureProperty,
    uvSnippet,
    levelSnippet,
    depthSnippet,
    shaderStage = this.shaderStage,
  ) {
    let snippet = null;

    if (texture.isVideoTexture === true) {
      snippet = this._generateVideoSample(textureProperty, uvSnippet, shaderStage);
    } else {
      snippet = this._generateTextureSampleLevel(
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

  getPropertyName(node, shaderStage = this.shaderStage) {
    if (node.isNodeVarying === true && node.needsInterpolation === true) {
      if (shaderStage === 'vertex') {
        return `varyings.${node.name}`;
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

  _getUniformGroupCount(shaderStage) {
    return Object.keys(this.uniforms[shaderStage]).length;
  }

  getFunctionOperator(op) {
    const fnOp = FnOpMap[op];

    if (fnOp) {
      this._include(fnOp);
      return fnOp;
    }

    return null;
  }

  getUniformFromNode(node, type, shaderStage: ShaderStage, name: string | null = null) {
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

        if (shaderStage === 'fragment' && this.isUnfilterable(node.value) === false && texture.store === false) {
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

      if (shaderStage === 'vertex') {
        this.bindingsOffset['fragment'] = bindings.length;
      }
    }

    return uniformNode;
  }

  isReference(type) {
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

  getBuiltin(name: string, property: string, type: string, builtin: BuiltinType) {
    const map = this.builtins[builtin];

    if (!map.has(name)) map.set(name, { name, property, type });

    return property;
  }

  getVertexIndex(): string {
    if (this.shaderStage === 'vertex') {
      return this.getBuiltin('vertex_index', 'vertexIndex', 'u32', BuiltinType.Attribute);
    }

    return 'vertexIndex';
  }

  buildFunctionCode(shaderNode) {
    const layout = shaderNode.layout;
    const flowData = this.flowShaderNode(shaderNode);

    const parameters = [];

    for (const input of layout.inputs) {
      parameters.push(input.name + ' : ' + this.getType(input.type));
    }

    //

    const code = `fn ${layout.name}( ${parameters.join(', ')} ) -> ${this.getType(layout.type)} {
${flowData.vars}
${flowData.code}
	return ${flowData.result};

}`;

    //

    return code;
  }

  getInstanceIndex(): string {
    if (this.shaderStage === 'vertex') {
      return this.getBuiltin('instance_index', 'instanceIndex', 'u32', BuiltinType.Attribute);
    }

    return 'instanceIndex';
  }

  getFrontFacing(): string {
    return this.getBuiltin('front_facing', 'isFront', 'bool', BuiltinType.Fragment);
  }

  getFragCoord(): string {
    return this.getBuiltin('position', 'fragCoord', 'vec4<f32>', BuiltinType.Fragment) + '.xy';
  }

  getFragDepth(): string {
    return 'output.' + this.getBuiltin('frag_depth', 'depth', 'f32', BuiltinType.Output);
  }

  isFlipY(): boolean {
    return false;
  }

  getBuiltins(shaderStage: BuiltinType) {
    const snippets = [];
    const builtins = this.builtins[shaderStage];

    if (builtins !== undefined) {
      for (const { name, property, type } of builtins.values()) {
        snippets.push(`@builtin( ${name} ) ${property} : ${type}`);
      }
    }

    return snippets.join(',\n\t');
  }

  getAttributes(shaderStage: ShaderStage) {
    const snippets = [];

    if (shaderStage === 'compute') {
      this.getBuiltin('global_invocation_id', 'id', 'vec3<u32>', BuiltinType.Attribute);
    }

    if (shaderStage === 'vertex' || shaderStage === 'compute') {
      const builtins = this.getBuiltins(BuiltinType.Attribute);

      if (builtins) snippets.push(builtins);

      const attributes = this.getAttributesArray();

      for (let index = 0, length = attributes.length; index < length; index++) {
        const attribute = attributes[index];
        const name = attribute.name;
        const type = this.getType(attribute.type);

        snippets.push(`@location( ${index} ) ${name} : ${type}`);
      }
    }

    return snippets.join(',\n\t');
  }

  getStructMembers(struct) {
    const snippets = [];
    const members = struct.getMemberTypes();

    for (let i = 0; i < members.length; ++i) {
      snippets.push(`\t@location(${i}) m${i}: ${members[i]}<f32>`);
    }

    return snippets.join(',\n');
  }

  getStructs(shaderStage: ShaderStage): string {
    const snippets = [];
    const structs = this.structs[shaderStage];

    for (let struct of structs) {
      snippets.push(`
struct ${struct.name} {
  ${this.getStructMembers(struct)}
}
`);
    }

    return snippets.join('\n\n');
  }

  getVar(type, name) {
    return `var ${name} : ${this.getType(type)}`;
  }

  getVars(shaderStage: ShaderStage) {
    const snippets = [];
    const vars = this.vars[shaderStage];

    if (vars !== undefined) {
      for (const variable of vars) {
        snippets.push(`\t${this.getVar(variable.type, variable.name)};`);
      }
    }

    return `\n${snippets.join('\n')}\n`;
  }

  getVaryings(shaderStage: ShaderStage) {
    const snippets = [];

    if (shaderStage === 'vertex') {
      this.getBuiltin('position', 'Vertex', 'vec4<f32>', BuiltinType.Vertex);
    }

    if (shaderStage === 'vertex' || shaderStage === 'fragment') {
      const varyings = this.varyings;
      const vars = this.vars[shaderStage];

      for (let index = 0; index < varyings.length; index++) {
        const varying = varyings[index];

        if (varying.needsInterpolation) {
          let attributesSnippet = `@location( ${index} )`;

          if (/^(int|uint|ivec|uvec)/.test(varying.type)) {
            attributesSnippet += ' @interpolate( flat )';
          }

          snippets.push(`${attributesSnippet} ${varying.name} : ${this.getType(varying.type)}`);
        } else if (shaderStage === 'vertex' && vars.includes(varying) === false) {
          vars.push(varying);
        }
      }
    }

    const builtins = this.getBuiltins(shaderStage);

    if (builtins) snippets.push(builtins);

    const code = snippets.join(',\n\t');

    return shaderStage === 'vertex' ? this._getWGSLStruct('VaryingsStruct', '\t' + code) : code;
  }

  getUniforms(shaderStage: ShaderStage) {
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
          shaderStage === 'fragment' &&
          this.isUnfilterable(texture) === false &&
          uniform.node.isStoreTextureNode !== true
        ) {
          if (texture.isDepthTexture === true && texture.compareFunction !== null) {
            bindingSnippets.push(
              `@binding( ${index++} ) @group( 0 ) var ${uniform.name}_sampler : sampler_comparison;`,
            );
          } else {
            bindingSnippets.push(`@binding( ${index++} ) @group( 0 ) var ${uniform.name}_sampler : sampler;`);
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

        bindingSnippets.push(`@binding( ${index++} ) @group( 0 ) var ${uniform.name} : ${textureType};`);
      } else if (uniform.type === 'buffer' || uniform.type === 'storageBuffer') {
        const bufferNode = uniform.node;
        const bufferType = this.getType(bufferNode.bufferType);
        const bufferCount = bufferNode.bufferCount;

        const bufferCountSnippet = bufferCount > 0 ? ', ' + bufferCount : '';
        const bufferSnippet = `\t${uniform.name} : array< ${bufferType}${bufferCountSnippet} >\n`;
        const bufferAccessMode = bufferNode.isStorageBufferNode ? 'storage,read_write' : 'uniform';

        bufferSnippets.push(
          this._getWGSLStructBinding('NodeBuffer_' + bufferNode.id, bufferSnippet, bufferAccessMode, index++),
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

        group.snippets.push(`\t${uniform.name} : ${vectorType}`);
      }
    }

    for (const name in uniformGroups) {
      const group = uniformGroups[name];

      structSnippets.push(this._getWGSLStructBinding(name, group.snippets.join(',\n'), 'uniform', group.index));
    }

    let code = bindingSnippets.join('\n');
    code += bufferSnippets.join('\n');
    code += structSnippets.join('\n');

    return code;
  }

  buildCode() {
    const shadersData = this.material ? { fragment: {}, vertex: {} } : { compute: {} };

    for (const stage in shadersData) {
      const stageData = shadersData[stage];
      stageData.uniforms = this.getUniforms(stage);
      stageData.attributes = this.getAttributes(stage);
      stageData.varyings = this.getVaryings(stage);
      stageData.structs = this.getStructs(stage);
      stageData.vars = this.getVars(stage);
      stageData.codes = this.getCodes(stage);

      //

      let flow = '// code\n\n';
      flow += this.flowCode[stage];

      const flowNodes = this.flowNodes[stage];
      const mainNode = flowNodes[flowNodes.length - 1];

      const outputNode = mainNode.outputNode;
      const isOutputStruct = outputNode !== undefined && outputNode.isOutputStructNode === true;

      for (const node of flowNodes) {
        const flowSlotData = this.getFlowData(node);
        const slotName = node.name;

        if (slotName) {
          if (flow.length > 0) flow += '\n';

          flow += `\t// flow -> ${slotName}\n\t`;
        }

        flow += `${flowSlotData.code}\n\t`;

        if (node === mainNode && stage !== 'compute') {
          flow += '// result\n\n\t';

          if (stage === 'vertex') {
            flow += `varyings.Vertex = ${flowSlotData.result};`;
          } else if (stage === 'fragment') {
            if (isOutputStruct) {
              stageData.returnType = outputNode.nodeType;

              flow += `return ${flowSlotData.result};`;
            } else {
              let structSnippet = '\t@location(0) color: vec4<f32>';

              const builtins = this.getBuiltins(BuiltinType.Output);

              if (builtins) structSnippet += ',\n\t' + builtins;

              stageData.returnType = 'OutputStruct';
              stageData.structs += this._getWGSLStruct('OutputStruct', structSnippet);
              stageData.structs += '\nvar<private> output : OutputStruct;\n\n';

              flow += `output.color = ${flowSlotData.result};\n\n\treturn output;`;
            }
          }
        }
      }

      stageData.flow = flow;
    }

    if (this.material) {
      this.vertexShader = this._getWGSLVertexCode(shadersData.vertex);
      this.fragmentShader = this._getWGSLFragmentCode(shadersData.fragment);
    } else {
      this.computeShader = this._getWGSLComputeCode(
        shadersData.compute,
        this.object.workgroupSize ? this.object.workgroupSize.join(', ') : '64',
      );
    }
  }

  getMethod(method, output = null) {
    let wgslMethod;

    if (output !== null) {
      wgslMethod = this._getWGSLMethod(method + '_' + output);
    }

    if (wgslMethod === undefined) {
      wgslMethod = this._getWGSLMethod(method);
    }

    return wgslMethod || method;
  }

  getType(type: keyof typeof VarType): VarType {
    return VarType[type];
  }

  isAvailable(name: FeatureName): boolean {
    return FeatureSupportMap.has(name);
  }

  _getWGSLMethod(method) {
    if (PolyfillMap[method] !== undefined) {
      this._include(method);
    }

    return MethodMap[method];
  }

  _include(name) {
    const codeNode = PolyfillMap[name];
    codeNode.build(this);

    if (this.currentFunctionNode !== null) {
      this.currentFunctionNode.includes.push(codeNode);
    }

    return codeNode;
  }

  _getWGSLVertexCode(shaderData) {
    return `
${Signature}

// uniforms
${shaderData.uniforms}

// varyings
${shaderData.varyings}
var<private> varyings : VaryingsStruct;

// codes
${shaderData.codes}

@vertex
fn main(${shaderData.attributes}) -> VaryingsStruct {
	// vars
	${shaderData.vars}

	// flow
	${shaderData.flow}

	return varyings;
}
`;
  }

  _getWGSLFragmentCode(shaderData) {
    return `
${Signature}

// uniforms
${shaderData.uniforms}

// structs
${shaderData.structs}

// codes
${shaderData.codes}

@fragment
fn main(${shaderData.varyings}) -> ${shaderData.returnType} {
	// vars
	${shaderData.vars}

	// flow
	${shaderData.flow}
}
`;
  }

  _getWGSLComputeCode(shaderData, workgroupSize) {
    return `
${Signature}

// system
var<private> instanceIndex : u32;

// uniforms
${shaderData.uniforms}

// codes
${shaderData.codes}

@compute @workgroup_size( ${workgroupSize} )
fn main( ${shaderData.attributes} ) {
	// system
	instanceIndex = id.x;

	// vars
	${shaderData.vars}

	// flow
	${shaderData.flow}
}
`;
  }

  _getWGSLStruct(name: string, vars) {
    return `
struct ${name} {
${vars}
};`;
  }

  _getWGSLStructBinding(name: string, vars, access, binding = 0, group = 0) {
    const structName = name + 'Struct';
    const structSnippet = this._getWGSLStruct(structName, vars);

    return `
${structSnippet}
@binding(${binding}) @group(${group})
var<${access}> ${name}: ${structName};
`;
  }
}

export enum ShaderStage {
  Vertex = 'vertex',
  Fragment = 'fragment',
  Compute = 'compute',
}

export enum BuildStage {
  Construct = 'construct',
  Analyze = 'analyze',
  Generate = 'generate',
}

export enum BuiltinType {
  Attribute = 'attribute',
  Output = 'output',
  Vertex = 'vertex',
  Compute = 'compute',
  Fragment = 'fragment',
}

export enum VarType {
  float = 'f32',
  int = 'i32',
  uint = 'u32',
  bool = 'bool',
  color = 'vec3<f32>',

  vec2 = 'vec2<f32>',
  ivec2 = 'vec2<i32>',
  uvec2 = 'vec2<u32>',
  bvec2 = 'vec2<bool>',

  vec3 = 'vec3<f32>',
  ivec3 = 'vec3<i32>',
  uvec3 = 'vec3<u32>',
  bvec3 = 'vec3<bool>',

  vec4 = 'vec4<f32>',
  ivec4 = 'vec4<i32>',
  uvec4 = 'vec4<u32>',
  bvec4 = 'vec4<bool>',

  mat2 = 'mat2x2<f32>',
  imat2 = 'mat2x2<i32>',
  umat2 = 'mat2x2<u32>',
  bmat2 = 'mat2x2<bool>',

  mat3 = 'mat3x3<f32>',
  imat3 = 'mat3x3<i32>',
  umat3 = 'mat3x3<u32>',
  bmat3 = 'mat3x3<bool>',

  mat4 = 'mat4x4<f32>',
  imat4 = 'mat4x4<i32>',
  umat4 = 'mat4x4<u32>',
  bmat4 = 'mat4x4<bool>',
}

const formatAsFloat = (value: number): string => value + (value % 1 ? '' : '.0');

const UniformsGroup = new ChainMap<ValueNodeUniform, NodeUniformsGroup>();
const TypeByLength = new Map<number, string>([
  [2, 'vec2'],
  [3, 'vec3'],
  [4, 'vec4'],
  [9, 'mat3'],
  [16, 'mat4'],
]);
const TypeByArray = new Map<TypedArrayConstructor, string>([
  [Int8Array, 'int'],
  [Int16Array, 'int'],
  [Int32Array, 'int'],
  [Uint8Array, 'uint'],
  [Uint16Array, 'uint'],
  [Uint32Array, 'uint'],
  [Float32Array, 'float'],
]);
const GpuShaderStage: Record<ShaderStage, number> = {
  vertex: GPUShaderStage.VERTEX,
  fragment: GPUShaderStage.FRAGMENT,
  compute: GPUShaderStage.COMPUTE,
};

const FnOpMap = {
  '^^': 'engine_xor',
};

const MethodMap = {
  dFdx: 'dpdx',
  dFdy: '- dpdy',
  mod_float: 'engine_mod_float',
  mod_vec2: 'engine_mod_vec2',
  mod_vec3: 'engine_mod_vec3',
  mod_vec4: 'engine_mod_vec4',
  equals_bool: 'engine_equals_bool',
  equals_bvec2: 'engine_equals_bvec2',
  equals_bvec3: 'engine_equals_bvec3',
  equals_bvec4: 'engine_equals_bvec4',
  lessThanEqual: 'engine_lessThanEqual',
  greaterThan: 'engine_greaterThan',
  inversesqrt: 'inverseSqrt',
  bitcast: 'bitcast<f32>',
};
const PolyfillMap = {
  engine_xor: new CodeNode(`
fn engine_xor(a : bool, b : bool) -> bool {
	return (a || b) && !(a && b);
}
`),
  lessThanEqual: new CodeNode(`
fn engine_lessThanEqual(a: vec3<f32>, b: vec3<f32>) -> vec3<bool> {
	return vec3<bool>(a.x <= b.x, a.y <= b.y, a.z <= b.z);
}
`),
  greaterThan: new CodeNode(`
fn engine_greaterThan(a: vec3<f32>, b: vec3<f32>) -> vec3<bool> {
	return vec3<bool>(a.x > b.x, a.y > b.y, a.z > b.z);
}
`),
  mod_float: new CodeNode(`
fn engine_mod_float(x: f32, y: f32) -> f32 {
 return x - y * floor(x / y); 
}
`),
  mod_vec2: new CodeNode('fn engine_mod_vec2( x : vec2f, y : vec2f ) -> vec2f { return x - y * floor( x / y ); }'),
  mod_vec3: new CodeNode('fn engine_mod_vec3( x : vec3f, y : vec3f ) -> vec3f { return x - y * floor( x / y ); }'),
  mod_vec4: new CodeNode('fn engine_mod_vec4( x : vec4f, y : vec4f ) -> vec4f { return x - y * floor( x / y ); }'),
  equals_bool: new CodeNode('fn engine_equals_bool( a : bool, b : bool ) -> bool { return a == b; }'),
  equals_bvec2: new CodeNode(
    'fn engine_equals_bvec2( a : vec2f, b : vec2f ) -> vec2<bool> { return vec2<bool>( a.x == b.x, a.y == b.y ); }',
  ),
  equals_bvec3: new CodeNode(
    'fn engine_equals_bvec3( a : vec3f, b : vec3f ) -> vec3<bool> { return vec3<bool>( a.x == b.x, a.y == b.y, a.z == b.z ); }',
  ),
  equals_bvec4: new CodeNode(
    'fn engine_equals_bvec4( a : vec4f, b : vec4f ) -> vec4<bool> { return vec4<bool>( a.x == b.x, a.y == b.y, a.z == b.z, a.w == b.w ); }',
  ),
  repeatWrapping: new CodeNode(`
fn engine_repeatWrapping( uv : vec2<f32>, dimension : vec2<u32> ) -> vec2<u32> {

	let uvScaled = vec2<u32>( uv * vec2<f32>( dimension ) );

	return ( ( uvScaled % dimension ) + dimension ) % dimension;

}
`),
};
