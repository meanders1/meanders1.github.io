struct VertexOut {
    @builtin(position) position: vec4f,
    @location(1) color: vec4f, 
}

@vertex
fn vertexMain(@location(0) position: vec2f, @location(1) col: vec4f) -> VertexOut {
    var out: VertexOut;
    out.position = vec4f(position, 0, 1);
    out.color = col;
    return out;
}

@fragment
fn fragmentMain(input: VertexOut) -> @location(0) vec4f {
    return vec4f(input.color.xyz, 1);
}