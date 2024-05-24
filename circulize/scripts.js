import { Renderer, Quad } from "./lib/linnet/linnet.js"
import { Solver } from "./physics.js";
import { Vec2, tmpvec2 } from "./lib/linnet/vec2.js";
import { Renderer2D } from "./fallbackRenderer.js";

const SELECTION_TEXT = "Click to select image. Note: nonsquare images will be cropped";
const WORKING_TEXT = "Working...";

const SEED = 1450102021020310231;
const MAX_FONT_SIZE = 100;

const backgroundColor = [0.05, 0.05, 0.05, 1];
const containingCircle = new Quad(new Vec2(0, 0), new Vec2(1, 1), 0, backgroundColor);

let PARTICLE_COUNT = 1358;
let solver;
let img = undefined;
let displayedText = SELECTION_TEXT;
let debug = false;

let width, height;

let renderer;
let isWebGPURenderer;
let textCanvasCtx;

let updating = false;
const fpsInterval = 1000 / 60;
let previousTime = performance.now();

window.onload = setup;
window.addEventListener("resize", windowResized);

function setup() {
    setupUIScripts();
    let smallest = Math.min(window.innerWidth, window.innerHeight);
    width = height = smallest;
    const mainCanvas = document.getElementById("mainCanvas");
    mainCanvas.width = smallest;
    mainCanvas.height = smallest;
    
    const textCanvas = document.getElementById("textCanvas");
    textCanvas.width = smallest;
    textCanvas.height = smallest;
    textCanvasCtx = textCanvas.getContext("2d");
    
    mainCanvas.addEventListener("click", () => {
        let inputEl = document.querySelector("#imageSelector");
        inputEl.click();
    });
    
    textCanvas.addEventListener("click", () => {
        let inputEl = document.querySelector("#imageSelector");
        inputEl.click();
    });
    
    renderer = new Renderer2D(mainCanvas);
    isWebGPURenderer = false;
    // if(!navigator.gpu) {
    //     renderer = new Renderer2D(mainCanvas);
    //     isWebGPURenderer = false;
    //     console.log("WebGPU is not available. Using '2d' renderer instead.");
    // } else {
    //     renderer = new Renderer({canvas: mainCanvas, textureUrl: "./assets/circle512.png", maxQuads: PARTICLE_COUNT+3}); // +3 because containing circle, and emitter is also drawn
    //     isWebGPURenderer = true;
    // }

    const inputEl = document.getElementById("imageSelector");
    inputEl.addEventListener("change", ()=> {
        selectImage(inputEl);
    });
    
    draw();
}


function draw() {
    window.requestAnimationFrame(draw);
    const now = performance.now();
    const elapsed = now - previousTime;

    if (elapsed > fpsInterval) {
        previousTime = now - (elapsed % fpsInterval);
        
        let drawTime = 0;
        let updateTime = 0;
        let frameTime = 0;
        const frameStart = performance.now();

        textCanvasCtx.clearRect(0, 0, width, height);
        
        if (solver != undefined && updating) {
            
            let drawStart = performance.now();
            if(isWebGPURenderer) { 
                let quads = [];
                quads.push(containingCircle);
                for(let object of solver.objects) {
                    quads.push(new Quad(object.pos, new Vec2(object.radius, object.radius), 0, object.color, new Vec2(0, 0)));
                }
                if (!solver.emitter.stopped) {
                    quads.push(new Quad(solver.emitter.pos, new Vec2(0.02, 0.02), 0, [1, 0, 0, 1]));
                    quads.push(new Quad(solver.emitter.pos, new Vec2(0.01, 0.01), 0, [1, 1, 1, 1]));
                }
                renderer.draw(quads);
            } else {
                renderer.startFrame();
                renderer.circle(new Vec2(0, 0), 1, backgroundColor);
                for(let object of solver.objects){
                    renderer.circle(object.pos, object.radius, object.color);
                }
                if(!solver.emitter.stopped) {
                    renderer.circle(solver.emitter.pos, 0.02, [1, 0, 0, 1]);
                    renderer.circle(solver.emitter.pos, 0.01, [1, 1, 1, 1]);
                }
            }
            drawTime = performance.now() - drawStart;
            
            let updateStart = performance.now();
            solver.update();
            updateTime = performance.now() - updateStart;
            
        } else {
            // Draw text on the textCanvas
            textCanvasCtx.fillStyle = `rgb(${backgroundColor[0]*255}, ${backgroundColor[1]*255}, ${backgroundColor[2]*255})`;
            textCanvasCtx.beginPath();
            textCanvasCtx.arc(width/2, height/2, width/2, 0, Math.PI*2);
            textCanvasCtx.fill();
            textCanvasCtx.textBaseline = "middle";
            textCanvasCtx.textAlign = "center";
            textCanvasCtx.fillStyle = "white";
            
            const initialFontSize = 100;
            textCanvasCtx.font = initialFontSize + "px Arial";
            const initialTextWidth = textCanvasCtx.measureText(displayedText).width;
            
            const desiredTextWidth = width - 40;
            const fontSize = Math.min((initialFontSize * desiredTextWidth) / initialTextWidth, MAX_FONT_SIZE);
            
            textCanvasCtx.font = fontSize + "px Arial";
            textCanvasCtx.fillText(displayedText, width/2, height/2);
        }

        frameTime = performance.now() - frameStart;
        
        drawDebugInfo(drawTime, updateTime, frameTime);
    }
        
}
    
