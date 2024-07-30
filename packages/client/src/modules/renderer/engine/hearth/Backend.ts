import { GPUIndexFormatType, GPULoadOpType, GPUStoreOpType } from './constants.js';
import type { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import ComputePipeline from '@modules/renderer/engine/hearth/core/ComputePipeline.js';
import Binding from '@modules/renderer/engine/hearth/bindings/Binding.js';
import RenderObject from '@modules/renderer/engine/hearth/core/RenderObject.js';

export class Backend {
  constructor(public hearth: Hearth) {}
}
