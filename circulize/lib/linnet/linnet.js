import {tmpvec2, Vec2} from "./vec2.js"

const shaderSource = `
struct Vertex {
    @location(0) pos: vec2f,
    @location(1) color: vec4f,
    @location(2) texCoords: vec2f,
};

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(1) color: vec4f, 
    @location(2) texCoords: vec2f,
};

struct Uniforms {
    color: vec4f,
};

@binding(0) @group(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(in: Vertex) -> VertexOut {
    var out: VertexOut;
    out.position = vec4f(in.pos, 0, 1);
    out.color = in.color;
    out.texCoords = in.texCoords;
    return out;
}

@group(0) @binding(1) var theSampler: sampler;
@group(0) @binding(2) var theTexture: texture_2d<f32>;

@fragment
fn fragmentMain(input: VertexOut) -> @location(0) vec4f {
    return (uniforms.color * input.color) * textureSample(theTexture, theSampler, input.texCoords);
}`;

const BYTES_PER_FLOAT32 = 4;
class Vertex {
    constructor(pos, color, texCoords) {
        this.pos = pos.clone();
        this.color = color;
        this.texCoords = texCoords.clone();
    }

    asFloats() {
        const arr = new Float32Array(Vertex.floatSize());
        arr[0] = this.pos.x;
        arr[1] = this.pos.y;
        arr[2] = this.color[0];
        arr[3] = this.color[1];
        arr[4] = this.color[2];
        arr[5] = this.color[3];
        arr[6] = this.texCoords.x;
        arr[7] = this.texCoords.y;
        return arr;
    }

    static floatSize() {
        return 8; //Amount of floats
    }

    static byteSize() {
        return Vertex.floatSize()*BYTES_PER_FLOAT32;
    }
}

const VERTICES_PER_QUAD = 6;

class Quad {
    // STRUCTURE:
    // 0 - 1
    // |   |
    // 3 - 2

    constructor(pos, scale, rotation, color, anchor) {
        this.vertices = [];
        anchor = anchor || new Vec2(0, 0);

        const pos1 = new Vec2(-1,  1); 
        const pos2 = new Vec2( 1,  1); 
        const pos3 = new Vec2( 1, -1); 
        const pos4 = new Vec2(-1, -1);

        pos1.subV(anchor).multV(scale).rotate(rotation).addV(pos);
        pos2.subV(anchor).multV(scale).rotate(rotation).addV(pos);
        pos3.subV(anchor).multV(scale).rotate(rotation).addV(pos);
        pos4.subV(anchor).multV(scale).rotate(rotation).addV(pos);

        this.vertices = [
            new Vertex(pos1, color, tmpvec2.set(0, 1)),
            new Vertex(pos2, color, tmpvec2.set(1, 1)),
            new Vertex(pos3, color, tmpvec2.set(1, 0)),
            new Vertex(pos4, color, tmpvec2.set(0, 0)),
        ];
    }

    asFloats() {
        const arr = new Float32Array(Vertex.floatSize() * VERTICES_PER_QUAD);
        let index = 0;

        // function addVertex(vert) {
        //     const f = vert.asFloats();
        //     const len = f.length
        //     for (let j = 0; j < len; j++) {
        //         arr[index] = f[j];
        //         index++;
        //     }
        // }
        // addVertex(this.vertices[0]);
        // addVertex(this.vertices[1]);
        // addVertex(this.vertices[2]);
        // addVertex(this.vertices[0]);
        // addVertex(this.vertices[2]);
        // addVertex(this.vertices[3]);

        
        arr.set(this.vertices[0].asFloats(), index); index += Vertex.floatSize();
        arr.set(this.vertices[1].asFloats(), index); index += Vertex.floatSize();
        arr.set(this.vertices[2].asFloats(), index); index += Vertex.floatSize();
        arr.set(this.vertices[0].asFloats(), index); index += Vertex.floatSize();
        arr.set(this.vertices[2].asFloats(), index); index += Vertex.floatSize();
        arr.set(this.vertices[3].asFloats(), index); index += Vertex.floatSize();
       
        
        return arr;
    }

    static vertexSize() {
        return VERTICES_PER_QUAD;
    }

