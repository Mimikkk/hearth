import { AnimationActionLoopStyle, AnimationBlendMode, InterpolationEndingMode } from '../constants.js';
import { AnimationMixer } from '@modules/renderer/engine/animation/AnimationMixer.js';
import { AnimationClip } from '@modules/renderer/engine/animation/AnimationClip.js';
import { Interpolant } from '@modules/renderer/engine/math/interpolants/Interpolant.js';
import { PropertyMixer } from '@modules/renderer/engine/animation/PropertyMixer.js';

export class AnimationAction {
  zeroSlopeAtStart: boolean;
  zeroSlopeAtEnd: boolean;
  clampWhenFinished: boolean;
  timeScaleInterpolant: Interpolant | null;
  weightInterpolant: Interpolant | null;
  activeLoopCount: number;
  loop: AnimationActionLoopStyle;
  repetitions: number;
  settings: { endingStart: InterpolationEndingMode; endingEnd: InterpolationEndingMode };
  interpolants: Interpolant[];
  bindings: PropertyMixer[];
  activeIndex: number | null;
  clipActiveIndex: number | null;
  startTime: number | null;
  time: number;
  timeScale: number;
  effectiveTimeScale: number;
  weight: number;
  effectiveWeight: number;
  paused: boolean;
  enabled: boolean;

  constructor(
    public mixer: AnimationMixer,
    public clip: AnimationClip,
    public blendMode: AnimationBlendMode = clip.blendMode,
  ) {
    const tracks = clip.tracks;
    const nTracks = tracks.length;
    const interpolants = new Array(nTracks);

    const interpolantSettings = {
      endingStart: InterpolationEndingMode.ZeroCurvature,
      endingEnd: InterpolationEndingMode.ZeroCurvature,
    };

    for (let i = 0; i !== nTracks; ++i) {
      interpolants[i] = tracks[i].createInterpolant(null!);
    }

    this.settings = interpolantSettings;
    this.interpolants = interpolants;
    this.bindings = new Array(nTracks);

    this.activeIndex = null;
    this.clipActiveIndex = null;

    this.timeScaleInterpolant = null;
    this.weightInterpolant = null;

    this.loop = AnimationActionLoopStyle.Repeat;
    this.activeLoopCount = -1;
    this.repetitions = Infinity;

    this.startTime = null;

    this.time = 0;

    this.timeScale = 1;
    this.effectiveTimeScale = 1;

    this.weight = 1;
    this.effectiveWeight = 1;

    this.paused = false;
    this.enabled = true;

    this.zeroSlopeAtStart = true;
    this.zeroSlopeAtEnd = true;
    this.clampWhenFinished = false;
  }

  play() {
    this.mixer._activateAction(this);

    return this;
  }

  stop() {
    this.mixer._deactivateAction(this);

    return this.reset();
  }

  reset() {
    this.paused = false;
    this.enabled = true;

    this.time = 0;
    this.activeLoopCount = -1;
    this.startTime = null;

    return this.stopFading().stopWarping();
  }

  isRunning() {
    return (
      this.enabled &&
      !this.paused &&
      this.timeScale !== 0 &&
      this.startTime === null &&
      this.mixer._isActiveAction(this)
    );
  }

  isScheduled() {
    return this.mixer._isActiveAction(this);
  }

  startAt(time: number): this {
    this.startTime = time;

    return this;
  }

  setLoop(mode: AnimationActionLoopStyle, repetitions: number): this {
    this.loop = mode;
    this.repetitions = repetitions;

    return this;
  }

  setEffectiveWeight(weight: number): this {
    this.weight = weight;

    this.effectiveWeight = this.enabled ? weight : 0;

    return this.stopFading();
  }

  fadeIn(duration: number) {
    return this._scheduleFading(duration, 0, 1);
  }

  fadeOut(duration: number) {
    return this._scheduleFading(duration, 1, 0);
  }

