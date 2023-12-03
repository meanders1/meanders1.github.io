import { Particle, VERTICES_PER_PARTICLE, asVertices } from "./particle.js";
import { Vec2, tmpvec2 } from "./lib/vec2.js";
import { backgroundColor, findCanvasSize } from "./sketch.js";

class Simulation {
    constructor() {
        this.flowfield = [];
        this.RES = 8;
        this.particles = [];
        this.time = 0;
        this.img;
        this.colorCanvas = undefined;
        this.colorCtx = undefined;
        this.pixels;
        this.imgLoaded = false;
        this.imgWidth = 1;
        this.imgHeight = 1;
    }

    createParticles(count) {
        this.particles = [];
        for(let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    update() {
        for(let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.pos.x > 1 || p.pos.x < -1 || p.pos.y > 1 || p.pos.y < -1 || p.timeLeft <= 0) {
                this.reset(p);
            }
            this.particles[i].update(this.flowfield, this.imgWidth, this.imgHeight, this.RES);
        }
    }

    createFlowfield(img) {
        this.img = img;
        this.imgWidth = img.naturalWidth;
        this.imgHeight = img.naturalHeight;
        
        if(this.colorCanvas  == undefined || this.colorCtx == undefined) {
            this.colorCanvas = document.createElement("canvas");
            this.colorCanvas.id = "colorCanvas";
            this.colorCanvas.style.display = "none";
            this.colorCtx = this.colorCanvas.getContext("2d", { willReadFrequently: true });
        }
        this.colorCanvas.width = this.imgWidth;
        this.colorCanvas.height = this.imgHeight;
        this.colorCtx.clearRect(0, 0, this.colorCanvas.width, this.colorCanvas.height);
        this.colorCtx.drawImage(this.img, 0, 0, this.colorCanvas.width, this.colorCanvas.height);
        this.pixels = this.colorCtx.getImageData(0, 0, this.colorCanvas.width, this.colorCanvas.height).data;
        function pixel(pixels, i) {
            return [
                pixels[Math.floor(i * 4) + 0],
                pixels[Math.floor(i * 4) + 1],
                pixels[Math.floor(i * 4) + 2],
                pixels[Math.floor(i * 4) + 3]
            ];
        }

        //To flowfield
        this.flowfield = [];
        for (let y = 0; y < this.imgHeight / this.RES; y++) {
            this.flowfield[y] = [];
            for (let x = 0; x < this.imgWidth / this.RES; x++) {
                const p = pixel(this.pixels, (x * this.RES) + (y * this.RES) * this.colorCanvas.width);
                const greyscale = (p[0] * 0.3 + p[1] * 0.59 + p[2] * 0.11);
                // const greyscale = (p[0] + p[1] + p[2]) / 3;
                const n = greyscale / 255;
                this.flowfield[y].push({
                    v: n,
                    spawnable: p[3] != 0,
                });

            }
        }
    }

    reset(p) {
        p.pos.set(this.findParticlePos());
        p.vel.random(0.001);
        p.acc.set(0, 0);
        for(let i = 0; i < p.tail.length; i++) {
            p.tail[i].set(p.pos);
        }
        p.timeLeft = VERTICES_PER_PARTICLE;
        const col = this.pixelColor(p.pos);
        p.color = [col[0], col[1], col[2], 1];
        
        p.maxVel = (Math.random()*2 - 1)*0.001 + 0.002;
        p.updateCount = 0; 
    }

    pixelColor(pos) {
        let a = pos.clone();
        a.addN(1);
        a.divN(2);
        a.y = 1 - a.y; // Y in the img is down, y in the canvas is up 
        a.multV(new Vec2(this.imgWidth, this.imgHeight));
        a.floor();
        let i = a.x + a.y * this.colorCanvas.width;
        return [
            this.pixels[(i * 4) + 0]/255,
            this.pixels[(i * 4) + 1]/255,
            this.pixels[(i * 4) + 2]/255,
            this.pixels[(i * 4) + 3]/255
        ];
    }

    findParticlePos(attemps) {
        attemps = attemps||60;
        let a = 0;
        while (a<attemps) {
            a++;
            let pos = new Vec2(Math.random()*2 - 1, Math.random()*2 - 1);
            let node = this.closestFlowfieldNode(pos);
            if(node.y < 0 || node.x < 0) {
                console.log(pos, this.imgWidth, this.imgHeight)
            }
            if(this.flowfield[node.y][node.x].spawnable) {
                return pos;
            }
        }
        return new Vec2(Math.random()*2 - 1, Math.random()*2 - 1);
    }

    createParticle(attempts) {
        attempts = attempts||60;
        let pos = this.findParticlePos(attempts);
        const p = new Particle(pos);
        const color = this.pixelColor(pos);
        p.color = [color[0], color[1], color[2], 1];
        return p;
    }

    closestFlowfieldNode(pos) {
        tmpvec2.set(pos);
        tmpvec2.addN(1);
        tmpvec2.divN(2);
        tmpvec2.y = 1 - tmpvec2.y; // Y in the img is down, y in the canvas is up 
        tmpvec2.multV(new Vec2(this.imgWidth, this.imgHeight));
        tmpvec2.divN(this.RES);
        tmpvec2.floor();
        if (tmpvec2.x < 0 || tmpvec2.x >= this.flowfield[0].length || tmpvec2.y < 0 || tmpvec2.y >= this.flowfield.length) {
            return tmpvec2.set(-1, -1);
        }
        return tmpvec2;
    }
}

const FLOATS_PER_VERTEX = 6;

class Renderer {
    constructor(particleCount) {
        this.canvas;
        this.context;
        this.adapter;
        this.device;
        this.linePipeline;
        this.lineShaderModule;

        this.VERTICES_LENGTH = particleCount * VERTICES_PER_PARTICLE * FLOATS_PER_VERTEX;
        this.vertices = new Float32Array(this.VERTICES_LENGTH); //  format:  (X, Y,   R, G, B, A)
        this.vertexBuffer;

        this.init();
        this.doneInit = false;
    }

