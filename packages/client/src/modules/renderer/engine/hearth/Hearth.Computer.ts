import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { ComputeNode } from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';

export class HearthComputer extends HearthComponent {
  async run(compute: ComputeNode | ComputeNode[]): Promise<void> {
    const frame = this.hearth.nodes.nodeFrame;
    const previousRenderId = frame.renderId;

    this.hearth.stats.passes++;
    this.hearth.stats.compute.passes++;
    this.hearth.stats.compute.calls++;

    frame.renderId = this.hearth.stats.compute.passes;

    const descriptor = {} as GPUComputePassDescriptor;

    this.hearth.timestamp.attach(compute, descriptor);

    const encoder = this.hearth.device.createCommandEncoder();

    this.hearth.timestamp.encodeTransfer(compute, encoder);
    const pass = encoder.beginComputePass(descriptor);

    if (Array.isArray(compute)) {
      for (const node of compute) this.#encodePass(node, pass);
    } else {
      this.#encodePass(compute, pass);
    }

    pass.end();

    this.hearth.device.queue.submit([encoder.finish()]);
    await this.hearth.timestamp.resolve(compute, 'compute');

    frame.renderId = previousRenderId;
  }

  #encodePass(node: ComputeNode, pass: GPUComputePassEncoder): void {
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
}