  crossFadeFrom(fadeOutAction: AnimationAction, duration: number, warp?: boolean): this {
    fadeOutAction.fadeOut(duration);
    this.fadeIn(duration);

    if (warp) {
      const fadeInDuration = this.clip.duration;
      const fadeOutDuration = fadeOutAction.clip.duration;
      const startEndRatio = fadeOutDuration / fadeInDuration;
      const endStartRatio = fadeInDuration / fadeOutDuration;

      fadeOutAction.warp(1.0, startEndRatio, duration);
      this.warp(endStartRatio, 1.0, duration);
    }

    return this;
  }

  crossFadeTo(fadeInAction: AnimationAction, duration: number, warp?: boolean): this {
    fadeInAction.crossFadeFrom(this, duration, warp);
    return this;
  }

  stopFading(): this {
    const weightInterpolant = this.weightInterpolant;

    if (weightInterpolant !== null) {
      this.weightInterpolant = null;
      this.mixer._takeBackControlInterpolant(weightInterpolant);
    }

    return this;
  }

  setEffectiveTimeScale(timeScale: number): this {
    this.timeScale = timeScale;
    this.effectiveTimeScale = this.paused ? 0 : timeScale;

    return this.stopWarping();
  }

  setDuration(duration: number): this {
    this.timeScale = this.clip.duration / duration;

    return this.stopWarping();
  }

  syncWith(action: AnimationAction): this {
    this.time = action.time;
    this.timeScale = action.timeScale;

    return this.stopWarping();
  }

  halt(duration: number): this {
    return this.warp(this.effectiveTimeScale, 0, duration);
  }

  warp(startTimeScale: number, endTimeScale: number, duration: number): this {
    const mixer = this.mixer;
    const now = mixer.time;
    const timeScale = this.timeScale;

    let interpolant = this.timeScaleInterpolant;

    if (interpolant === null) {
      interpolant = mixer._lendControlInterpolant();
      this.timeScaleInterpolant = interpolant;
    }

    const times = interpolant!.parameterPositions;
    const values = interpolant!.sampleValues;

    times[0] = now;
    times[1] = now + duration;

    values[0] = startTimeScale / timeScale;
    values[1] = endTimeScale / timeScale;

    return this;
  }

  stopWarping(): this {
    const timeScaleInterpolant = this.timeScaleInterpolant;

    if (timeScaleInterpolant !== null) {
      this.timeScaleInterpolant = null;
      this.mixer._takeBackControlInterpolant(timeScaleInterpolant);
    }

    return this;
  }

  update(time: number, deltaTime: number, timeDirection: number, accuIndex: number) {
    if (!this.enabled) {
      this._updateWeight(time);
      return;
    }

    const startTime = this.startTime;

    if (startTime !== null) {
      const timeRunning = (time - startTime) * timeDirection;
      if (timeRunning < 0 || timeDirection === 0) {
        deltaTime = 0;
      } else {
        this.startTime = null;
        deltaTime = timeDirection * timeRunning;
      }
    }

    deltaTime *= this._updateTimeScale(time);
    const clipTime = this._updateTime(deltaTime);
    const weight = this._updateWeight(time);

    if (weight > 0) {
      const interpolants = this.interpolants;
      const propertyMixers = this.bindings;

      switch (this.blendMode) {
        case AnimationBlendMode.Additive:
          for (let j = 0, m = interpolants.length; j !== m; ++j) {
            interpolants[j].interpolateAt(clipTime);
            propertyMixers[j].accumulateAdditive(weight);
          }

          break;

        case AnimationBlendMode.Normal:
        default:
          for (let j = 0, m = interpolants.length; j !== m; ++j) {
            interpolants[j].interpolateAt(clipTime);
            propertyMixers[j].accumulate(accuIndex, weight);
          }
      }
    }
  }

  _updateWeight(time: number): number {
    let weight = 0;

    if (this.enabled) {
      weight = this.weight;
      const interpolant = this.weightInterpolant;

      if (interpolant !== null) {
        const interpolantValue = interpolant.interpolateAt(time)[0];

        weight *= interpolantValue;

        if (time > interpolant.parameterPositions[1]) {
          this.stopFading();

          if (interpolantValue === 0) {
            this.enabled = false;
          }
        }
      }
    }

    this.effectiveWeight = weight;
    return weight;
  }

