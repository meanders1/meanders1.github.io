
let solver;
let renderer;

let mouseX, mouseY;
let mouseDown;
let mouseReleased;


window.onload = setup;

window.addEventListener("resize", (ev) => {
    if(solver) {
        const canvas = document.getElementById("mainCanvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        solver.resize(window.innerWidth, window.innerHeight);
    }
});

function toggleDebugInfo(){
    const el = document.getElementById("debugContent");
    if(el.style.display != "none") {
        el.style.display = "none";
    } else {
        el.style.display = "block";
    }
}

function setup() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvas = document.getElementById("mainCanvas");
    canvas.width = width;
    canvas.height = height;

    canvas.addEventListener("mouseup", (ev) => {
        mouseDown = false;
        mouseReleased = true;
    });
    canvas.addEventListener("mousedown", (ev) => {
        mouseDown = true;
    });
    
    canvas.addEventListener("mousemove", (ev) => {
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    });

    document.getElementById("particleSizeSlider").addEventListener("input", (e) => {
        const textEl = document.getElementById("particleSizeText");
        textEl.innerHTML = e.target.value;
    })
    
    
    
    solver = new Solver(width, height);

    renderer = new Renderer(canvas);
    
    window.requestAnimationFrame(main);
}

function main() {
    const startTime = performance.now();
    solver.update();

    if(mouseReleased) {
        const radius = document.getElementById("particleSizeSlider").value;
        const p = new Particle(new Vec2(mouseX, mouseY), parseFloat(radius));
        // p.applyForce(Vec2.random(200));
        solver.addParticle(p);
    }

    renderer.clear();
    
    solver.render(renderer);

    const endTime = performance.now();
    const elapsed = endTime - startTime;
    document.getElementById("FPS").innerHTML = Math.round(elapsed) + "ms";

    mouseReleased = false;

    window.requestAnimationFrame(main);
}