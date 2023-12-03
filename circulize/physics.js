import { Vec2, tmpvec2 } from "./lib/linnet/vec2.js";
import { width, height, img } from "./scripts.js";
import { Timer, Tools, Random } from "./lib/extra.js";

const dt = 0.1;//0.14;
function constrain(v, min, max) {
    return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) {
    return a + t*(b - a);
}

function coverSize(current, max) {
    const maxWidth = max.w;
	const maxHeight = max.h;
	
	const vertScale = maxHeight/current.h;
	const horiScale = maxWidth/current.w;
	const scale = Math.max(vertScale, horiScale);
	
	const w = current.w * scale;
	const h = current.h * scale;

	return {
		w:w,
		h:h
	};
}

class Solver {
    constructor(seed, particleCount) {
        this.objects = [];

        this.constraintPos = new Vec2(0, 0);
        this.constraintRadius = 1;
        
        this.grid = new Grid(new Vec2(-1, -1), new Vec2(1, 1));

        this.largestRadius = 0;

        if (arguments.length > 0) {
            this.seed = seed;

            let canvas = document.createElement("CANVAS");
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext("2d", { willReadFrequently: true });
            
            const dimensions = coverSize(
                {w: img.naturalWidth, h: img.naturalHeight},
                {w: width, h: height}
            );
            ctx.drawImage(img, -(dimensions.w - width)/2, -(dimensions.h - height)/2, dimensions.w, dimensions.h);
            
            const CIRCLE_RADIUS = 1;
            const NUM_PARTICLES = particleCount; 

            // The below densities are found to be the best ones for their repective particle counts. Variation was 0.01
            // <=13 - 0.66
            //  100 - 0.76
            //  300 - 0.79
            //  500 - 0.8
            //  800 - 0.8
            // 1358 - 0.79
            // 2000 - 0.76
            // 3000 - 0.74
            // 4000 - 0.63
            
            const knownDensities = [
                [13,   0.66],
                [100,  0.76],
                [300,  0.79],
                [500,  0.8 ],
                [800,  0.8 ],
                [1358, 0.79],
                [2000, 0.76],
                [3000, 0.74],
                [4000, 0.63],
            ];

            let pd;
            if(NUM_PARTICLES < knownDensities[0][0]) {
                pd = knownDensities[0][1];
            } else if(NUM_PARTICLES > knownDensities[knownDensities.length-1][0]) {
                pd = knownDensities[knownDensities.length-1][1];
            } else {
                for(let i = 0; i < knownDensities.length-1; i++) {
                    const amtParticles = knownDensities[i][0];
                    const density = knownDensities[i][1];
                    const p0 = amtParticles;
                    const p1 = knownDensities[i+1][0];
                    const d0 = density;
                    const d1 = knownDensities[i+1][1];
                    
                    if(NUM_PARTICLES < p1) {
                        const t = (NUM_PARTICLES - p0) / (p1 - p0);
                        pd = lerp(d0, d1, t);
                        break;
                    }
                }
            }

            const packingDensity = pd;
            
            const averageArea = (CIRCLE_RADIUS*CIRCLE_RADIUS*Math.PI * packingDensity) / (NUM_PARTICLES);
            const averageRadius = Math.sqrt(averageArea/Math.PI);
            const variation = 0.01;
            
            const MIN_PARTICLE_SIZE = averageRadius - variation;
            const MAX_PARTICLE_SIZE = averageRadius + variation;
            // Simulate
            let simulationTimer = new Timer();
            let ps = this.simulate(
                seed,
                CIRCLE_RADIUS,
                NUM_PARTICLES,
                MIN_PARTICLE_SIZE,
                MAX_PARTICLE_SIZE
            );
            console.log("Completed - " + simulationTimer.seconds() + "s");

            // Assign colors
            let colorTimer = new Timer();
            console.log("Assigning colors");
            this.assignColors(ps, ctx);
            console.log("Completed - " + colorTimer.seconds() + "s");

            this.emitter = new Emitter(
                CIRCLE_RADIUS,
                seed,
                MIN_PARTICLE_SIZE,
                MAX_PARTICLE_SIZE,
                NUM_PARTICLES,
                ps
            );
        }
    }

    simulate(seed, circleRadius, numParticles, minParticleSize, maxParticleSize) {
        let simulation = new Solver();

        const CIRCLE_RADIUS = circleRadius;
        const MAX_RUNS = Math.max(Math.floor(numParticles * 1.3), 100);
        const MAX_PARTICLES = numParticles;
        const MAX_PARTICLE_SIZE = maxParticleSize;

        console.log(
            "Started simulation - " +
            MAX_RUNS +
            " runs, " +
            MAX_PARTICLES +
            " particles"
        );

        // Emitter
        let emitter = new Emitter(
            CIRCLE_RADIUS,
            seed,
            minParticleSize,
            MAX_PARTICLE_SIZE,
            numParticles
        );

        for(let runs = 0; runs < MAX_RUNS; runs++) {
            simulation.update(dt);

            let p = emitter.nextParticle();
            if (p != undefined) simulation.addObject(p);
        }
        return simulation.objects;
    }