  _updateTimeScale(time: number): number {
    let timeScale = 0;

    if (!this.paused) {
      timeScale = this.timeScale;

      const interpolant = this.timeScaleInterpolant;

      if (interpolant !== null) {
        const interpolantValue = interpolant.interpolateAt(time)[0];

        timeScale *= interpolantValue;

        if (time > interpolant.parameterPositions[1]) {
          this.stopWarping();

          if (timeScale === 0) {
            this.paused = true;
          } else {
            this.timeScale = timeScale;
          }
        }
      }
    }

    this.effectiveTimeScale = timeScale;
    return timeScale;
  }

  _updateTime(deltaTime: number): number {
    const duration = this.clip.duration;
    const loop = this.loop;

    let time = this.time + deltaTime;
    let loopCount = this.activeLoopCount;

    const pingPong = loop === AnimationActionLoopStyle.PingPong;

    if (deltaTime === 0) {
      if (loopCount === -1) return time;

      return pingPong && (loopCount & 1) === 1 ? duration - time : time;
    }

    if (loop === AnimationActionLoopStyle.Once) {
      if (loopCount === -1) {
        this.activeLoopCount = 0;
        this._updateEndings(true, true, false);
      }

      handle_stop: {
        if (time >= duration) {
          time = duration;
        } else if (time < 0) {
          time = 0;
        } else {
          this.time = time;

          break handle_stop;
        }

        if (this.clampWhenFinished) this.paused = true;
        else this.enabled = false;

        this.time = time;
      }
    } else {
      if (loopCount === -1) {
        if (deltaTime >= 0) {
          loopCount = 0;

          this._updateEndings(true, this.repetitions === 0, pingPong);
        } else {
          this._updateEndings(this.repetitions === 0, true, pingPong);
        }
      }

      if (time >= duration || time < 0) {
        const loopDelta = Math.floor(time / duration);
        time -= duration * loopDelta;

        loopCount += Math.abs(loopDelta);

        const pending = this.repetitions - loopCount;

        if (pending <= 0) {
          if (this.clampWhenFinished) this.paused = true;
          else this.enabled = false;

          time = deltaTime > 0 ? duration : 0;

          this.time = time;
        } else {
          if (pending === 1) {
            const atStart = deltaTime < 0;
            this._updateEndings(atStart, !atStart, pingPong);
          } else {
            this._updateEndings(false, false, pingPong);
          }

          this.activeLoopCount = loopCount;

          this.time = time;
        }
      } else {
        this.time = time;
      }

      if (pingPong && (loopCount & 1) === 1) {
        return duration - time;
      }
    }

    return time;
  }

  _updateEndings(atStart: boolean, atEnd: boolean, pingPong: boolean): void {
    const settings = this.settings;

    if (pingPong) {
      settings.endingStart = InterpolationEndingMode.ZeroSlope;
      settings.endingEnd = InterpolationEndingMode.ZeroSlope;
    } else {
      if (atStart) {
        settings.endingStart = this.zeroSlopeAtStart
          ? InterpolationEndingMode.ZeroSlope
          : InterpolationEndingMode.ZeroCurvature;
      } else {
        settings.endingStart = InterpolationEndingMode.WrapAround;
      }

      if (atEnd) {
        settings.endingEnd = this.zeroSlopeAtEnd
          ? InterpolationEndingMode.ZeroSlope
          : InterpolationEndingMode.ZeroCurvature;
      } else {
        settings.endingEnd = InterpolationEndingMode.WrapAround;
      }
    }
  }

  _scheduleFading(duration: number, weightNow: number, weightThen: number): this {
    const mixer = this.mixer;
    const now = mixer.time;
    let interpolant = this.weightInterpolant;

    if (interpolant === null) {
      interpolant = mixer._lendControlInterpolant();
      this.weightInterpolant = interpolant;
    }

    const times = interpolant!.parameterPositions,
      values = interpolant!.sampleValues;

    times[0] = now;
    values[0] = weightNow;
    times[1] = now + duration;
    values[1] = weightThen;

    return this;
  }
}
