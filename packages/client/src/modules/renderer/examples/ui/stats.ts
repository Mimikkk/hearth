import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { GPUFeature } from '@modules/renderer/engine/renderers/utils/constants.js';
import { FrameStats } from '@modules/renderer/engine/renderers/FrameStats.js';

export class Panel {
  name: string;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  foreground: string;
  background: string;

  pixelRatio: number;
  width: number;
  height: number;

  textX: number;
  textY: number;
  graphX: number;
  graphY: number;
  graphWidth: number;
  graphHeight: number;

  constructor(name: string, fg: string, bg: string) {
    this.name = name;
    this.foreground = fg;
    this.background = bg;
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

  update(value: number, valueGraph: number, maxValue: number, maxGraph: number, decimals = 0) {
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
  }
}

export interface StatsOptions {
  logsPerSecond?: number;
  samplesLog?: number;
  samplesGraph?: number;
  precision?: number;
  autoInsert?: boolean;
}

export class Stats {
  totalCpuDuration: number = 0;
  totalFps: number = 0;

  beginTime: number;
  prevTime: number;
  prevCpuTime: number;
  frames: number;

  info: FrameStats;
  dom: HTMLDivElement;

  averageCpu: Stat;
  averageGpu: Stat;
  averageGpuCompute: Stat;

  isRunningCPUProfiling: boolean;

  fpsPanel: Panel;
  msPanel: Panel;
  gpuPanel: Panel | null;
  gpuPanelCompute: Panel | null;

  logsPerSecond: number;
  precision: number;

  constructor(
    renderer: Renderer,
    { autoInsert = true, logsPerSecond = 20, samplesLog = 100, samplesGraph = 10, precision = 2 }: StatsOptions = {},
  ) {
    this.dom = document.createElement('div');
    this.dom.style.cssText = 'position:fixed;top:0;left:0;opacity:0.9;z-index:10000;';

    this.isRunningCPUProfiling = false;

    this.beginTime = performance.now();
    this.prevTime = this.beginTime;
    this.prevCpuTime = this.beginTime;

    this.frames = 0;

    this.averageCpu = Stat.new(samplesLog, samplesGraph);
    this.averageGpu = Stat.new(samplesLog, samplesGraph);
    this.averageGpuCompute = Stat.new(samplesLog, samplesGraph);

    this.fpsPanel = this.addPanel(new Panel('FPS', '#0ff', '#002'), 0);
    this.msPanel = this.addPanel(new Panel('CPU', '#0f0', '#020'), 1);
    this.gpuPanel = null;
    this.gpuPanelCompute = null;

    this.precision = precision;
    this.logsPerSecond = logsPerSecond;

    if (renderer.backend.hasFeature(GPUFeature.TimestampQuery)) {
      renderer.parameters.useTimestamp = true;
      this.gpuPanel = this.addPanel(new Panel('GPU', '#ff0', '#220'), 2);
      this.gpuPanelCompute = this.addPanel(new Panel('CPT', '#e1e1e1', '#212121'), 3);
      this.info = renderer.info;
    }

    if (autoInsert) document.body.appendChild(this.dom);
    window.addEventListener('resize', () => {
      this.resizePanel(this.fpsPanel, 0);
      this.resizePanel(this.msPanel, 1);

      if (this.gpuPanel) this.resizePanel(this.gpuPanel, 2);
      if (this.gpuPanelCompute) this.resizePanel(this.gpuPanelCompute, 3);
    });
  }

  static use(renderer: Renderer, options?: StatsOptions) {
    return new Stats(renderer, options);
  }

  resizePanel(panel: Panel, offset: number) {
    panel.canvas.style.position = 'absolute';
    panel.canvas.style.display = 'block';
    panel.canvas.style.left = '0px';
    panel.canvas.style.top = (offset * panel.height) / panel.pixelRatio + 'px';
  }

  addPanel(panel: Panel, offset: number) {
    if (panel.canvas) {
      this.dom.appendChild(panel.canvas);
      this.resizePanel(panel, offset);
    }

    return panel;
  }

  tick() {
    this.frames++;
    const time = performance.now();

    if (time >= this.prevCpuTime + 1000 / this.logsPerSecond) {
      this.updatePanel(this.msPanel, this.averageCpu);
      this.updatePanel(this.gpuPanel, this.averageGpu);

      if (this.gpuPanelCompute) this.updatePanel(this.gpuPanelCompute, this.averageGpuCompute);

      this.prevCpuTime = time;
    }

    if (time >= this.prevTime + 1000) {
      const fps = (this.frames * 1000) / (time - this.prevTime);

      this.fpsPanel.update(fps, fps, 100, 100, 0);

      this.prevTime = time;
      this.frames = 0;
    }

    return time;
  }

  update() {
    this.averageGpuCompute.add(this.info.compute.timestampTime);

    this.endProfiling('cpu-started', 'cpu-finished', 'cpu-duration');
    this.averageCpu.add(this.totalCpuDuration);
    this.averageGpu.add(this.info.render.timestampTime);

    if (this.totalCpuDuration === 0) this.beginProfiling('cpu-started');
    this.totalCpuDuration = 0;
    this.totalFps = 0;

    this.beginTime = this.tick();
  }

  beginProfiling(marker: string) {
    window.performance.mark(marker);
    this.isRunningCPUProfiling = true;
  }

  endProfiling(startMarker: string | PerformanceMeasureOptions | undefined, endMarker: string, measureName: string) {
    if (!this.isRunningCPUProfiling) return;

    window.performance.mark(endMarker);
    const { duration } = performance.measure(measureName, startMarker, endMarker);
    this.totalCpuDuration += duration;
    this.isRunningCPUProfiling = false;
  }

  updatePanel(panel: Panel | null, averages: Stat) {
    if (averages.logs.values.length <= 0) return;

    let sumLog = 0;
    let max = 0.01;
    for (let i = 0; i < averages.logs.values.length; i++) {
      sumLog += averages.logs.values[i];

      if (averages.logs.values[i] > max) max = averages.logs.values[i];
    }
    let sumGraph = 0;
    let maxGraph = 0.01;
    for (let i = 0; i < averages.graph.values.length; i++) {
      sumGraph += averages.graph.values[i];

      if (averages.graph.values[i] > maxGraph) maxGraph = averages.graph.values[i];
    }
    panel?.update(
      sumLog / Math.min(averages.logs.values.length, averages.logs.max),
      sumGraph / Math.min(averages.graph.values.length, averages.graph.max),
      max,
      maxGraph,
      this.precision,
    );
  }
}

export class RollingStat {
  constructor(
    public values: number[],
    public max: number,
  ) {}

  static new(max: number) {
    return new RollingStat([], max);
  }

  add(value: number): this {
    this.values.push(value);
    if (this.values.length > this.max) this.values.shift();
    return this;
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
