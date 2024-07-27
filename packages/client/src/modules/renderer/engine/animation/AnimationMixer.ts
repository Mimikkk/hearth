import { AnimationAction } from './AnimationAction.js';
import { LinearInterpolant } from '../math/interpolants/LinearInterpolant.js';
import { PropertyBinding } from './PropertyBinding.js';
import { PropertyMixer } from './PropertyMixer.js';
import { AnimationClip } from './AnimationClip.js';
import { AnimationBlendMode } from '../constants.js';
import { Interpolant } from '@modules/renderer/engine/math/interpolants/Interpolant.js';

export class AnimationMixer {
  activeIndex: number;
  time: number;
  timeScale: number;
  _actions: AnimationAction[];
  _nActiveActions: number;
  _actionsByClip: Record<string, any>;
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

  constructor(public root: any) {
    this._actions = [];
    this._nActiveActions = 0;
    this._actionsByClip = {};
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

  _bindAction(action: AnimationAction, prototypeAction: AnimationAction) {
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
          // existing binding, make sure the cache knows

          if (binding.activeIndex === null) {
            ++binding.referenceCount;
            this._addInactiveBinding(binding, rootUuid, trackName);
          }

          continue;
        }

        const path = prototypeAction && prototypeAction.bindings[i].binding.parsedPath;

        binding = new PropertyMixer(
          PropertyBinding.create(root, trackName, path),
          track.ValueTypeName,
          track.getValueSize(),
        );

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
        // this action has been forgotten by the cache, but the user
        // appears to be still using it -> rebind

        const rootUuid = this.root.uuid,
          clipUuid = action.clip.uuid,
          actionsForClip = this._actionsByClip[clipUuid];

        this._bindAction(action, actionsForClip && actionsForClip.knownActions[0]);

        this._addInactiveAction(action, clipUuid, rootUuid);
      }

      const bindings = action.bindings;

      // increment reference counts / sort out state
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

      // decrement reference counts / sort out state
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
      actionsByClip = this._actionsByClip;

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

  _removeInactiveAction(action: AnimationAction) {
    const actions = this._actions,
      lastInactiveAction = actions[actions.length - 1],
      cacheIndex = action.activeIndex;

    lastInactiveAction.activeIndex = cacheIndex;
    actions[cacheIndex] = lastInactiveAction;
    actions.pop();

    action.activeIndex = null;

    const clipUuid = action.clip.uuid,
      actionsByClip = this._actionsByClip,
      actionsForClip = actionsByClip[clipUuid],
      knownActionsForClip = actionsForClip.knownActions,
      lastKnownAction = knownActionsForClip[knownActionsForClip.length - 1],
      byClipCacheIndex = action.clipActiveIndex;

    lastKnownAction.clipActiveIndex = byClipCacheIndex;
    knownActionsForClip[byClipCacheIndex] = lastKnownAction;
    knownActionsForClip.pop();

    action.clipActiveIndex = null;

    const actionByRoot = actionsForClip.actionByRoot,
      rootUuid = this.root.uuid;

    delete actionByRoot[rootUuid];

    if (knownActionsForClip.length === 0) {
      delete actionsByClip[clipUuid];
    }

    this._removeInactiveBindingsForAction(action);
  }

  _removeInactiveBindingsForAction(action: AnimationAction) {
    const bindings = action.bindings;

    for (let i = 0, n = bindings.length; i !== n; ++i) {
      const binding = bindings[i];

      if (--binding.referenceCount === 0) {
        this._removeInactiveBinding(binding);
      }
    }
  }

  _lendAction(action: AnimationAction) {
    // [ active actions |  inactive actions  ]
    // [  active actions >| inactive actions ]
    //                 s        a
    //                  <-swap->
    //                 a        s

    const actions = this._actions,
      prevIndex = action.activeIndex,
      lastActiveIndex = this._nActiveActions++,
      firstInactiveAction = actions[lastActiveIndex];

    action.activeIndex = lastActiveIndex;
    actions[lastActiveIndex] = action;

    firstInactiveAction.activeIndex = prevIndex;
    actions[prevIndex] = firstInactiveAction;
  }

  _takeBackAction(action: AnimationAction) {
    // [  active actions  | inactive actions ]
    // [ active actions |< inactive actions  ]
    //        a        s
    //         <-swap->
    //        s        a

    const actions = this._actions,
      prevIndex = action.activeIndex,
      firstInactiveIndex = --this._nActiveActions,
      lastActiveAction = actions[firstInactiveIndex];

    action.activeIndex = firstInactiveIndex;
    actions[firstInactiveIndex] = action;

    lastActiveAction.activeIndex = prevIndex;
    actions[prevIndex] = lastActiveAction;
  }

