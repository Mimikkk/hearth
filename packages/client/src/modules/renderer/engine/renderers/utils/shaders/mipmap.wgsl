@group(0) @binding(0)
var image_sampler: sampler;
@group(0) @binding(1)
var image: texture_2d<f32>;

struct OutStruct {
	@builtin(position) position: vec4<f32>,
	@location(0) vertexTextureCoord: vec2<f32>
};

const VertexPositions = array<vec4<f32>, 4>(
  vec4<f32>(-1.0, 1.0, 0.0, 1.0),
  vec4<f32>(1.0,  1.0, 0.0, 1.0),
  vec4<f32>(-1.0, -1.0, 0.0, 1.0),
  vec4<f32>(1.0, -1.0, 0.0, 1.0)
);

const TexturePositions = array<vec2<f32>, 4>(
  vec2<f32>(0.0, 0.0),
  vec2<f32>(1.0, 0.0),
  vec2<f32>(0.0, 1.0),
  vec2<f32>(1.0, 1.0)
);

@vertex
fn vertex(@builtin(vertex_index) vertex_index: u32) -> OutStruct {
  return OutStruct(VertexPositions[vertex_index], TexturePositions[vertex_index]);
}

@fragment
fn fragment_noflip_y(@location(0) vertex_texture_coord: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(image, image_sampler, vertex_texture_coord);
}

@fragment
fn fragment_flip_y(@location(0) vertex_texture_coord: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(image, image_sampler, vec2(vertex_texture_coord.x, 1.0 - vertex_texture_coord.y));
}