    assignColors(particles, context) {
        let imageData = context.getImageData(0, 0, width, height).data;

        function getColor(x, y) {
            let i = (y * context.canvas.width + x) * 4;
            return [imageData[i], imageData[i + 1], imageData[i + 2]];
        }

        for (let p of particles) {
            const x = Tools.positiveRound(p.pos.x * (width / 2) + width / 2);
            const y = Tools.positiveRound(height-(p.pos.y * (height / 2) + height / 2));
            const r = Tools.positiveRound(p.radius * (width / 2));

            const rSq = r * r;

            let sumRed = 0;
            let sumGreen = 0;
            let sumBlue = 0;

            let amtPixels = 0;

            for (let i = Math.max(y - r, 0); i < Math.min(y + r, height); i++) {
                for (let j = Math.max(x - r, 0); j < Math.min(x + r, width); j++) {
                    let px = j;
                    let py = i;

                    let deltay = py - y;
                    let deltax = px - x;
                    let prSq = deltay * deltay + deltax * deltax;
                    if (prSq < rSq) {
                        let c = getColor(px, py);

                        sumRed += c[0];
                        sumGreen += c[1];
                        sumBlue += c[2];
                        amtPixels++;
                    }
                }
            }
            p.color = [
                (sumRed / amtPixels) / 255,
                (sumGreen / amtPixels) / 255,
                (sumBlue / amtPixels) / 255,
                1
            ];
        }
    }

    update() {
        if (this.emitter != undefined) {
            let p = this.emitter.nextParticle();
            if (p != undefined) this.addObject(p);
        }

        const subSteps = 6;
        const subDt = dt / subSteps;
        for (let i = 0; i < subSteps; i++) {
            this.applyGravity();
            this.applyConstraint();
            this.solveCollisions();
            this.updatePositions(subDt);
        }
    }

    applyGravity() {
        const gravity = new Vec2(0, -1 / 40);
        for(let obj of this.objects) {
            tmpvec2.set(gravity);
            tmpvec2.multN(obj.mass);
            obj.applyForce(tmpvec2);
        }
    }

    toCenter() {
        for (let p of this.objects) {
            tmpvec2.set(p.pos);
            tmpvec2.negate();
            tmpvec2.normalize().multN(0.1);
            p.accelerate(tmpvec2);
        }
    }

    applyForce(force) {
        for (let p of this.objects) {
            p.accelerate(force);
        }
    }

    updatePositions(dt) {
        for (let p of this.objects) {
            p.updatePosition(dt);
        }
    }

    solveCollision(a, b) {
        tmpvec2.set(a.pos);
        tmpvec2.subV(b.pos);
        const dist = tmpvec2.len();
        const minDist = a.radius + b.radius;
        if(dist < minDist) {
            tmpvec2.divN(dist);
            const delta = minDist - dist;
            tmpvec2.multN(delta * 0.5);
            a.pos.addV(tmpvec2);
            b.pos.subV(tmpvec2);
        }
    }

    solveCellCollisions(cell1, cell2) {
        for(let obj1Idx of cell1) {
            for(let obj2Idx of cell2) {
                if(obj1Idx == obj2Idx) continue;
                if(PhysicsObject.intersects(this.objects[obj1Idx], this.objects[obj2Idx])) {
                    this.solveCollision(this.objects[obj1Idx], this.objects[obj2Idx]);
                }
            }
        }
    }

    solveCollisions() {
        this.grid.assignCells(this.objects, this.largestRadius);
        for(let y = 0; y < this.grid.amtCellsY-1; y++) {
            for(let x = 0; x < this.grid.amtCellsX-1; x++) {
                const thisCell = this.grid.cell(x, y);
                for(let dy = -1; dy <= 1; dy++) {
                    for(let dx = -1; dx <= 1; dx++) {
                        this.solveCellCollisions(thisCell, this.grid.cell(constrain(x + dx, 0, this.grid.amtCellsX-1), constrain(y + dy, 0, this.grid.amtCellsY-1)));
                    }
                }
            }
        }
    }

    applyConstraint() {
        // Keep in constraint
        const constraintPos = this.constraintPos;
        const constraintRadius = this.constraintRadius;
        for(let obj of this.objects) {
            const toObj = Vec2.subV(obj.pos, constraintPos);
            const distSq = toObj.lenSq();
            if(distSq > (constraintRadius - obj.radius)*(constraintRadius - obj.radius)) {
                const n = Vec2.normalized(toObj);
                obj.pos = Vec2.addV(constraintPos, Vec2.multN(n, constraintRadius - obj.radius));
            }
        }
    }

