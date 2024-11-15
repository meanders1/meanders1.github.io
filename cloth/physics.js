class Solver {
    constructor() {
        this.nodes = [];
        this.links = [];
    }

    removeLink(link) {
        link.prepareRemoval();
        this.links = this.links.filter((l) => l != link);
    }

    clear() {
        // this.nodes = [];
        this.links = [];
    }

    addNode(pos, r) {
        const node = new Node(pos.clone(), r);
        this.nodes.push(node);
        return node;
    }

    addLink(idx1, idx2) {
        this.links.push(new Link(this.nodes[idx1], this.nodes[idx2]));
    }

    render(renderer) {
        for(const link of this.links) {
            renderer.line(link.o1.pos, link.o2.pos, [1, 1, 1, 1]);
        }
        for(const node of this.nodes) {
            renderer.circle(node.pos, node.radius, [0.4, 0.4, 1, 1]);
        }
    }

    update(substeps) {
        const dt = 0.1;
        const subdt = dt / substeps;
        for(let i = 0; i < substeps; i++) {
            this.applyGravity();
            this.applyLinks();
            this.updatePositions(subdt);
        }
        this.clearFallingSingle();

    }

    clearFallingSingle() {
        let nodesToRemove = [];
        for(const node of this.nodes) {
            if(node.connectedLinks.length === 0 && node.pos.y > 10000) {
                nodesToRemove.push(node);
            }
        }

        this.nodes = this.nodes.filter((n) => !(nodesToRemove.indexOf(n) > 0));
    }

    applyGravity() {
        const gravity = new Vec2(0, 1800);

        for(const node of this.nodes) {
            node.applyForce(gravity);
        }
    }

    updatePositions(dt) {
        for(const node of this.nodes) {
            node.updatePosition(dt);
        }
    }

    applyLinks() {
        for(const link of this.links) {
            link.apply();
        }
    }

    clearLinks() {
        for(const link of this.links) {
            link.prepareRemoval();
        }
        this.links =[];
    }

    shatter() {
        this.clearLinks();
        for(const node of this.nodes) {
            if(node.fixed || node.tempFixed) {
                node.unfix();
                node.tempUnfix(); // Should be unnecessary 
                node.setVel(new Vec2(0, 0));
            }
        }
    }
}

class Link {
    constructor(o1, o2, targetLength) {
        this.o1 = o1;
        this.o2 = o2;
        if(targetLength != undefined) {
            this.targetLength = targetLength;
        } else {
            this.targetLength = Vec2.subV(o1.pos, o2.pos).len();
        }
        this.stiffness = 1.0;
        this.o1.connectedLinks.push(this);
        this.o2.connectedLinks.push(this);
    }

    prepareRemoval() {
        this.o1.connectedLinks = this.o1.connectedLinks.filter((l) => l != this);
        this.o2.connectedLinks = this.o2.connectedLinks.filter((l) => l != this);
    }

    apply() {
        let axis = Vec2.subV(this.o1.pos, this.o2.pos);
        let dist = axis.lenSq();
        if(dist > this.targetLength*this.targetLength) {
            dist = Math.sqrt(dist);
            axis.divN(dist);
            let delta = (this.targetLength - dist)*this.stiffness;
            this.o1.move(Vec2.multN(axis,  0.5 * delta));
            this.o2.move(Vec2.multN(axis, -0.5 * delta));
        }
    }
}

class Node {
    constructor(pos, r) {
        this.pos = pos;
        this.lastPos = pos.clone();
        this.acc = new Vec2(0, 0);
        this.radius = r;
        this.mass = Math.PI * r * r;
        this.color = [0.5, 0.5, 0.5, 1];
        this.fixed = false;
        this.tempFixed = false;
        this.connectedLinks = [];
    }

    fix() {
        this.fixed = true;
    }

    unfix() {
        this.fixed = false;
        this.acc.set(0, 0);
    }

    tempFix() {
        this.tempFixed = true;
    }
    
    tempUnfix() {
        this.tempFixed = false;
        this.acc.set(0, 0);
    }

    updatePosition(dt) {
        if(this.fixed || this.tempFixed) return;

        const vel = Vec2.subV(this.pos, this.lastPos);
        this.lastPos.x = this.pos.x;
        this.lastPos.y = this.pos.y;
        this.pos = Vec2.addV(this.pos, Vec2.addV(vel, Vec2.multN(this.acc, dt*dt)));
        this.acc.set(0, 0);
    }

    accelerate(acc) {
        this.acc.addV(acc);
    }

    applyForce(force) {
        this.acc.addV(Vec2.divN(force, this.mass));
    }

    move(offset) {
        if(this.fixed || this.tempFixed) return;
        this.pos.addV(offset);
    }

    vel() {
        return Vec2.subV(this.pos, this.lastPos);
    }

    setVel(vel) {
        this.lastPos.set(Vec2.subV(this.pos, vel));
    }
}