class Solver {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.particles = [];
        this.grid = new Grid(new Vec2(width, height));

        for (let i = 0; i < 5000; i++) {
            const pos = new Vec2(Math.random() * width, Math.random() * height);
            const radius = 2;
            const p = new Particle(pos, radius);
            p.vel = Vec2.random(6);
            this.addParticle(p);
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.grid.resize(new Vec2(width, height));
    }

    addParticle(particle) {
        this.particles.push(particle);
        this.grid.addParticle(particle);
    }

    render(renderer) {
        for (const par of this.particles) {
            let v = Math.max(Math.min(par.vel.len()/10, 1), 0);
            // let v = 0.5;
            renderer.circle(par.pos, par.radius, [v, 0.2, 1-v, 1]);
        }
    }

    update() {
        const dt = 0.3;
        const subSteps = 1; 
        const subDt = dt / subSteps;
        
        for (let substep = 0; substep < subSteps; substep++) {
            this.checkCollisions();
            for (let obj of this.particles) {
                obj.update(subDt);
            }
        }
    }
    contain() {
        for (let p of this.particles) {
            if (p.pos.x < p.radius) {
                p.pos.x = p.radius;
                p.vel.x *= -1;

            } else if (p.pos.x > this.width - p.radius) {
                p.pos.x = this.width - p.radius;
                p.vel.x *= -1;
            }

            if (p.pos.y < p.radius) {
                p.pos.y = p.radius;
                p.vel.y *= -1;

            } else if (p.pos.y > this.height - p.radius) {
                p.pos.y = this.height - p.radius;
                p.vel.y *= -1;
            }
        }
    }

    checkCollisions() {
        this.contain();
        this.grid.updateParticles(this.particles);
        const collisionPairs = this.grid.getCollisionPairs();

        for (const [p1, p2] of collisionPairs) {
            this.handleCollision(p1, p2);
        }
    }

    handleCollision(o1, o2) {
        const impactVector = Vec2.subV(o2.pos, o1.pos);
        let d = impactVector.len();
        if (d > o1.radius + o2.radius) {
            return; // Particles do not collide
        }

        const overlap = d - (o1.radius + o2.radius);
        const dir = Vec2.normalized(impactVector).multN(overlap * 0.5);
        o1.pos.addV(dir);
        o2.pos.subV(dir);

        d = o1.radius + o2.radius;
        impactVector.normalize().multN(d);

        let massSum = o1.mass + o2.mass;
        let velDiff = Vec2.subV(o2.vel, o1.vel);
        let num = velDiff.dot(impactVector);
        let den = massSum * d * d;

        let deltaVA = impactVector.clone();
        deltaVA.multN(2 * o2.mass * num / den);
        o1.vel.addV(deltaVA);

        let deltaVB = impactVector.clone();
        deltaVB.multN(-2 * o1.mass * num / den);
        o2.vel.addV(deltaVB);
    }
}

class Grid {
    constructor(size) {
        this.size = size;
        this.cells = [];
        this.cellSize = 0;
    }

    resize(size) {
        this.size = size;
        this.cellSize = 0;
        this.cells = [];
    }

    addParticle(particle) {
        this.updateCellSize(particle.radius);
        const cellIndex = this.getCellIndex(particle.pos);
        if (!this.cells[cellIndex]) this.cells[cellIndex] = [];
        this.cells[cellIndex].push(particle);
    }

    updateParticles(particles) {
        this.cells = []; // Reset for the new frame
        for (const particle of particles) {
            this.addParticle(particle);
        }
    }

    updateCellSize(radius) {
        const proposedSize = radius * 2;
        if (this.cellSize < proposedSize) {
            this.cellSize = proposedSize;
        }
    }

    getCellIndex(pos) {
        const x = Math.floor(pos.x / this.cellSize);
        const y = Math.floor(pos.y / this.cellSize);
        return x + y * this.getGridWidth();
    }

    getGridWidth() {
        return Math.ceil(this.size.x / this.cellSize);
    }

    getCollisionPairs() {
        const pairs = [];
        
        for (let i = 0; i < this.cells.length; i++) {
            if (!this.cells[i]) continue;
            const cellParticles = this.cells[i];

            for (let j = 0; j < cellParticles.length; j++) {
                for (let k = j + 1; k < cellParticles.length; k++) {
                    pairs.push([cellParticles[j], cellParticles[k]]);
                }
            }

            // Check adjacent cells
            const neighbors = this.getNeighborCells(i);
            for (const neighbor of neighbors) {
                if (!this.cells[neighbor]) continue;
                const neighborParticles = this.cells[neighbor];

                for (const p1 of cellParticles) {
                    for (const p2 of neighborParticles) {
                        pairs.push([p1, p2]);
                    }
                }
            }
        }

        return pairs;
    }

    getNeighborCells(index) {
        const width = this.getGridWidth();
        const neighbors = [];

        const directions = [-1, 0, 1];
        for (const dx of directions) {
            for (const dy of directions) {
                if (dx === 0 && dy === 0) continue; // Skip the current cell
                const neighborIndex = index + dx + dy * width;
                if (neighborIndex >= 0 && neighborIndex < this.cells.length) {
                    neighbors.push(neighborIndex);
                }
            }
        }

        return neighbors;
    }

    getNearbyParticles(pos, radius) {
        const cellIndices = this.getNeighborCells(this.getCellIndex(pos));
        cellIndices.push(this.getCellIndex(pos));  // Include the current cell
        const nearbyParticles = [];

        for (const cellIndex of cellIndices) {
            if (!this.cells[cellIndex]) continue;
            for (const particle of this.cells[cellIndex]) {
                if (Vec2.subV(pos, particle.pos).lenSq() <= radius * radius) {
                    nearbyParticles.push(particle);
                }
            }
        }

        return nearbyParticles;
    }
}

class Particle {
    constructor(pos, radius) {
        this.pos = pos;
        this.vel = new Vec2();
        this.acc = new Vec2();
        this.radius = radius;
        this.mass = radius * radius * Math.PI;
        this.colour = [0.5, 0.8, 1, 1];
    }

    update(dt) {
        this.vel.addV(Vec2.multN(this.acc, dt));
        this.pos.addV(Vec2.multN(this.vel, dt));
        this.acc.set(0, 0);
    }

    applyForce(force) {
        this.acc.addV(Vec2.divN(force, this.mass));
    }
}