function drawDebugInfo(drawTime, updateTime, frameTime) {
    if(debug && solver != undefined) {
        let el = document.querySelector("#debug");
        if (el === null) {
            el = document.createElement("p");
            document.body.appendChild(el);
            el.style.position = "absolute";
            el.style.top = "100px";
            el.style.left = "0px";
            el.style.backgroundColor = "rgba(255, 255, 255, 0.8)"
            el.id = "debug"
        }
        el.style.display = "block";
        // Draw debug info
        let cellSize = solver.grid.largestRadius * 2;
        let cellSizePx = cellSize * Math.min(width/2, height/2);
        let amtCellsX = solver.grid.amtCellsX;
        let amtCellsY = solver.grid.amtCellsY;
        el.innerHTML = "Frametime: " + frameTime + "<br>";
        el.innerHTML += "Grid:<br>"; 
        el.innerHTML += " - " + amtCellsX + "x" + amtCellsY + " cells<br>";
        el.innerHTML += " - Cellsize: " + (solver.grid.largestRadius * 2) + " (" + Math.floor(cellSizePx) + "px)<br>";
        el.innerHTML += "Drawtime: " + drawTime + "<br>";
        el.innerHTML += "Updatetime: " + updateTime + "<br>";
        el.innerHTML += "Canvas dimensions: " + width + "x" + height + " (width x height) <br>";

        //Draw grid
        textCanvasCtx.fillStyle = "rgba(0, 0, 0, 0)";
        textCanvasCtx.strokeStyle = "rgb(0, 255, 255)";
        textCanvasCtx.lineWidth = 1;
        for(let x = 0; x < amtCellsX; x++) {
            for(let y = amtCellsY-1; y > 0; y--) {
                if(solver.grid.cell(x, y-1).length == 0) {
                    textCanvasCtx.fillStyle = "rgba(255, 0, 0, 0.38)";
                } else {
                    textCanvasCtx.fillStyle = "rgba(0, 255, 0, 0.38)";
                }

                const rectX = x*cellSizePx - solver.grid.spaceWidth()/2;
                const rectY = height - (y *cellSizePx - solver.grid.spaceHeight()/2);
                textCanvasCtx.fillRect(rectX, rectY, cellSizePx, cellSizePx);
                textCanvasCtx.strokeRect(rectX, rectY, cellSizePx, cellSizePx);
            }
        }
    } else {
        let el = document.querySelector("#debug");
        if(el != null) {
            el.style.display = "none";
        }
    }
}

function windowResized() {
    let smallest = Math.min(window.innerWidth, window.innerHeight);
    width = height = smallest;

    const mainCanvas = document.getElementById("mainCanvas");
    mainCanvas.width = smallest;
    mainCanvas.height = smallest;
    
    const textCanvas = document.getElementById("textCanvas");
    textCanvas.width = smallest;
    textCanvas.height = smallest;

    renderer.canvasResized();

    if (solver == undefined) {
        displayText(SELECTION_TEXT);
    }
}

function displayText(text) {
    displayedText = text;
    updating = false;
    draw();
}

function selectImage(input) {
    console.log("Image selected");
    if (!(input.files && input.files[0])) return;

    solver = undefined;
    displayText(WORKING_TEXT);

    setTimeout(() => {
        const file = input.files[0];
        if (!file.type.includes("image")) {
            console.log("File " + file.name + " is not image")
            displayText("Selected file must be an image");
            return;
        }
        
        img = new Image();
        img.onload = function () {
            console.log("Loaded " + file.name);
            updating = false;
            solver = new Solver(SEED, PARTICLE_COUNT);
            updating = true;
        }
        img.src = URL.createObjectURL(file);

    }, 400);
}

function setupUIScripts() {
    const particleCountEl = document.getElementById("inputParticleCount");
    particleCountEl.value = PARTICLE_COUNT;
    particleCountEl.addEventListener("change", () => {
        PARTICLE_COUNT = particleCountEl.value;
    });
    
    const applyButtonEl = document.getElementById("btnApply");
    applyButtonEl.addEventListener("click", () => { 
        const inputEl = document.querySelector("#imageSelector");
        inputEl.click();
    });

    const debugBtnEl = document.getElementById("inputDebug");
    debugBtnEl.addEventListener("click", () => {
        debug = debugBtnEl.checked;
    });
}

export {width, height, img};