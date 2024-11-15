class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.offset = new Vec2(canvas.width/2, canvas.height/2);
        this.scale = new Vec2(1, 1);
    }

    clear() {
        this.context.reset();
        this.context.translate(this.offset.x, this.offset.y);
        this.context.scale(this.scale.x, this.scale.y);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    circle(pos, radius, color) {
        const x = pos.x;
        const y = pos.y;
        this.context.fillStyle = "rgba(" + color[0]*255 + 
                                    "," + color[1]*255 + 
                                    "," + color[2]*255 + 
                                    "," + color[3] + ")";
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 2*Math.PI);
        this.context.fill();
    }

    rect(pos, size, color) {
        this.context.fillStyle = "rgba(" + color[0]*255 + 
        "," + color[1]*255 + 
        "," + color[2]*255 + 
        "," + color[3] + ")";

        this.context.fillRect(pos.x, pos.y, size.x, size.y);
    }

    line(pos1, pos2, color) {
        this.context.strokeStyle = "rgba(" + color[0]*255 + 
        "," + color[1]*255 + 
        "," + color[2]*255 + 
        "," + color[3] + ")";
        this.context.beginPath();
        this.context.moveTo(pos1.x, pos1.y);
        this.context.lineTo(pos2.x, pos2.y);
        this.context.stroke();
    }

    zoom(factor) {
        this.scale.divN(factor);
        const screenCenter = new Vec2(this.canvas.width, this.canvas.height).mult(0.5);

        // Adjust the offset to zoom towards the center of the screen
        this.offset.addV(Vec2.subV(screenCenter, this.offset).multN(factor-1));
    }

    pan(offset) {
        this.offset.add(offset);
    }
}