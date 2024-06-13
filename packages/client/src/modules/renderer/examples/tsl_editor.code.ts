// Simple uv.x animation
import { oscSine, texture, timerLocal, uniform, uv, vec2, vec4 } from '@modules/renderer/engine/nodes/Nodes.js';
import { ColorSpace, Wrapping } from '@modules/renderer/engine/constants.ts';
import { Color } from '@modules/renderer/engine/math/Color.ts';
import { TextureLoader } from '@modules/renderer/engine/loaders/TextureLoader.js';

const samplerTexture = await new TextureLoader().loadAsync('./textures/uv_grid_opengl.jpg');
samplerTexture.wrapS = Wrapping.Repeat;
samplerTexture.wrapT = Wrapping.Repeat;
samplerTexture.colorSpace = ColorSpace.SRGB;

// .5 is speed
const timer = timerLocal(0.5);
const uv0 = uv();
const animateUv = vec2(uv0.x.add(oscSine(timer)), uv0.y);

// label is optional
const myMap = texture(samplerTexture, animateUv).rgb.label('myTexture');
const myColor = uniform(new Color(0x0066ff)).label('myColor');
const opacity = 0.7;

// try add .temp( 'myVar' ) after saturation()
const desaturatedMap = myMap.rgb.saturation(0);

const finalColor = desaturatedMap.add(myColor);

export const output = vec4(finalColor, opacity);
