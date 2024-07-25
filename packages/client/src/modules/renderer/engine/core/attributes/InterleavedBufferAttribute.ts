import { TypedArray } from '../../math/MathUtils.js';
import { Buffer } from '@modules/renderer/engine/core/buffers/Buffer.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';
import { GPUBufferBindingTypeType, GPUVertexStepModeType } from '@modules/renderer/engine/renderers/utils/constants.js';

export class InterleavedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  data: Buffer<T>;

  constructor(
    buffer: Buffer<T>,
    span: number,
    offset: number,
    step?: GPUVertexStepModeType,
    bind?: GPUBufferBindingTypeType,
  ) {
    console.log({ span, buffer });
    super(buffer.array, span, offset, step, bind, true);
    this.data = buffer;

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'data') {
          traceOnce(prop, target, prop);
        }
        return target[prop];
      },
    });
  }
}

const thrown = new Set<string>();
const traceOnce = (message: string, ...args: any[]) => {
  if (thrown.has(message)) return;
  thrown.add(message);

  console.trace({ message, ...args });
};
//{
//     "vertex": {
//         "module": {},
//         "entryPoint": "main",
//         "buffers": [
//             {
//                 "arrayStride": 12,
//                 "attributes": [
//                     {
//                         "shaderLocation": 0,
//                         "offset": 0,
//                         "format": "float32x3"
//                     }
//                 ],
//                 "stepMode": "vertex"
//             },
//             {
//                 "arrayStride": 12,
//                 "attributes": [
//                     {
//                         "shaderLocation": 1,
//                         "offset": 0,
//                         "format": "float32x3"
//                     }
//                 ],
//                 "stepMode": "vertex"
//             },
//             {
//                 "arrayStride": 64,
//                 "attributes": [
//                     {
//                         "shaderLocation": 2,
//                         "offset": 0,
//                         "format": "float32x16"
//                     }
//                 ],
//                 "stepMode": "instance"
//             },
//             {
//                 "arrayStride": 64,
//                 "attributes": [
//                     {
//                         "shaderLocation": 3,
//                         "offset": 16,
//                         "format": "float32x16"
//                     }
//                 ],
//                 "stepMode": "instance"
//             },
//             {
//                 "arrayStride": 64,
//                 "attributes": [
//                     {
//                         "shaderLocation": 4,
//                         "offset": 32,
//                         "format": "float32x16"
//                     }
//                 ],
//                 "stepMode": "instance"
//             },
//             {
//                 "arrayStride": 64,
//                 "attributes": [
//                     {
//                         "shaderLocation": 5,
//                         "offset": 48,
//                         "format": "float32x16"
//                     }
//                 ],
//                 "stepMode": "instance"
//             }
//         ]
//     },
//     "fragment": {
//         "module": {},
//         "entryPoint": "main",
//         "targets": [
//             {
//                 "format": "bgra8unorm",
//                 "writeMask": 15
//             }
//         ]
//     },
//     "primitive": {
//         "topology": "triangle-list",
//         "frontFace": "ccw",
//         "cullMode": "back"
//     },
//     "depthStencil": {
//         "format": "depth24plus",
//         "depthWriteEnabled": true,
//         "depthCompare": "less-equal",
//         "stencilFront": {},
//         "stencilBack": {},
//         "stencilReadMask": 255,
//         "stencilWriteMask": 255
//     },
//     "multisample": {
//         "count": 4,
//         "alphaToCoverageEnabled": false
//     },
//     "layout": {}
// }
