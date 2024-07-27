import { AnimationAction } from './AnimationAction.js';
import { LinearInterpolant } from '../math/interpolants/LinearInterpolant.js';
import { PropertyBinding } from './PropertyBinding.js';
import { PropertyMixer } from './PropertyMixer.js';
import { AnimationClip } from './AnimationClip.js';
import { AnimationBlendMode } from '../constants.js';
import { Interpolant } from '@modules/renderer/engine/math/interpolants/Interpolant.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';

export class AnimationMixer {
  indices = new WeakMap<object, number>();
  activeIndex: number;
  time: number;
  timeScale: number;
  _actions: AnimationAction[];
  _nActiveActions: number;
  actionsByClip: Record<string, any>;
  bindings: PropertyMixer[];
  _nActiveBindings: number;
  bindingsByRootAndName: Record<string, any>;
  _controlInterpolants: LinearInterpolant[];
  _nActiveControlInterpolants: number;
  stats: {
    actions: {
      total: number;
      inUse: number;
    };
    bindings: {
      total: number;
      inUse: number;
    };
    controlInterpolants: {
      total: number;
      inUse: number;
    };
  };

  constructor(public root: Entity) {
    this._actions = [];
    this._nActiveActions = 0;
    this.actionsByClip = {};
    this.bindings = [];
    this._nActiveBindings = 0;
    this.bindingsByRootAndName = {};
    this._controlInterpolants = [];
    this._nActiveControlInterpolants = 0;

    const self = this;
    this.stats = {
      actions: {
        get total() {
          return self._actions.length;
        },
        get inUse() {
          return self._nActiveActions;
        },
      },
      bindings: {
        get total() {
          return self.bindings.length;
        },
        get inUse() {
          return self._nActiveBindings;
        },
      },
      controlInterpolants: {
        get total() {
          return self._controlInterpolants.length;
        },
        get inUse() {
          return self._nActiveControlInterpolants;
        },
      },
    };

    this.activeIndex = 0;
    this.time = 0;
    this.timeScale = 1.0;
  }

  _bindAction(action: AnimationAction) {
    const root = this.root,
      tracks = action.clip.tracks,
      nTracks = tracks.length,
      bindings = action.bindings,
      interpolants = action.interpolants,
      rootUuid = root.uuid,
      bindingsByRoot = this.bindingsByRootAndName;

    let bindingsByName = bindingsByRoot[rootUuid];

    if (bindingsByName === undefined) {
      bindingsByName = {};
      bindingsByRoot[rootUuid] = bindingsByName;
    }

    for (let i = 0; i !== nTracks; ++i) {
      const track = tracks[i],
        trackName = track.name;

      let binding = bindingsByName[trackName];

      if (binding !== undefined) {
        ++binding.referenceCount;
        bindings[i] = binding;
      } else {
        binding = bindings[i];

        if (binding !== undefined) {
          if (binding.activeIndex === null) {
            ++binding.referenceCount;
            this._addInactiveBinding(binding, rootUuid, trackName);
          }

          continue;
        }

        binding = new PropertyMixer(PropertyBinding.new(root, trackName), track.ValueTypeName, track.getValueSize());

        ++binding.referenceCount;
        this._addInactiveBinding(binding, rootUuid, trackName);

        bindings[i] = binding;
      }

      interpolants[i].resultBuffer = binding.buffer;
    }
  }

  _activateAction(action: AnimationAction) {
    if (!this._isActiveAction(action)) {
      if (action.activeIndex === null) {
        const rootUuid = this.root.uuid;
        const clipUuid = action.clip.uuid;

        this._bindAction(action);
        this._addInactiveAction(action, clipUuid, rootUuid);
      }

      const bindings = action.bindings;

      for (let i = 0, n = bindings.length; i !== n; ++i) {
        const binding = bindings[i];

        if (binding.useCount++ === 0) {
          this._lendBinding(binding);
          binding.save();
        }
      }

      this._lendAction(action);
    }
  }

  _deactivateAction(action: AnimationAction) {
    if (this._isActiveAction(action)) {
      const bindings = action.bindings;

      for (let i = 0, n = bindings.length; i !== n; ++i) {
        const binding = bindings[i];

        if (--binding.useCount === 0) {
          binding.load();
          this._takeBackBinding(binding);
        }
      }

      this._takeBackAction(action);
    }
  }

  _isActiveAction(action: AnimationAction) {
    const index = action.activeIndex;
    return index !== null && index < this._nActiveActions;
  }

  _addInactiveAction(action: AnimationAction, clipUuid: string, rootUuid: string) {
    const actions = this._actions,
      actionsByClip = this.actionsByClip;

    let actionsForClip = actionsByClip[clipUuid];

    if (actionsForClip === undefined) {
      actionsForClip = {
        knownActions: [action],
        actionByRoot: {},
      };

      action.clipActiveIndex = 0;

      actionsByClip[clipUuid] = actionsForClip;
    } else {
      const knownActions = actionsForClip.knownActions;

      action.clipActiveIndex = knownActions.length;
      knownActions.push(action);
    }

    action.activeIndex = actions.length;
    actions.push(action);

    actionsForClip.actionByRoot[rootUuid] = action;
  }

