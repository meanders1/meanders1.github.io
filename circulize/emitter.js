import { Vec2, tmpvec2 } from "./lib/linnet/vec2.js";
import { Random } from "./lib/extra.js";
import { PhysicsObject } from "./physics.js";

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

export { Emitter };