  _addInactiveBinding(binding: PropertyBinding, rootUuid: string, trackName: string) {
    const bindingsByRoot = this.bindingsByRootAndName,
      bindings = this.bindings;

    let bindingByName = bindingsByRoot[rootUuid];

    if (bindingByName === undefined) {
      bindingByName = {};
      bindingsByRoot[rootUuid] = bindingByName;
    }

    bindingByName[trackName] = binding;

    binding.activeIndex = bindings.length;
    bindings.push(binding);
  }

  _removeInactiveBinding(binding: PropertyBinding) {
    const bindings = this.bindings,
      propBinding = binding.binding,
      rootUuid = propBinding.rootNode.uuid,
      trackName = propBinding.path,
      bindingsByRoot = this.bindingsByRootAndName,
      bindingByName = bindingsByRoot[rootUuid],
      lastInactiveBinding = bindings[bindings.length - 1],
      cacheIndex = binding.activeIndex;

    lastInactiveBinding.activeIndex = cacheIndex;
    bindings[cacheIndex] = lastInactiveBinding;
    bindings.pop();

    delete bindingByName[trackName];

    if (Object.keys(bindingByName).length === 0) {
      delete bindingsByRoot[rootUuid];
    }
  }

  _lendBinding(binding: PropertyBinding) {
    const bindings = this.bindings,
      prevIndex = binding.activeIndex,
      lastActiveIndex = this._nActiveBindings++,
      firstInactiveBinding = bindings[lastActiveIndex];

    binding.activeIndex = lastActiveIndex;
    bindings[lastActiveIndex] = binding;

    firstInactiveBinding.activeIndex = prevIndex;
    bindings[prevIndex] = firstInactiveBinding;
  }

  _takeBackBinding(binding: PropertyBinding) {
    const bindings = this.bindings,
      prevIndex = binding.activeIndex,
      firstInactiveIndex = --this._nActiveBindings,
      lastActiveBinding = bindings[firstInactiveIndex];

    binding.activeIndex = firstInactiveIndex;
    bindings[firstInactiveIndex] = binding;

    lastActiveBinding.activeIndex = prevIndex;
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

      interpolant.__cacheIndex = lastActiveIndex;
      interpolants[lastActiveIndex] = interpolant;
    }

    return interpolant;
  }

  _takeBackControlInterpolant(interpolant: Interpolant) {
    const interpolants = this._controlInterpolants,
      prevIndex = interpolant.__cacheIndex,
      firstInactiveIndex = --this._nActiveControlInterpolants,
      lastActiveInterpolant = interpolants[firstInactiveIndex];

    interpolant.__cacheIndex = firstInactiveIndex;
    interpolants[firstInactiveIndex] = interpolant;

    lastActiveInterpolant.__cacheIndex = prevIndex;
    interpolants[prevIndex] = lastActiveInterpolant;
  }

  clipAction(clip: AnimationClip, blendMode: AnimationBlendMode) {
    const rootUuid = this.root.uuid;
    const clipUuid = clip.uuid;

    const actionsForClip = this._actionsByClip[clipUuid];
    let prototypeAction = null;

    if (blendMode === undefined) {
      if (clip !== null) {
        blendMode = clip.blendMode;
      } else {
        blendMode = AnimationBlendMode.Normal;
      }
    }

    if (actionsForClip !== undefined) {
      const existingAction = actionsForClip.actionByRoot[rootUuid];

      if (existingAction !== undefined && existingAction.blendMode === blendMode) {
        return existingAction;
      }

      // we know the clip, so we don't have to parse all
      // the bindings again but can just copy
      prototypeAction = actionsForClip.knownActions[0];

      // also, take the clip from the prototype action
      if (clip === null) clip = prototypeAction.clip;
    }
    const newAction = new AnimationAction(this, clip, blendMode);

    this._bindAction(newAction, prototypeAction);
    this._addInactiveAction(newAction, clipUuid, rootUuid);

    return newAction;
  }

  update(deltaTime: number) {
    deltaTime *= this.timeScale;

    const actions = this._actions,
      nActions = this._nActiveActions,
      time = (this.time += deltaTime),
      timeDirection = Math.sign(deltaTime),
      accuIndex = (this.activeIndex ^= 1);

    // run active actions

    for (let i = 0; i !== nActions; ++i) {
      const action = actions[i];

      action.update(time, deltaTime, timeDirection, accuIndex);
    }

    // update scene graph

    const bindings = this.bindings,
      nBindings = this._nActiveBindings;

    for (let i = 0; i !== nBindings; ++i) {
      bindings[i].apply(accuIndex);
    }

    return this;
  }

  setTime(timeInSeconds: number) {
    this.time = 0; // Zero out time attribute for AnimationMixer object;
    for (let i = 0; i < this._actions.length; i++) {
      this._actions[i].time = 0; // Zero out time attribute for all associated AnimationAction objects.
    }

    return this.update(timeInSeconds); // Update used to set exact time. Returns "this" AnimationMixer object.
  }
}

const _controlInterpolantsResultBuffer = new Float32Array(1);
