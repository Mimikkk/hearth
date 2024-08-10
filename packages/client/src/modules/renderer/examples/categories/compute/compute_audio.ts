import * as Engine from '@modules/renderer/engine/engine.js';
import { Attribute } from '@modules/renderer/engine/engine.js';
import {
  color,
  f32,
  instanceIndex,
  storage,
  texture,
  hsl,
  uniform,
  viewportTopLeft,
  TypeName,
} from '@modules/renderer/engine/nodes/nodes.js';

import { GUI } from 'lil-gui';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { GPUBufferBindingTypeType, BufferStep } from '@modules/renderer/engine/hearth/constants.js';

let camera, scene, hearth;
let computeNode;
let waveBuffer, sampleRate;
let waveGPUBuffer;
let currentAudio, currentAnalyser;
const analyserBuffer = new Uint8Array(1024);
let analyserTexture;

init();

async function playAudioBuffer() {
  if (currentAudio) currentAudio.stop();

  await hearth.compute(computeNode);

  const waveArray = new Float32Array(await hearth.getArrayBuffer(waveGPUBuffer));

  const audioOutputContext = new AudioContext({ sampleRate });
  const audioOutputBuffer = audioOutputContext.createBuffer(1, waveArray.length, sampleRate);

  audioOutputBuffer.copyToChannel(waveArray, 0);

  const source = audioOutputContext.createBufferSource();
  source.connect(audioOutputContext.destination);
  source.buffer = audioOutputBuffer;
  source.start();

  currentAudio = source;

  currentAnalyser = audioOutputContext.createAnalyser();
  currentAnalyser.fftSize = 2048;

  source.connect(currentAnalyser);
}

async function init() {
  const soundBuffer = await fetch('sounds/webgpu-audio-processing.mp3').then(res => res.arrayBuffer());
  const audioContext = new AudioContext();

  const audioBuffer = await audioContext.decodeAudioData(soundBuffer);

  waveBuffer = audioBuffer.getChannelData(0);

  waveBuffer = new Float32Array([...waveBuffer, ...new Float32Array(200000)]);

  sampleRate = audioBuffer.sampleRate / audioBuffer.numberOfChannels;

  waveGPUBuffer = new Attribute(waveBuffer, 1, 0, BufferStep.Instance, GPUBufferBindingTypeType.Storage);

  const waveStorageNode = storage(waveGPUBuffer, TypeName.f32, waveBuffer.length);

  const waveNode = storage(
    new Attribute(waveBuffer, 1, 0, BufferStep.Instance, GPUBufferBindingTypeType.ReadOnlyStorage),
    TypeName.f32,
    waveBuffer.length,
  );

  const pitch = uniform(1.5);
  const delayVolume = uniform(0.2);
  const delayOffset = uniform(0.55);

  const computeShaderFn = hsl(() => {
    const index = f32(instanceIndex);

    const time = index.mul(pitch);

    let wave = waveNode.element(time);

    for (let i = 1; i < 7; i++) {
      const waveOffset = waveNode.element(index.sub(delayOffset.mul(sampleRate).mul(i)).mul(pitch));
      const waveOffsetVolume = waveOffset.mul(delayVolume.div(i * i));

      wave = wave.add(waveOffsetVolume);
    }

    const waveStorageElementNode = waveStorageNode.element(instanceIndex);

    waveStorageElementNode.assign(wave);
  });

  computeNode = computeShaderFn().compute(waveBuffer.length);

  const gui = new GUI();

  gui.add(pitch, 'value', 0.5, 2, 0.01).name('pitch');
  gui.add(delayVolume, 'value', 0, 1, 0.01).name('delayVolume');
  gui.add(delayOffset, 'value', 0.1, 1, 0.01).name('delayOffset');

  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 30);

  analyserTexture = new Engine.DataTexture(analyserBuffer, analyserBuffer.length, 1, Engine.TextureFormat.Red);

  const spectrum = texture(analyserTexture, viewportTopLeft.x).x.mul(viewportTopLeft.y);
  const backgroundNode = color(0x0000ff).mul(spectrum);

  scene = new Engine.Scene();
  scene.backgroundNode = backgroundNode;

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = render;
  container.appendChild(hearth.parameters.canvas);

  document.onclick = () => {
    const overlay = document.getElementById('overlay');
    if (overlay !== null) overlay.remove();

    playAudioBuffer();
  };
  useWindowResizer(hearth, camera);
}

function render() {
  if (currentAnalyser) {
    currentAnalyser.getByteFrequencyData(analyserBuffer);

    analyserTexture.needsUpdate = true;
  }

  hearth.render(scene, camera);
}
