import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { GPUFeature } from '@modules/renderer/engine/renderers/utils/constants.js';
import { FrameStats } from '@modules/renderer/engine/renderers/FrameStats.js';

class Panel {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  pixelRatio: number;
  width: number;
  height: number;

  textX: number;
  textY: number;

  graphX: number;
  graphY: number;
  graphWidth: number;
  graphHeight: number;

  constructor(
    public name: string,
    public foreground: string,
    public background: string,
  ) {
    this.name = name;
    this.foreground = foreground;
    this.background = background;
    this.pixelRatio = Math.round(window.devicePixelRatio || 1);

    this.width = 90 * this.pixelRatio;
    this.height = 48 * this.pixelRatio;
    this.textX = 3 * this.pixelRatio;
    this.textY = 2 * this.pixelRatio;
    this.graphX = 3 * this.pixelRatio;
    this.graphY = 15 * this.pixelRatio;
    this.graphWidth = 84 * this.pixelRatio;
    this.graphHeight = 30 * this.pixelRatio;

    this.canvas = document.createElement('canvas');

    this.canvas.width = 90 * this.pixelRatio;
    this.canvas.height = 48 * this.pixelRatio;
    this.canvas.style.width = '90px';
    this.canvas.style.position = 'absolute';
    this.canvas.style.height = '48px';
    this.canvas.style.cssText = 'width:90px;height:48px';
    this.context = this.canvas.getContext('2d')!;
    this.context.font = 'bold ' + 9 * this.pixelRatio + 'px Helvetica,Arial,sans-serif';
    this.context.textBaseline = 'top';

    this.context.fillStyle = this.background;
    this.context.fillRect(0, 0, this.width, this.height);

    this.context.fillStyle = this.foreground;
    this.context.fillText(this.name, this.textX, this.textY);
    this.context.fillRect(this.graphX, this.graphY, this.graphWidth, this.graphHeight);

    this.context.fillStyle = this.background;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(this.graphX, this.graphY, this.graphWidth, this.graphHeight);
  }

  static new(name: string, foreground: string, background: string): Panel {
    return new Panel(name, foreground, background);
  }

  attach(container: HTMLElement): this {
    container.appendChild(this.canvas);
    return this;
  }

  update(value: number, valueGraph: number, maxValue: number, maxGraph: number, decimals = 0): this {
    let min = Math.min(0, value);
    let max = Math.max(maxValue, value);
    maxGraph = Math.max(maxGraph, valueGraph);

    this.context.fillStyle = this.background;
    this.context.globalAlpha = 1;
    this.context.fillRect(0, 0, this.width, this.graphY);
    this.context.fillStyle = this.foreground;
    this.context.fillText(
      `${value.toFixed(decimals)} ${this.name} (${min.toFixed(decimals)}-${parseFloat(max.toFixed(decimals))})`,
      this.textX,
      this.textY,
    );

    this.context.drawImage(
      this.canvas,
      this.graphX + this.pixelRatio,
      this.graphY,
      this.graphWidth - this.pixelRatio,
      this.graphHeight,
      this.graphX,
      this.graphY,
      this.graphWidth - this.pixelRatio,
      this.graphHeight,
    );

    this.context.fillRect(
      this.graphX + this.graphWidth - this.pixelRatio,
      this.graphY,
      this.pixelRatio,
      this.graphHeight,
    );

    this.context.fillStyle = this.background;
    this.context.globalAlpha = 0.9;

    this.context.fillRect(
      this.graphX + this.graphWidth - this.pixelRatio,
      this.graphY,
      this.pixelRatio,
      (1 - valueGraph / maxGraph) * this.graphHeight,
    );

    return this;
  }

  resize(offset: number): this {
    this.canvas.style.position = 'absolute';
    this.canvas.style.display = 'block';
    this.canvas.style.left = '0px';
    this.canvas.style.top = (offset * this.height) / this.pixelRatio + 'px';
    return this;
  }
}

export class RollingStat {
  constructor(
    public values: number[],
    public size: number,
  ) {}

  static new(max: number) {
    return new RollingStat([], max);
  }

  add(value: number): this {
    this.values.push(value);
    if (this.values.length > this.size) this.values.shift();
    return this;
  }

  get length() {
    return this.values.length;
  }

  get sum(): number {
    let sum = 0;
    for (let i = 0; i < this.values.length; i++) sum += this.values[i];
    return sum;
  }

  get max(): number {
    let max = this.values[0];
    for (let i = 1; i < this.values.length; i++) if (this.values[i] > max) max = this.values[i];
    return max;
  }

  get average(): number {
    return this.sum / this.values.length;
  }
}