    static floatSize() {
        return Vertex.floatSize() * VERTICES_PER_QUAD;
    }

    static byteSize() {
        return Vertex.byteSize() * VERTICES_PER_QUAD; 
    }
}

class Renderer {
    // Descriptor structure: 
    // {
    //     textureUrl,
    //     ?canvas,
    //     ?antialias,
    //     ?maxQuads,
    // };
    constructor(descriptor) {
        this.descriptor = descriptor;
        if(!descriptor) {
            console.error("Descriptor is undefined. Decriptor: " + descriptor);
            return;
        }
        if(!descriptor.textureUrl) {
            console.error("Descriptor is invalid. \"textureUrl\" must be defined");
            return;
        }
        if(!descriptor.canvas) {
            this.canvas = document.createElement("canvas");
        } else {
            this.canvas = descriptor.canvas;
        }
        this.descriptor.antialias = this.descriptor.antialias || true;
        this.descriptor.maxQuads = this.descriptor.maxQuads || 1;
        this.textureUrl = descriptor.textureUrl;

        this.context;
        this.device;
        this.vertexBuffer;
        this.backgroundColor = [0, 0, 0, 1];
        this.globalTint = [1, 1, 1, 1];

        this.doneInit = false;
        this.init(this.descriptor.maxQuads);
    }

    async canvasResized() {
        const sampleCount = 4;
        this.doneInit = false;
        if(this.descriptor.antialias) {
            //Antialiasing
            this.aaTexture = this.device.createTexture({
                size: [this.canvas.width, this.canvas.height],
                sampleCount: sampleCount,
                format: navigator.gpu.getPreferredCanvasFormat(),
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            this.aaView = this.aaTexture.createView();
        }

        this.doneInit = true;
    }

    async init(quadCount) {
        this.doneInit = false;
        if (!navigator.gpu) {
            alert("WebGPU not supported on this browser.");
            throw new Error("WebGPU not supported on this browser.");
        }
    
        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error("No appropriate GPUAdapter found.");
        }
        
        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext("webgpu");

        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: canvasFormat,
            alphaMode: "premultiplied",
        });
        
        let shaderCode = shaderSource;

        this.shaderModule = this.device.createShaderModule({
            label: "Shader Module",
            code: shaderCode,
        });
        
        this.vertexBuffer = new VertexBuffer(this, "Vertex Buffer", quadCount*Quad.vertexSize());
        
        const sampleCount = 4;
        const pipelineDescriptor = {
            label: "Pipeline",
            layout: "auto",
            vertex: {
                module: this.shaderModule,
                entryPoint: "vertexMain",
                buffers: [this.vertexBuffer.layout]
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fragmentMain",
                targets: [{
                    format: canvasFormat,
                    blend: {
                        color: {
                            srcFactor: "one",
                            dstFactor: "one-minus-src-alpha",
                        },
                        alpha: {
                            srcFactor: "one",
                            dstFactor: "one-minus-src-alpha",
                        }
                    }
                }],
            },
            primitive: {
                toplogy: "triangle-list",
                frontFace: "cw",
                cullMode: "back",
            },
        };
        if(this.descriptor.antialias) {
            pipelineDescriptor.multisample = {
                count: sampleCount,
            };
        }
        this.pipeline = this.device.createRenderPipeline(pipelineDescriptor);

        //TEXTURE
        this.texture = new Texture(this.textureUrl);
        await this.texture.init(this);
        const uniformBufferSize = BYTES_PER_FLOAT32 * 4; // vec4f color

