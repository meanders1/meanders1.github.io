class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    clear() {
        this.context.reset();
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
}