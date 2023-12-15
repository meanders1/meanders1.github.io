import { Vec2, tmpvec2 } from "./lib/linnet/vec2.js";

class Renderer2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    startFrame() {
        this.context.reset();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.translate(this.canvas.width/2, this.canvas.height/2);
        this.context.scale(this.canvas.width/2, this.canvas.height/2);
    }

    circle(pos, radius, color) {
        const x = pos.x;
        const y = pos.y*-1;
        this.context.fillStyle = "rgba(" + color[0]*255 + 
                                    "," + color[1]*255 + 
                                    "," + color[2]*255 + 
                                    "," + color[3] + ")";
        // console.log("rgba(" + color[0]*255 + 
        // "," + color[1]*255 + 
        // "," + color[2]*255 + 
        // "," + color[3] + ")");
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 2*Math.PI);
        this.context.fill();
    }
}

export {Renderer2D};