        this.uniformBuffer = this.device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                    }
                },
                {
                    binding: 1,
                    resource: this.texture.sampler,
                }, 
                {
                    binding: 2, 
                    resource: this.texture.texture.createView()
                },
            ],
        });


        if(this.descriptor.antialias) {
            //Antialiasing
            this.aaTexture = this.device.createTexture({
                size: [this.canvas.width, this.canvas.height],
                sampleCount: sampleCount,
                format: canvasFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            this.aaView = this.aaTexture.createView();
        }
        this.doneInit = true; 
    }

    quadsToVertices(quads) {
        let lengthVertices = quads.length * Quad.vertexSize();
        if(this.vertexBuffer.vertexSize() < lengthVertices) {
            const bufferLabel = this.vertexBuffer.label;
            lengthVertices *= 1.5;
            console.log("Allocating new buffer to replace \"" + bufferLabel + "\". Previous length: " + this.vertexBuffer.vertexSize() + " vertices. Requested length: " + quads.length * Quad.vertexSize() + " vertices. New length " + lengthVertices + " vertices.")
            this.vertexBuffer = new VertexBuffer(this, bufferLabel, lengthVertices);
        }
        this.floats = new Float32Array(lengthVertices*Vertex.floatSize());
        let index = 0;
        for(let i = 0; i < quads.length; i++) {
            const f = quads[i].asFloats();
            for(let j = 0; j < f.length; j++) {
                this.floats[index] = f[j];
                index++;
            }
        }

        this.vertexBuffer.setFloats(this, this.floats);
    }

    async draw(quads) {
        if(!this.doneInit || quads.length == 0) return;

        this.quadsToVertices(quads);

        this.device.queue.writeBuffer(
            this.uniformBuffer,
            0, 
            new Float32Array(this.globalTint)
        );

        const encoder = this.device.createCommandEncoder();
        const renderPassDescriptor = {
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: this.backgroundColor,
                loadOp: "clear",
                storeOp: "store",
            }]
        };
        if(this.descriptor.antialias) {
            renderPassDescriptor.colorAttachments[0].view = this.aaView;
            renderPassDescriptor.colorAttachments[0].resolveTarget = this.context.getCurrentTexture().createView();
        }
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer.buffer);
        pass.draw(quads.length*Quad.vertexSize());

        pass.end();
        this.device.queue.submit([encoder.finish()]);
    }
}

class Texture {
    constructor(url, usage) {
        this.usage = usage || GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;
        this.texture;
        this.url = url;
        this.view;
    }

    async init(renderer) {
        const response = await fetch(this.url);
        const blob = await response.blob();
        const imgBitmap = await createImageBitmap(blob);

        const textureDescriptor = {
            size: [imgBitmap.width, imgBitmap.height /* ,1 */],
            format: "rgba8unorm",
            usage: 
                GPUTextureUsage.TEXTURE_BINDING | 
                GPUTextureUsage.COPY_DST | 
                GPUTextureUsage.RENDER_ATTACHMENT, 
        };
        this.texture = renderer.device.createTexture(textureDescriptor);

        renderer.device.queue.copyExternalImageToTexture(
            { source: imgBitmap }, 
            { texture: this.texture }, 
            [imgBitmap.width, imgBitmap.height]
        );

        // const viewDescriptor = {
        //     format: "rgba8unorm",
        //     dimension: "2d",
        //     aspect: "all",
        //     baseMipLevel: 0,
        //     mipLevelCount: 1,
        //     baseArrayLayer: 0,
        //     arrayLayerCount: 1,
        // };

        // const samplerDescriptor = {
        //     addessModeU: "repeat",
        //     addressModeV: "repeat",
        //     magFilter: "linear",
        //     minFilter: "nearest",
        //     mipmapFilter: "nearest",
        //     maxAnisotropy: 1
        // };

        this.sampler = renderer.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });
    }
}

class VertexBuffer {
    constructor(renderer, label, vertexLength) {
        this.layout = {
            arrayStride: Vertex.byteSize(),
            attributes: [{
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            }, {
                format: "float32x4",
                offset: 2*BYTES_PER_FLOAT32,
                shaderLocation: 1,
            }, {
                format: "float32x2",
                offset: 2*BYTES_PER_FLOAT32 + 4*BYTES_PER_FLOAT32,
                shaderLocation: 2,
            }],
        };
        this.buffer = renderer.device.createBuffer({
            label: label,
            size: vertexLength*Vertex.byteSize(),
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.label = label;
        this.vertexCount = vertexLength;
    }

    vertexSize() {
        return this.vertexCount;
    }

    byteSize() {
        return this.vertexSize() * Vertex.byteSize();
    }

    setFloats(renderer, floats, start=0) {
        renderer.device.queue.writeBuffer(this.buffer, start, floats);
    }
}

export { Renderer, Quad };