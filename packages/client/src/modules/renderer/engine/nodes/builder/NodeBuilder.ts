import {
  Color,
  Entity,
  Geometry,
  Material,
  RenderTarget,
  Revision,
  Scene,
  Texture,
  TextureDataType,
  Vec2,
  Vec3,
  Vec4,
} from '../../engine.js';
import {
  NodeSampledCubeTexture,
  NodeSampledTexture,
  NodeSampler,
  NodeStorageBuffer,
  NodeUniformBuffer,
  NodeUniformsGroup,
} from './NodeStorageBuffer.js';
import {
  LightsNode,
  NodeMaterial,
  NodeStack,
  NodeUpdateType,
  ShaderNode,
  stack,
  UniformNode,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { getFormat } from '@modules/renderer/engine/hearth/Backend.textures.js';
import ChainMap from '@modules/renderer/engine/hearth/ChainMap.js';
import NodeKeywords from '@modules/renderer/engine/nodes/core/NodeKeywords.js';
import NodeCache from '@modules/renderer/engine/nodes/core/NodeCache.js';
import NodeAttribute from '@modules/renderer/engine/nodes/core/NodeAttribute.js';
import Uniform from '@modules/renderer/engine/nodes/core/Uniform.js';
import NodeVar from '@modules/renderer/engine/nodes/core/NodeVar.js';
import NodeVarying from '@modules/renderer/engine/nodes/core/NodeVarying.js';
import NodeCode from '@modules/renderer/engine/nodes/core/NodeCode.js';
import FunctionNode from '@modules/renderer/engine/nodes/code/FunctionNode.js';
import ParameterNode from '@modules/renderer/engine/nodes/core/ParameterNode.js';

import { NodeMaterials } from '@modules/renderer/engine/nodes/materials/NodeMaterialMap.js';
import { FeatureMap, FeatureName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.features.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import StackNode from '@modules/renderer/engine/nodes/core/StackNode.js';
import EnvironmentNode from '@modules/renderer/engine/nodes/lighting/EnvironmentNode.js';
import FogNode from '@modules/renderer/engine/nodes/fog/FogNode.js';
import ToneMappingNode from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import ClippingContext from '@modules/renderer/engine/hearth/ClippingContext.js';
import { BuildStage, BuiltinType, ShaderStage, TypeName } from './NodeBuilder.types.js';
import { PolyfillMap, PolyfillName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.polyfills.js';
import StructTypeNode from '@modules/renderer/engine/nodes/core/StructTypeNode.js';
import { WgslFn } from '@modules/renderer/engine/nodes/builder/WgslFn.js';
import { BindingUniform } from '@modules/renderer/engine/hearth/bindings/BindingUniform.js';

type ParseFn = (source: string) => WgslFn;

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
    label?: string;
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
    public hearth: Hearth,
    public scene: Scene,
  ) {
    this.material = object?.material ?? null;
    this.geometry = object?.geometry ?? null;
    this.parseFn = (source: string) => new WgslFn(source);

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

      if (updateType !== NodeUpdateType.None) {
        this.updateNodes.push(node.getSelf());
      }

      if (updateBeforeType !== NodeUpdateType.None) {
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

  hasGeometryAttribute(name: string): boolean {
    return this.geometry?.getAttribute(name) !== undefined;
  }

  getAttribute(name: string, type: TypeName): NodeAttribute {
    const attributes = this.attributes;

    for (const attribute of attributes) {
      if (attribute.name === name) {
        return attribute;
      }
    }

    const attribute = new NodeAttribute(name, type);

    attributes.push(attribute);

    return attribute;
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

  addStack(): StackNode {
    this.stack = stack(this.stack);

    this.stacks.push(NodeStack.get() || this.stack);
    NodeStack.set(this.stack);

    return this.stack;
  }

  removeStack(): StackNode {
    const lastStack = this.stack;
    this.stack = lastStack.parent!;

    NodeStack.set(this.stacks.pop()!);

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

  generate(node: Node): void {
    this.flowsData.set(node, this.flowChildNode(node, node.getNodeType(this)));
  }

  buildFunctionNode(shaderNode: ShaderNode): FunctionNode {
    const fn = new FunctionNode();

    const previous = this.currentFunctionNode;

    this.currentFunctionNode = fn;

    fn.code = this.codeFunction(shaderNode);

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

  createBindingUniform<T>(uniform: Uniform<T>) {
    if (uniform.type === TypeName.f32) return new BindingUniform(uniform, 4, 1);
    if (uniform.type === TypeName.vec2) return new BindingUniform(uniform, 8, 2);
    if (uniform.type === TypeName.vec3) return new BindingUniform(uniform, 16, 3);
    if (uniform.type === TypeName.vec4) return new BindingUniform(uniform, 16, 4);
    if (uniform.type === TypeName.color) return new BindingUniform(uniform, 16, 3);
    if (uniform.type === TypeName.mat3) return new BindingUniform(uniform, 48, 12);
    if (uniform.type === TypeName.mat4) return new BindingUniform(uniform, 64, 16);
    throw new Error(`Uniform "${uniform.type}" not declared.`);
  }

  createNodeMaterial(type: string = 'NodeMaterial'): NodeMaterial {
    return new (NodeMaterials.get(type))();
  }

  format(snippet: string, from: TypeName, to: TypeName): string {
    from = TypeName.coerce(from);
    to = TypeName.coerce(to);

    if (from === to || to === null || this.isReference(to)) return snippet;

    const sizeFrom = TypeName.size(from);
    const sizeTo = TypeName.size(to);

    if (sizeFrom > 4) return snippet;
    if (sizeTo > 4 || sizeTo === 0) return snippet;
    if (sizeFrom === sizeTo) return `${TypeName.repr(to)}(${snippet})`;

    if (sizeFrom > sizeTo) {
      const sized = TypeName.ofSize(sizeTo, TypeName.component(from));

      switch (sizeTo) {
        case 0:
          return this.format(snippet, sized, to);
        case 1:
          return this.format(`${snippet}.x`, sized, to);
        case 2:
          return this.format(`${snippet}.xy`, sized, to);
        case 3:
          return this.format(`${snippet}.xyz`, sized, to);
        case 4:
          return this.format(`${snippet}.xyzw`, sized, to);
        default:
          throw new Error(`NodeBuilder: Invalid length ${sizeTo}`);
      }
    }

    if (sizeTo === 4 && sizeFrom > 1) {
      return `${TypeName.repr(to)}(${this.format(snippet, from, TypeName.vec3)}, 1.0)`;
    }

    if (sizeFrom === 2) {
      return `${TypeName.repr(to)}(${this.format(snippet, from, TypeName.vec2)}, 0.0)`;
    }

    if (sizeFrom === 1 && sizeTo > 1 && from !== TypeName.component(to)) {
      snippet = `${TypeName.repr(TypeName.component(to))}(${snippet})`;
    }

    return `${TypeName.repr(to)}(${snippet})`;
  }

  needsColorSpaceToLinear(texture: Texture): boolean {
    return texture.isVideoTexture === true && texture.colorSpace !== null;
  }

  isUnfilterable(texture: Texture): boolean {
    return texture.isDataTexture === true && texture.type === TextureDataType.Float;
  }

  getPropertyName(node: Node, shaderStage: ShaderStage = this.shaderStage): string {
    if (node.isNodeVarying === true && node.needsInterpolation === true) {
      if (shaderStage === ShaderStage.Vertex) {
        return `vertex.${node.name}`;
      }
    } else if (Uniform.is(node)) {
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
    const getUniformFromNode = (node: Node, type: TypeName, shaderStage: ShaderStage, name: string) => {
      const data = this.getDataFromNode(node, shaderStage, this.globalCache);

      let uniform = data.uniform;
      if (uniform === undefined) {
        const index = this.uniforms.index++;

        uniform = new Uniform(name || 'nodeUniform' + index, type, node);

        this.uniforms[shaderStage].push(uniform);
        data.uniform = uniform;
      }

      return uniform;
    };

    const uniformNode = getUniformFromNode(node, type, shaderStage, name);

    const nodeData = this.getDataFromNode(node, shaderStage, this.globalCache, null);

    if (nodeData.uniformGPU === undefined) {
      let uniform;

      const bindings = this.bindings[shaderStage];

      if (type === 'texture' || type === 'cubeTexture' || type === 'storageTexture') {
        let texture = null;

        if (type === 'texture' || type === 'storageTexture') {
          texture = new NodeSampledTexture(uniformNode.name, uniformNode.node);
        } else if (type === 'cubeTexture') {
          texture = new NodeSampledCubeTexture(uniformNode.name, uniformNode.node);
        }

        texture.store = node.isStoreTextureNode === true;
        texture.setVisibility(StageMap[shaderStage]);

        if (
          shaderStage === ShaderStage.Fragment &&
          this.isUnfilterable(node.value) === false &&
          texture.store === false
        ) {
          const sampler = new NodeSampler(`${uniformNode.name}_sampler`, uniformNode.node);
          sampler.setVisibility(StageMap[shaderStage]);

          bindings.push(sampler, texture);

          uniform = [sampler, texture];
        } else {
          bindings.push(texture);

          uniform = [texture];
        }
      } else if (type === 'buffer' || type === 'storageBuffer') {
        const bufferClass = type === 'storageBuffer' ? NodeStorageBuffer : NodeUniformBuffer;
        const buffer = new bufferClass(node);
        buffer.setVisibility(StageMap[shaderStage]);

        bindings.push(buffer);

        uniform = buffer;
      } else {
        const group = node.groupNode;
        const groupName = group.name;

        const uniformsStage = this.uniformGroups[shaderStage];

        let uniformsGroup = uniformsStage[groupName];

        if (uniformsGroup === undefined) {
          uniformsGroup = new NodeUniformsGroup(groupName, group);
          uniformsGroup.setVisibility(StageMap[shaderStage]);

          uniformsStage[groupName] = uniformsGroup;

          bindings.push(uniformsGroup);
        }

        uniform = this.createBindingUniform(uniformNode);

        uniformsGroup.add(uniform);
      }

      nodeData.uniformGPU = uniform;

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

  codeConst(type: TypeName, value: any): string {
    if (value === null || value === undefined) {
      if (type === 'f32' || type === 'i32' || type === 'u32') value = 0;
      else if (type === 'bool') value = false;
      else if (type === 'color') value = Color.new();
      else if (type === 'vec2') value = Vec2.new();
      else if (type === 'vec3') value = Vec3.new();
      else if (type === 'vec4') value = Vec4.new();
    }

    if (type === TypeName.f32) return asF32(value);
    if (type === TypeName.i32) return `${Math.round(value)}`;
    if (type === TypeName.u32) return value >= 0 ? `${Math.round(value)}u` : '0u';
    if (type === TypeName.bool) return value ? 'true' : 'false';

    if (type === TypeName.color) {
      return `vec3f(${asF32(value.r)}, ${asF32(value.g)}, ${asF32(value.b)})`;
    }

    const size = TypeName.size(type);
    const component = TypeName.component(type);
    const code = (value: number) => this.codeConst(component, value);

    const name = TypeName.repr(type);
    switch (size) {
      case 2:
        return `${name}(${code(value.x)}, ${code(value.y)})`;
      case 3:
        return `${name}(${code(value.x)}, ${code(value.y)}, ${code(value.z)})`;
      case 4:
        return `${name}(${code(value.x)}, ${code(value.y)}, ${code(value.z)}, ${code(value.w)})`;
      case 9:
      case 16:
        return `${name}(${value.elements.map(code).join(', ')})`;
      default:
        return `${name}()`;
    }

    throw new Error(`NodeBuilder: Type '${type}' not found in generate constant attempt.`);
  }

  codeTextureStore(texture: Texture, textureProperty: string, uvIndexSnippet: string, valueSnippet: string): string {
    return `textureStore(${textureProperty}, ${uvIndexSnippet}, ${valueSnippet})`;
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

  codeFunction(shaderNode: ShaderNode): string {
    const flow = this.flowShaderNode(shaderNode);
    const layout = shaderNode.layout;

    const parameters = [];

    for (const input of layout.inputs) {
      parameters.push(`${input.name}: ${TypeName.repr(input.type)}`);
    }

    return `
    fn ${layout.name}(${parameters.join(', ')}) -> ${TypeName.repr(layout.type)} {
      ${flow.vars}
      ${flow.code}
        return ${flow.result};
    }`;
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
      const type = TypeName.repr(attribute.type);

      snippets.push(`@location(${index}) ${name}: ${type}`);
    }

    return snippets.join(',\n\t');
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
    return `var ${name}: ${TypeName.repr(type)}`;
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

          snippets.push(`${attributesSnippet} ${varying.name}: ${TypeName.repr(varying.type)}`);
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
          if (texture.isDepthTexture === true && texture.compare !== null) {
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
        const bufferType = TypeName.repr(bufferNode.bufferType);
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
        const vectorType = TypeName.repr(TypeName.coerce(uniform.type));
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

  codeMethod(method: PolyfillName | string, output?: TypeName): string {
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

const asF32 = (value: number): string => value + (value % 1 ? '' : '.0');

const UniformsGroup = new ChainMap();
const StageMap: Record<ShaderStage, number> = {
  vertex: GPUShaderStage.VERTEX,
  fragment: GPUShaderStage.FRAGMENT,
  compute: GPUShaderStage.COMPUTE,
};
