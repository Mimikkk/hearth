import * as Engine from '@modules/renderer/engine/engine.js';
import { BufferAttribute } from '@modules/renderer/engine/engine.js';
import {
  color,
  f32,
  instanceIndex,
  storage,
  storageObject,
  texture,
  tslFn,
  uniform,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GUI } from 'lil-gui';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { GPUBufferBindingTypeType, BufferStep } from '@modules/renderer/engine/renderers/constants.js';

let camera, scene, renderer;
let computeNode;
let waveBuffer, sampleRate;
let waveGPUBuffer;
let currentAudio, currentAnalyser;
const analyserBuffer = new Uint8Array(1024);
let analyserTexture;

init();

async function playAudioBuffer() {
  if (currentAudio) currentAudio.stop();

  // compute audio

  await renderer.compute(computeNode);

  const waveArray = new Float32Array(await renderer.getArrayBuffer(waveGPUBuffer));

  // play result

  const audioOutputContext = new AudioContext({ sampleRate });
  const audioOutputBuffer = audioOutputContext.createBuffer(1, waveArray.length, sampleRate);

  audioOutputBuffer.copyToChannel(waveArray, 0);

  const source = audioOutputContext.createBufferSource();
  source.connect(audioOutputContext.destination);
  source.buffer = audioOutputBuffer;
  source.start();

  currentAudio = source;

  // visual feedback

  currentAnalyser = audioOutputContext.createAnalyser();
  currentAnalyser.fftSize = 2048;

  source.connect(currentAnalyser);
}

async function init() {
  // if ( WebGPU.isAvailable() === false ) {

  // 	document.body.appendChild( WebGPU.getErrorMessage() );

  // 	throw new Error( 'No WebGPU support' );

  // }

  // audio buffer

  const soundBuffer = await fetch('sounds/webgpu-audio-processing.mp3').then(res => res.arrayBuffer());
  const audioContext = new AudioContext();

  const audioBuffer = await audioContext.decodeAudioData(soundBuffer);

  waveBuffer = audioBuffer.getChannelData(0);

  // adding extra silence to delay and pitch
  waveBuffer = new Float32Array([...waveBuffer, ...new Float32Array(200000)]);

  sampleRate = audioBuffer.sampleRate / audioBuffer.numberOfChannels;

  // create webgpu buffers

  waveGPUBuffer = new BufferAttribute(waveBuffer, 1, 0, BufferStep.Instance, GPUBufferBindingTypeType.Storage);

  const waveStorageNode = storage(waveGPUBuffer, 'f32', waveBuffer.length);

  // read-only buffer

  const waveNode = storageObject(
    new BufferAttribute(waveBuffer, 1, 0, BufferStep.Instance, GPUBufferBindingTypeType.ReadOnlyStorage),
    'f32',
    waveBuffer.length,
  );

  // params

  const pitch = uniform(1.5);
  const delayVolume = uniform(0.2);
  const delayOffset = uniform(0.55);

  // compute (shader-node)

  const computeShaderFn = tslFn(() => {
    const index = f32(instanceIndex);

    // pitch

    const time = index.mul(pitch);

    let wave = waveNode.element(time);

    // delay

    for (let i = 1; i < 7; i++) {
      const waveOffset = waveNode.element(index.sub(delayOffset.mul(sampleRate).mul(i)).mul(pitch));
      const waveOffsetVolume = waveOffset.mul(delayVolume.div(i * i));

      wave = wave.add(waveOffsetVolume);
    }

    // store

    const waveStorageElementNode = waveStorageNode.element(instanceIndex);

    waveStorageElementNode.assign(wave);
  });

  // compute

  computeNode = computeShaderFn().compute(waveBuffer.length);

  // gui

  const gui = new GUI();

  gui.add(pitch, 'value', 0.5, 2, 0.01).name('pitch');
  gui.add(delayVolume, 'value', 0, 1, 0.01).name('delayVolume');
  gui.add(delayOffset, 'value', 0.1, 1, 0.01).name('delayOffset');

  // renderer

  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 30);

  // nodes

  analyserTexture = new Engine.DataTexture(analyserBuffer, analyserBuffer.length, 1, Engine.TextureFormat.Red);

  const spectrum = texture(analyserTexture, viewportTopLeft.x).x.mul(viewportTopLeft.y);
  const backgroundNode = color(0x0000ff).mul(spectrum);

  // scene

  scene = new Engine.Scene();
  scene.backgroundNode = backgroundNode;

  // renderer

  renderer = await Renderer.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = render;
  container.appendChild(renderer.parameters.canvas);

  document.onclick = () => {
    const overlay = document.getElementById('overlay');
    if (overlay !== null) overlay.remove();

    playAudioBuffer();
  };
  useWindowResizer(renderer, camera);
}

function render() {
  if (currentAnalyser) {
    currentAnalyser.getByteFrequencyData(analyserBuffer);

    analyserTexture.needsUpdate = true;
  }

  renderer.render(scene, camera);
}