    async init() {
        this.doneInit = false;
        this.canvas = document.getElementById("mainCanvas");
        const dimensions = findCanvasSize();

        this.canvas.width = dimensions.w;
        this.canvas.height = dimensions.h;
        
        if (!navigator.gpu) {
            throw new Error("WebGPU not supported on this browser.");
        }
    
        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error("No appropriate GPUAdapter found.");
        }
    
        this.device = await this.adapter.requestDevice();
    
        // Canvas configuration
        this.context = this.canvas.getContext("webgpu");
        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: canvasFormat,
        });
        const vertexBufferLayout = {
            arrayStride: FLOATS_PER_VERTEX * 4/*Byts per float32*/,
            attributes: [{
                format: "float32x2",
                offset: 0,
                shaderLocation: 0, // Position. Matches @location(0) in the @vertex shader.
            }, {
                format: "float32x4",
                offset: 4 * 2,
                shaderLocation: 1,
            }],
        };
    
        this.vertexBuffer = this.device.createBuffer({
            label: "Line Vertices",
            size: this.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    
        let shaderCode = await fetch("./shader.wgsl").then((response) => response.text());
    
        this.lineShaderModule = this.device.createShaderModule({
            label: "Line shader",
            code: shaderCode
        });
    
        this.linePipeline = this.device.createRenderPipeline({
            label: "Line pipeline",
            layout: "auto",
            vertex: {
                module: this.lineShaderModule,
                entryPoint: "vertexMain",
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module: this.lineShaderModule,
                entryPoint: "fragmentMain",
                targets: [{
                    format: canvasFormat
                }]
            },
            primitive: {
                topology: "line-list"
            }
        });
        this.doneInit = true;
    }

    async draw(particles) {
        if(!this.doneInit) return;
        this.prepareVertices(particles);


        const encoder = this.device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: [backgroundColor[0], backgroundColor[1], backgroundColor[2], 1],
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.linePipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / FLOATS_PER_VERTEX);

        pass.end();
        this.device.queue.submit([encoder.finish()]);
    }

    prepareVertices(particles) {
        this.vertices = new Float32Array(this.VERTICES_LENGTH);

        let index = 0;
        let particleVertices;
        for(let i = 0; i < particles.length; i++) {
            particleVertices = particles[i].asVertices();
            for (let j = 0; j < particleVertices.length; j++) {
                for (let k = 0; k < particleVertices[j].length; k++) {
                    this.vertices[index] = particleVertices[j][k];
                    index++;
                }
            }
        }
        this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
    }

}

export { Simulation, Renderer };