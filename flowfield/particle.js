import { Vec2, tmpvec2 } from "./lib/vec2.js";

const VERTICES_PER_PARTICLE = 20; // MUST BE MULTIPLE OF TWO
const TAIL_LENGTH = 6;

class Particle {
    constructor(pos) {
        this.pos = pos.clone();
        this.vel = Vec2.random(0.002);//new Vec2(0, 0);
        this.acc = new Vec2(0, 0);
        this.color = [ Math.random(), Math.random(), Math.random(), 1 ];
        this.timeLeft = (VERTICES_PER_PARTICLE/2) * 4 * Math.random() + 6;
        this.maxVel = (Math.random()*2 - 1)*0.001 + 0.002;
        this.updateCount = 0;

        this.tail = [];
        for(let i = 0; i < TAIL_LENGTH; i++) {
            this.tail.push(this.pos.clone());
        }
    }

    update(flowfield, imgWidth, imgHeight, flowfieldResolution) {
        function nearestFlowfieldNode(pos) {
            tmpvec2.set(pos);
            tmpvec2.addN(1);
            tmpvec2.divN(2);
            tmpvec2.y = 1 - tmpvec2.y; // Y in the img is down, y in the canvas is up 
            tmpvec2.multV(new Vec2(imgWidth, imgHeight));
            tmpvec2.divN(flowfieldResolution);
            tmpvec2.floor();
            if (tmpvec2.x < 0 || tmpvec2.x >= flowfield[0].length || tmpvec2.y < 0 || tmpvec2.y >= flowfield.length) {
                return tmpvec2.set(-1, -1);
            }
            return tmpvec2;
        }

        // this.acc.addV(acc);
        // Update position
        if(this.updateCount % 3 == 0) {
            for(let i = this.tail.length-1; i > 0; i--) {
                this.tail[i] = this.tail[i-1];
            }
            this.tail[0] = this.pos.clone();
        }
        const closest = nearestFlowfieldNode(this.pos).clone();
		let v = 0;
		if(!(closest.x < 0 || closest.y < 0)) {
			v = flowfield[closest.y][closest.x].v;//(grid[closest.y][closest.x] + 1)/2;
		}
		this.acc.addV(tmpvec2.fromAngle(Math.PI*2 * v).multN(0.0003));

        this.vel.addV(this.acc);
        this.pos.addV(this.vel);
        this.acc.set(0, 0);

        //Control maximum velocity
        if(this.vel.lenSq() > this.maxVel*this.maxVel) {
            this.vel.normalize().multN(this.maxVel);
        }

        // Handle reset
        this.timeLeft -= 0.4 + 0.01*Math.random();
        this.updateCount++;
    }

    // reset() {
    //     this.pos = newParticlePos(60);
    //     this.vel.random(0.001); //.set(0, 0);
    //     this.acc.set(0, 0);
    //     for(let i = 0; i < this.tail.length; i++) {
    //         this.tail[i].set(this.pos);
    //     }
    //     this.timeLeft = VERTICES_PER_PARTICLE;
    //     const col = pixelColor(this.pos);
    //     this.color = [col[0], col[1], col[2], 1];

    //     this.maxVel = (Math.random()*2 - 1)*0.001 + 0.002;
    //     this.updateCount = 0;
    // }
    
    asVertices() {
        function pointToVertex(point, color) {
            return [point.x, point.y, color[0], color[1], color[2], 1];
        }

        let arr = [];
        arr.push(pointToVertex(this.pos, this.color));

        for(const t of this.tail) {
            arr.push(pointToVertex(t, this.color))
            arr.push(pointToVertex(t, this.color))
        }
        arr.pop();
        return arr;
    }

    asFloats() {
        let arr = new Float32Array();
        arr.push(this.pos.x, this.pos.y, this.pos.z);
        arr.push(this.vel.x, this.vel.y, this.vel.z);

    }

}

