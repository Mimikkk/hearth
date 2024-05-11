// Simple uv.x animation
import { texture, uniform, vec2, vec4, uv, oscSine, timerLocal } from '../threejs/nodes/Nodes.js';
import { ColorSpace, Wrapping } from '../threejs/constants.ts';
import { Color } from '../threejs/math/Color.ts';
import { TextureLoader } from '../threejs/loaders/TextureLoader.js';

const samplerTexture = new TextureLoader().load('./textures/uv_grid_opengl.jpg');
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