    addObject(obj) {
        if(obj.radius > this.largestRadius) {
            this.largestRadius = obj.radius;
        }
        this.objects.push(obj);
    }
}

class Grid {
    constructor(topLeft, bottomRight) {
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
        this.largestRadius = 0;
        this.cells = [];
        this.amtCellsX = 0;
        this.amtCellsY = 0;
    }

    assignCells(objects, largestRadius) {
        if(objects.length == 0 || largestRadius <= 0) return;

        const cellSize = largestRadius * 2;
        for(let i = 0; i < this.cells.length; i++) {
            this.cells[i] = [];
        }
        if(largestRadius != this.largestRadius) {
            this.amtCellsX = Math.ceil(this.spaceWidth() / cellSize) +1;
            this.amtCellsY = Math.ceil(this.spaceHeight() / cellSize)+1;
            const amtCells = this.amtCellsX * this.amtCellsY;
            if(this.cells.length < amtCells) {
                const len =  amtCells - this.cells.length;
                for(let i = 0; i < len; i++) {
                    this.cells.push([]);
                }
            } else if(this.cells.length > amtCells) {
                const len = this.cells.length - amtCells;
                for(let i = 0; i < len; i++) {
                    this.cells.pop();
                }
            }

            this.largestRadius = largestRadius;
        } 

        const objectOffset = this.topLeft;
        for(let i = 0; i < objects.length; i++) {
            const positionWithOffset = Vec2.subV(objects[i].pos, objectOffset);
            const cellX = Math.floor(positionWithOffset.x / cellSize);
            const cellY = Math.floor(positionWithOffset.y / cellSize);
            const cellIndex = cellX + cellY * this.amtCellsX;
            if(cellIndex >= 0 && cellIndex < this.cells.length) {
                this.cells[cellIndex].push(i);
            } else {
                console.log("object outside of grid");
            }
        }
    }

    cell(x, y) {
        return this.cells[x + y * this.amtCellsX];
    }

    setPosition(topLeft, bottomRight) {
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }

    spaceHeight() {
        return this.bottomRight.y - this.topLeft.y;
    }
    spaceWidth() {
        return this.bottomRight.x - this.topLeft.x;
    }
}

class PhysicsObject {
    constructor(pos, r) {
        this.pos = pos;
        this.lastPos = pos.clone();
        this.acc = new Vec2(0, 0);
        this.radius = r;
        this.mass = Math.PI * r * r;
        this.color = [0.5, 0.5, 0.5, 1];
    }

    updatePosition(dt) {
        const vel = Vec2.subV(this.pos, this.lastPos);
        this.lastPos.set(this.pos);
        this.pos = Vec2.addV(this.pos, Vec2.addV(vel, Vec2.multN(this.acc, dt*dt)));
        this.acc.set(0, 0);
    }

    accelerate(acc) {
        this.acc.addV(acc);
    }

    applyForce(force) {
        this.acc.addV(Vec2.divN(force, this.mass));
    }

    static intersects(o1, o2) {
        const a = o1.radius + o2.radius;
        const dx = o1.pos.x - o2.pos.x;
        const dy = o1.pos.y - o2.pos.y;
        
        return (dx * dx + dy * dy) < a * a;
    }

}

class Emitter {
    constructor(radius, seed, minRadius, maxRadius, numParticles, particles) {
        this.pos = new Vec2(0, -radius * 0.8);
        this.rotSpeed = 0.03;
        this.emitSpeed = radius / 30;
        this.rng = new Random(seed);
        this.minPR = minRadius;
        this.maxPR = maxRadius;
        if (arguments.length > 4) {
            this.maxParticles = numParticles;
        }
        if (arguments.length == 6) {
            this.particles = particles;
        }
        this.amtP = 0;
        this.stopped = false;
    }

    nextParticle() {
        if (this.maxParticles != undefined && this.amtP >= this.maxParticles) {
            this.stopped = true;
            return undefined;
        }

        this.pos.rotate(this.rotSpeed);
        let p = new PhysicsObject(
            this.pos.clone(),
            this.rng.nextFloat() * (this.maxPR - this.minPR) + this.minPR
        );
        let lastposOffset = this.pos.clone();
        lastposOffset.normalize().multN(this.emitSpeed);
        p.lastPos = Vec2.addV(this.pos, lastposOffset);

        // Assign color
        if (this.particles != undefined) {
            p.color = this.particles[this.amtP].color;
        }

        this.amtP++;
        return p;
    }
}


export { Solver, PhysicsObject };