// class Particle {
//     constructor(pos) {
//         this.pos = pos.clone();
//         this.vel = Vec2.random(0.002);//new Vec2(0, 0);
//         this.acc = new Vec2(0, 0);
//         this.color = [ Math.random(), Math.random(), Math.random(), 1 ];
//         this.timeLeft = (VERTICES_PER_PARTICLE/2) * 4 * Math.random() + 6;
//         this.maxVel = (Math.random()*2 - 1)*0.001 + 0.002;
//         this.updateCount = 0;

//         this.tail = [];
//         for(let i = 0; i < TAIL_LENGTH; i++) {
//             this.tail.push(this.pos.clone());
//         }
//     }

//     update() {
//         // this.acc.addV(acc);
//         if (this.pos.x > 1 || this.pos.x < -1 || this.pos.y > 1 || this.pos.y < -1) {
//             this.reset();
//         }
//         // Update position
//         if(this.updateCount % 3 == 0) {
//             for(let i = this.tail.length-1; i > 0; i--) {
//                 this.tail[i] = this.tail[i-1];
//             }
//             this.tail[0] = this.pos.clone();
//         }
//         const closest = nearestFlowfieldNode(this.pos).clone();
// 		let v = 0;
// 		if(!(closest.x < 0 || closest.y < 0)) {
// 			v = grid[closest.y][closest.x].v;//(grid[closest.y][closest.x] + 1)/2;
// 		}
// 		this.acc.addV(tmpvec2.fromAngle(Math.PI*2 * v).multN(0.0003));

//         this.vel.addV(this.acc);
//         this.pos.addV(this.vel);
//         this.acc.set(0, 0);

//         //Control maximum velocity
//         if(this.vel.lenSq() > this.maxVel*this.maxVel) {
//             this.vel.normalize().multN(this.maxVel);
//         }

//         // Handle reset
//         this.timeLeft -= 0.4 + 0.01*Math.random();
//         if (this.timeLeft <= 0) {
//             this.reset();
//         } 
//         this.updateCount++;
//     }

//     reset() {
//         this.pos = newParticlePos(60);
//         this.vel.random(0.001); //.set(0, 0);
//         this.acc.set(0, 0);
//         for(let i = 0; i < this.tail.length; i++) {
//             this.tail[i].set(this.pos);
//         }
//         this.timeLeft = VERTICES_PER_PARTICLE;
//         const col = pixelColor(this.pos);
//         this.color = [col[0], col[1], col[2], 1];

//         this.maxVel = (Math.random()*2 - 1)*0.001 + 0.002;
//         this.updateCount = 0;
//     }
    
//     asVertices() {
//         function pointToVertex(point, color) {
//             return [point.x, point.y, color[0], color[1], color[2], 1];
//         }

//         let arr = [];
//         arr.push(pointToVertex(this.pos, this.color));

//         for(const t of this.tail) {
//             arr.push(pointToVertex(t, this.color))
//             arr.push(pointToVertex(t, this.color))
//         }
//         arr.pop();
//         return arr;
//     }

//     asFloats() {
//         let arr = new Float32Array();
//         arr.push(this.pos.x, this.pos.y, this.pos.z);
//         arr.push(this.vel.x, this.vel.y, this.vel.z);

//     }

// }

function asVertices(p) {
    function pointToVertex(point, color) {
        return [point.x, point.y, color[0], color[1], color[2], 1];
    }

    let arr = new Float32Array();
    arr.push(pointToVertex(p.pos, p.color));

    for(const t of p.tail) {
        arr.push(pointToVertex(t, p.color))
        arr.push(pointToVertex(t, p.color))
    }
    arr.pop();
    return arr;
}

// Structure
// 3xf pos
// 3xf vel
// 3xf acc
// 4xf color
// 1xf timeLeft
// 1xf maxVel
// 1xi updateCount
// 10x2xf tail
// const FLOATS_PER_VERTEX = 3+3+3+4+1+1+1+20;

// function processParticle(bufferIn, bufferOut, index) {
     
// }

export { Particle, VERTICES_PER_PARTICLE, asVertices };