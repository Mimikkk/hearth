# Hearth

Reimagining of the [three.js](https://github.com/mrdoob/three.js) engine with full typescript supported. Hearth is a
rendering engine written in typescript
and WebGPU API. It is designed to be a simple-to-use engine for creating renderable scenes in the browser.

base difference between three.js and Hearth:

- **WebGPU**: Hearth is built on top of the WebGPU API, which is the successor to WebGL. It does not support
  WebGL.
- **Typescript**: Hearth is fully written in typescript.
- **Vite**: Hearth uses Vite/esbuild as the build tool for hmr and bundling.
- **Buffer management**: Hearth uses a single buffer class to manage all the buffers, which makes it easier to manage
  buffers and reduces the number of buffer objects created without overly complicating the buffer management as it is in
  three.js.
- **Materials, textures, and other elements**: Instead of providing parameters to the material, texture, and other
  elements, Hearth uses a single object to manage all the parameters of the material, texture, and other elements.
- **Loaders are working in sync/async modes**
- **Entities**: Hearth also has changed how classes work in the engine by using a more modern approach to classes and
  feature inheritance. With more reliance on composition over inheritance.
- **Math**: Hearth reworked math classes to be more typesafe and easier to use with modern typescript features.
- **Shader Graph**: Hearth version does not use proxy objects to create shaders which makes it easier to create custom
  shader node classes and use them in the shader graph. Shader graph system is more direct and less resource
  intensive this way. Its also typed. unlike three.js mess.
- **Engine**: The renderer and the engine are Not separated in Hearth. The renderer is a component of the hearth. The
  same goes for all the needless classes that three.js had. Hearth is more modular, more concise, and more typesafe.

##### Currently, a work in progress prototype and not ready for production use.

##### Check out [caniuse.com](https://caniuse.com/webgpu) to see if your browser supports WebGPU.

## Features

- **Shader Graph**: Hearth has a shader graph system that allows you to create custom shaders without writing code.
- **Scene Graph**: Hearth has a scene graph system that allows you to create a hierarchy of objects.
- **Asset Management**: Hearth has an asset management system that allows you to load and manage assets.
- **Animation System**: Hearth has an animation system that allows you to animate objects in your scenes.
- **Sound System**: Hearth has a sound system that allows you to play sounds within your scenes.

##### Remaining features to work on

- Casting and receiving shadows are currently broken.
- Most of the examples need to be updated to the new API.
- Documentation is work in progress.
- The API is not stable and may change after publishing.
- The prototype is not published as npm yet.
- The prototype is not ready for production use.
- The prototype examples page is not ready for publication.
- The shader graph is still to be polished out and tested.
- Remove the rest of inheritance from the engine and use composition instead.
- Merge mesh classes into one to reduce the class bloat.
- Split Entity into behavioural components to make it more flexible over current implementation.

**Planned release date** - mid 2025 (just kidding, I have no idea)