export class Stat {
  constructor(
    public logs: RollingStat,
    public graph: RollingStat,
  ) {}

  static new(maxLogs: number, maxGraph: number) {
    return new Stat(RollingStat.new(maxLogs), RollingStat.new(maxGraph));
  }

  add(value: number) {
    this.logs.add(value);
    this.graph.add(value);
  }
}

export interface Options {
  logsPerSecond?: number;
  samplesLog?: number;
  samplesGraph?: number;
  precision?: number;
  insert?: boolean;
}

export class Stats {
  totalCpuMs: number = 0;

  beginTime: number;
  prevTime: number;
  prevStatTime: number;
  frames: number;

  info: FrameStats;
  dom: HTMLDivElement;

  cpuMsStat: Stat;
  gpuRenderStat: Stat;
  gpuComputeStat: Stat;

  isProfiling: boolean;

  fps: Panel;
  cpuMs: Panel;
  gpuRender: Panel | null;
  gpuCompute: Panel | null;

  logsPerSecond: number;
  precision: number;

  constructor(
    renderer: Renderer,
    { insert = true, logsPerSecond = 20, samplesLog = 100, samplesGraph = 10, precision = 2 }: Options = {},
  ) {
    this.dom = document.createElement('div');
    this.dom.style.cssText = 'position:fixed;top:0;left:0;opacity:0.9;z-index:10000;';

    this.isProfiling = false;

    this.beginTime = performance.now();
    this.prevTime = this.beginTime;
    this.prevStatTime = this.beginTime;

    this.frames = 0;

    this.cpuMsStat = Stat.new(samplesLog, samplesGraph);
    this.gpuRenderStat = Stat.new(samplesLog, samplesGraph);
    this.gpuComputeStat = Stat.new(samplesLog, samplesGraph);

    this.fps = this.createPanel('FPS', '#0ff', '#002', 0);
    this.cpuMs = this.createPanel('CPU', '#0f0', '#020', 1);
    this.gpuRender = null;
    this.gpuCompute = null;

    this.precision = precision;
    this.logsPerSecond = logsPerSecond;

    if (renderer.backend.hasFeature(GPUFeature.TimestampQuery)) {
      renderer.parameters.useTimestamp = true;
      this.gpuRender = this.createPanel('GPU', '#ff0', '#220', 2);
      this.gpuCompute = this.createPanel('CPT', '#e1e1e1', '#212121', 3);
      this.info = renderer.info;
    }

    if (insert) document.body.appendChild(this.dom);
    window.addEventListener('resize', () => {
      this.fps.resize(0);
      this.cpuMs.resize(1);
      if (this.gpuRender) this.gpuRender.resize(2);
      if (this.gpuCompute) this.gpuCompute.resize(3);
    });
  }

  static use(renderer: Renderer, options?: Options) {
    return new Stats(renderer, options);
  }

  createPanel(name: string, foreground: string, background: string, offset: number): Panel {
    return Panel.new(name, foreground, background).attach(this.dom).resize(offset);
  }

  tick() {
    this.frames++;
    const time = performance.now();

    if (time >= this.prevStatTime + 1000 / this.logsPerSecond) {
      this.updatePanel(this.cpuMs, this.cpuMsStat);
      if (this.gpuRender) this.updatePanel(this.gpuRender, this.gpuRenderStat);
      if (this.gpuCompute) this.updatePanel(this.gpuCompute, this.gpuComputeStat);
      this.prevStatTime = time;
    }

    if (time >= this.prevTime + 1000) {
      const fps = (this.frames * 1000) / (time - this.prevTime);

      this.fps.update(fps, fps, 100, 100, 0);

      this.prevTime = time;
      this.frames = 0;
    }

    return time;
  }

  update() {
    this.gpuComputeStat.add(this.info.compute.timestampTime);

    this.endProfiling('cpu-started', 'cpu-finished', 'cpu-duration');
    this.cpuMsStat.add(this.totalCpuMs);
    this.gpuRenderStat.add(this.info.render.timestampTime);

    if (this.totalCpuMs === 0) this.beginProfiling('cpu-started');
    this.totalCpuMs = 0;

    this.beginTime = this.tick();
  }

  beginProfiling(marker: string) {
    window.performance.mark(marker);
    this.isProfiling = true;
  }

  endProfiling(start: string, end: string, name: string) {
    if (!this.isProfiling) return;

    window.performance.mark(end);
    const { duration } = performance.measure(name, start, end);
    this.totalCpuMs += duration;
    this.isProfiling = false;
  }

  updatePanel(panel: Panel, { logs, graph }: Stat) {
    panel.update(logs.average, graph.average, logs.max, graph.max, this.precision);
  }
}
