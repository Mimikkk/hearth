import DataMap from './DataMap.js';
import RenderPipeline from './RenderPipeline.js';
import ComputePipeline from './ComputePipeline.js';
import ProgrammableStage from './ProgrammableStage.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import Binding from '@modules/renderer/engine/hearth/bindings/Binding.js';
import RenderObject from '@modules/renderer/engine/hearth/RenderObject.js';
import Pipeline from '@modules/renderer/engine/hearth/Pipeline.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class HearthPipelines extends DataMap<any, any> {
  caches: Map<any, any>;
  programs: Record<ShaderStage, Map<string, ProgrammableStage>>;

  constructor(public renderer: Hearth) {
    super();

    this.caches = new Map();
    this.programs = {
      vertex: new Map(),
      fragment: new Map(),
      compute: new Map(),
    };
  }

  getForCompute(computeNode: ComputeNode, bindings: Binding[]): ComputePipeline {
    const data = this.get(computeNode);

    if (this._needsComputeUpdate(computeNode)) {
      const previousPipeline = data.pipeline;

      if (previousPipeline) {
        previousPipeline.usedTimes--;
        previousPipeline.computeProgram.usedTimes--;
      }



      const nodeBuilderState = this.renderer.nodes.getForCompute(computeNode);



      let stageCompute = this.programs.compute.get(nodeBuilderState.computeShader!);

      if (stageCompute === undefined) {
        if (previousPipeline && previousPipeline.computeProgram.usedTimes === 0)
          this._releaseProgram(previousPipeline.computeProgram);

        stageCompute = new ProgrammableStage(
          nodeBuilderState.computeShader!,
          ShaderStage.Compute,
          nodeBuilderState.nodeAttributes,
        );
        this.programs.compute.set(nodeBuilderState.computeShader!, stageCompute);

        this.renderer.backend.createProgram(stageCompute);
      }



      const cacheKey = this._getComputeCacheKey(computeNode, stageCompute);

      let pipeline = this.caches.get(cacheKey);

      if (pipeline === undefined) {
        if (previousPipeline && previousPipeline.usedTimes === 0) this._releasePipeline(previousPipeline);

        pipeline = this._getComputePipeline(computeNode, stageCompute, cacheKey, bindings);
      }



      pipeline.usedTimes++;
      stageCompute.usedTimes++;

      //

      data.version = computeNode.version;
      data.pipeline = pipeline;
    }

    return data.pipeline;
  }

  getForRender(renderObject: RenderObject) {
    const data = this.get(renderObject);

    if (this._needsRenderUpdate(renderObject)) {
      const previousPipeline = data.pipeline;

      if (previousPipeline) {
        previousPipeline.usedTimes--;
        previousPipeline.vertexProgram.usedTimes--;
        previousPipeline.fragmentProgram.usedTimes--;
      }



      const nodeBuilderState = renderObject.getNodeBuilderState();



      let stageVertex = this.programs.vertex.get(nodeBuilderState.vertexShader);

      if (stageVertex === undefined) {
        if (previousPipeline && previousPipeline.vertexProgram.usedTimes === 0)
          this._releaseProgram(previousPipeline.vertexProgram);

        stageVertex = new ProgrammableStage(nodeBuilderState.vertexShader, ShaderStage.Vertex);
        this.programs.vertex.set(nodeBuilderState.vertexShader, stageVertex);

        this.renderer.backend.createProgram(stageVertex);
      }

      let stageFragment = this.programs.fragment.get(nodeBuilderState.fragmentShader);

      if (stageFragment === undefined) {
        if (previousPipeline && previousPipeline.fragmentProgram.usedTimes === 0)
          this._releaseProgram(previousPipeline.fragmentProgram);

        stageFragment = new ProgrammableStage(nodeBuilderState.fragmentShader, ShaderStage.Fragment);
        this.programs.fragment.set(nodeBuilderState.fragmentShader, stageFragment);

        this.renderer.backend.createProgram(stageFragment);
      }



      const cacheKey = this._getRenderCacheKey(renderObject, stageVertex, stageFragment);

      let pipeline = this.caches.get(cacheKey);

      if (pipeline === undefined) {
        if (previousPipeline && previousPipeline.usedTimes === 0) this._releasePipeline(previousPipeline);

        pipeline = this._getRenderPipeline(renderObject, stageVertex, stageFragment, cacheKey);
      } else {
        renderObject.pipeline = pipeline;
      }



      pipeline.usedTimes++;
      stageVertex.usedTimes++;
      stageFragment.usedTimes++;

      //

      data.pipeline = pipeline;
    }

    return data.pipeline;
  }

  delete(object: RenderObject) {
    const pipeline = this.get(object).pipeline;

    if (pipeline) {
      pipeline.usedTimes--;

      if (pipeline.usedTimes === 0) this._releasePipeline(pipeline);



      if (pipeline.isComputePipeline) {
        pipeline.computeProgram.usedTimes--;

        if (pipeline.computeProgram.usedTimes === 0) this._releaseProgram(pipeline.computeProgram);
      } else {
        pipeline.fragmentProgram.usedTimes--;
        pipeline.vertexProgram.usedTimes--;

        if (pipeline.vertexProgram.usedTimes === 0) this._releaseProgram(pipeline.vertexProgram);
        if (pipeline.fragmentProgram.usedTimes === 0) this._releaseProgram(pipeline.fragmentProgram);
      }
    }

    return super.delete(object);
  }

  dispose() {
    super.dispose();

    this.caches = new Map();
    this.programs = {
      vertex: new Map(),
      fragment: new Map(),
      compute: new Map(),
    };
  }

  updateForRender(renderObject: RenderObject) {
    this.getForRender(renderObject);
  }

  _getComputePipeline(
    computeNode: ComputeNode,
    stageCompute: ProgrammableStage,
    cacheKey: string,
    bindings: Binding[],
  ): ComputePipeline {


    cacheKey = cacheKey || this._getComputeCacheKey(computeNode, stageCompute);

    let pipeline = this.caches.get(cacheKey);

    if (pipeline === undefined) {
      pipeline = new ComputePipeline(cacheKey, stageCompute);

      this.caches.set(cacheKey, pipeline);

      this.renderer.backend.createComputePipeline(pipeline, bindings);
    }

    return pipeline;
  }

  _getRenderPipeline(
    renderObject: RenderObject,
    stageVertex: ProgrammableStage,
    stageFragment: ProgrammableStage,
    cacheKey: string,
  ): RenderPipeline {
    cacheKey = cacheKey || this._getRenderCacheKey(renderObject, stageVertex, stageFragment);

    let pipeline = this.caches.get(cacheKey);

    if (pipeline === undefined) {
      pipeline = new RenderPipeline(cacheKey, stageVertex, stageFragment);

      this.caches.set(cacheKey, pipeline);

      renderObject.pipeline = pipeline;

      this.renderer.backend.createRenderPipeline(renderObject);
    }

    return pipeline;
  }

  _getComputeCacheKey(computeNode: ComputeNode, stageCompute: ProgrammableStage): string {
    return computeNode.id + ',' + stageCompute.id;
  }

  _getRenderCacheKey(
    renderObject: RenderObject,
    stageVertex: ProgrammableStage,
    stageFragment: ProgrammableStage,
  ): string {
    return stageVertex.id + ',' + stageFragment.id + ',' + this.renderer.backend.getRenderCacheKey(renderObject);
  }

  _releasePipeline(pipeline: Pipeline) {
    this.caches.delete(pipeline.cacheKey);
  }

  _releaseProgram(program: ProgrammableStage) {
    this.programs[program.stage].delete(program.code);
  }

  _needsComputeUpdate(computeNode: ComputeNode): boolean {
    const data = this.get(computeNode);

    return data.pipeline === undefined || data.version !== computeNode.version;
  }

  _needsRenderUpdate(renderObject: RenderObject): boolean {
    const data = this.get(renderObject);

    return data.pipeline === undefined || this.renderer.backend.needsRenderUpdate(renderObject);
  }
}