  _lendAction(action: AnimationAction) {
    const actions = this._actions;
    const prevIndex = action.activeIndex!;
    const lastActiveIndex = this._nActiveActions++;
    const firstInactiveAction = actions[lastActiveIndex];

    action.activeIndex = lastActiveIndex;
    actions[lastActiveIndex] = action;

    firstInactiveAction.activeIndex = prevIndex;
    actions[prevIndex] = firstInactiveAction;
  }

  _takeBackAction(action: AnimationAction) {
    const actions = this._actions;
    const prevIndex = action.activeIndex!;
    const firstInactiveIndex = --this._nActiveActions;
    const lastActiveAction = actions[firstInactiveIndex];

    action.activeIndex = firstInactiveIndex;
    actions[firstInactiveIndex] = action;

    lastActiveAction.activeIndex = prevIndex;
    actions[prevIndex] = lastActiveAction;
  }

  _addInactiveBinding(binding: PropertyMixer, rootUuid: string, trackName: string) {
    const bindingsByRoot = this.bindingsByRootAndName,
      bindings = this.bindings;

    let bindingByName = bindingsByRoot[rootUuid];

    if (bindingByName === undefined) {
      bindingByName = {};
      bindingsByRoot[rootUuid] = bindingByName;
    }

    bindingByName[trackName] = binding;

    this.indices.set(binding, bindings.length);
    bindings.push(binding);
  }

  _lendBinding(binding: PropertyMixer) {
    const bindings = this.bindings;
    const prevIndex = this.indices.get(binding)!;
    const lastActiveIndex = this._nActiveBindings++;
    const firstInactiveBinding = bindings[lastActiveIndex];

    this.indices.set(binding, lastActiveIndex);
    bindings[lastActiveIndex] = binding;

    this.indices.set(firstInactiveBinding, prevIndex);
    bindings[prevIndex] = firstInactiveBinding;
  }

  _takeBackBinding(binding: PropertyMixer) {
    const bindings = this.bindings;
    const prevIndex = this.indices.get(binding)!;
    const firstInactiveIndex = --this._nActiveBindings;
    const lastActiveBinding = bindings[firstInactiveIndex];

    this.indices.set(binding, firstInactiveIndex);
    bindings[firstInactiveIndex] = binding;

    this.indices.set(lastActiveBinding, prevIndex);
    bindings[prevIndex] = lastActiveBinding;
  }

  _lendControlInterpolant() {
    const interpolants = this._controlInterpolants,
      lastActiveIndex = this._nActiveControlInterpolants++;

    let interpolant = interpolants[lastActiveIndex];

    if (interpolant === undefined) {
      interpolant = new LinearInterpolant(
        new Float32Array(2),
        new Float32Array(2),
        1,
        _controlInterpolantsResultBuffer,
      );

      this.indices.set(interpolant, lastActiveIndex);
      interpolants[lastActiveIndex] = interpolant;
    }

    return interpolant;
  }

  _takeBackControlInterpolant(interpolant: Interpolant) {
    const interpolants = this._controlInterpolants;
    const prevIndex = this.indices.get(interpolant)!;
    const firstInactiveIndex = --this._nActiveControlInterpolants;
    const lastActiveInterpolant = interpolants[firstInactiveIndex];

    this.indices.set(interpolant, firstInactiveIndex);
    interpolants[firstInactiveIndex] = interpolant;

    this.indices.set(lastActiveInterpolant, prevIndex);
    interpolants[prevIndex] = lastActiveInterpolant;
  }

  clipAction(clip: AnimationClip, blend: AnimationBlendMode = clip.blendMode) {
    const rootUuid = this.root.uuid;
    const clipUuid = clip.uuid;

    const actions = this.actionsByClip[clipUuid];

    if (actions) {
      const current = actions.actionByRoot[rootUuid];
      if (current?.blendMode === blend) return current;
    }
    const next = new AnimationAction(this, clip, blend);

    this._bindAction(next);
    this._addInactiveAction(next, clipUuid, rootUuid);

    return next;
  }

  update(deltaTime: number) {
    deltaTime *= this.timeScale;

    const actions = this._actions;
    const nActions = this._nActiveActions;
    const time = (this.time += deltaTime);
    const timeDirection = Math.sign(deltaTime);
    const accuIndex = (this.activeIndex ^= 1);

    for (let i = 0; i !== nActions; ++i) {
      const action = actions[i];

      action.update(time, deltaTime, timeDirection, accuIndex);
    }

    const bindings = this.bindings,
      nBindings = this._nActiveBindings;

    for (let i = 0; i !== nBindings; ++i) {
      bindings[i].apply(accuIndex);
    }

    return this;
  }

  setTime(timeSec: number) {
    this.time = 0;
    for (let i = 0; i < this._actions.length; i++) this._actions[i].time = 0;

    return this.update(timeSec);
  }
}

const _controlInterpolantsResultBuffer = new Float32Array(1);
