import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';

export class HearthCompute extends HearthComponent {
  async run(compute: ComputeNode | ComputeNode[]): Promise<void> {
    const frame = this.hearth.nodes.nodeFrame;
    const previousRenderId = frame.renderId;

    this.hearth.info.passes++;
    this.hearth.info.compute.passes++;
    frame.renderId = this.hearth.info.compute.passes;

    const computes = Array.isArray(compute) ? compute : [compute];

    const descriptor = {} as GPUComputePassDescriptor;

    this.hearth.initTimestampBuffer(computes, descriptor);

    const encoder = this.hearth.device.createCommandEncoder();
    const pass = encoder.beginComputePass(descriptor);

    for (const node of computes) {
      if (!this.hearth.pipelines.has(node)) node.onInit({ hearth: this.hearth });

      this.hearth.nodes.updateForCompute(node);
      this.hearth.bindings.updateForCompute(node);

      const bindings = this.hearth.bindings.getForCompute(node);
      const pipeline = this.hearth.pipelines.getForCompute(node, bindings);

      const pipelineGPU = this.hearth.memo.get(pipeline).pipeline;
      const bindGroupGPU = this.hearth.memo.get(bindings).group;

      pass.setPipeline(pipelineGPU);
      pass.setBindGroup(0, bindGroupGPU);
      pass.dispatchWorkgroups(node.dispatchCount);
    }

    pass.end();

    this.hearth.prepareTimestamp(computes, encoder);
    this.hearth.device.queue.submit([encoder.finish()]);
    await this.hearth.resolveTimestamp(computes, 'compute');

    frame.renderId = previousRenderId;
  }
}
