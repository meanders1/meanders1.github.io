
let solver;
let renderer;

let mouseX, mouseY;
let prevMouseX, prevMouseY;

let leftMouseDown;
let leftMouseReleased;

let rightMouseDown;
let rightMouseReleased;

let heldNode;

let keys = new Map();
let keysReleased = new Map();

let zoomSpeed = 0.5;
let substeps = 16;

window.onload = setup;


function generateCloth(width, height, numx, numy) {
    solver.clear();

    const canvas = document.getElementById("mainCanvas");
    const offset = new Vec2(canvas.width-width, canvas.height-height).divN(2).subV(new Vec2(canvas.width/2, canvas.height/2));
    
    const nodeslLengthStart = solver.nodes.length;

    for(let y = 0; y < numy; y++) {
        for(let x = 0; x < numx; x++) {
            const pos = new Vec2(width/numx, height/numy).multV(new Vec2(x, y)).addV(offset);
            solver.addNode(pos, 4);
            const currNodeIndex = solver.nodes.length-1;
            if(x > 0) {
                solver.addLink(currNodeIndex, currNodeIndex-1);
            }
            if(y > 0) {
                solver.addLink(currNodeIndex, currNodeIndex-numx);
            }
        }
    }

    // Pin corners
    solver.nodes[nodeslLengthStart].fix();
    solver.nodes[nodeslLengthStart + numx-1].fix();
}

function setupControls() {
    const canvas = document.getElementById("mainCanvas");
    
    canvas.addEventListener("wheel", (ev) => {
        if(renderer) {
            if(ev.deltaY == 0) return;

            let delta = ev.deltaY > 0 ? 1 : -1;  // +1 for scroll down, -1 for scroll up
            delta *= zoomSpeed;
            let zoomFactor = Math.pow(1.1, delta); // Use exponential scale (zoom factor by 10%)

            renderer.zoom(zoomFactor);
        }
    });

    canvas.addEventListener("mouseup", (ev) => {
        if(ev.button == 0) {
            leftMouseDown = false;
            leftMouseReleased = true;
        } else if(ev.button == 2) {
            rightMouseDown = false;
            rightMouseReleased = true;
        }
    });
    canvas.addEventListener("mousedown", (ev) => {
        if(ev.button == 0) {
            leftMouseDown = true;
        } else if(ev.button == 2) {
            rightMouseDown = true;
        }
    });
    
    canvas.addEventListener("mousemove", (ev) => {
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    })
    
    window.addEventListener("resize", (ev) => {
        if(solver) {
            const canvas = document.getElementById("mainCanvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
    
    document.addEventListener("keyup", (ev) => {
        keys.set(ev.key, false);
        keysReleased.set(ev.key, true);
    });
    
    document.addEventListener("keydown", (ev) => {
        keys.set(ev.key, true);
    });
}

function setup() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvas = document.getElementById("mainCanvas");
    canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
    canvas.width = width;
    canvas.height = height;

    solver = new Solver();

    const clothWidth = Number(document.getElementById("clothWidth").value);
    const clothHeight = Number(document.getElementById("clothHeight").value);
    generateCloth(clothWidth * 10, clothHeight * 10, clothWidth, clothHeight);
    
    renderer = new Renderer(canvas);

    setupControls();
    document.getElementById("menuIcon").addEventListener("click", (ev) => {
        const menu = document.getElementById("menu");
        if(menu.style.display != "none") {
            menu.style.display = "none";
        } else {
            menu.style.display = "block";
        }
    })

    window.requestAnimationFrame(main);
}

function updateCloth() {
    solver.shatter();

    // Wait for the nodes to fall 
    setTimeout(() => {
        const clothWidth = Number(document.getElementById("clothWidth").value);
        const clothHeight = Number(document.getElementById("clothHeight").value);
        
        const width = clothWidth * 10;
        const height = clothHeight * 10;
        
        generateCloth(width, height, clothWidth, clothHeight);
    }, 1000);
}

function main() {
    const startTime = performance.now();

    handleInput();
    
    solver.update(substeps);

    renderer.clear();
    solver.render(renderer);

    const endTime = performance.now();
    const elapsed = endTime - startTime;
    document.getElementById("FPS").innerHTML = Math.round(elapsed) + " ms | " + Math.round(1000/elapsed) + " fps";

    // Reset input
    leftMouseReleased = false;
    rightMouseReleased = false;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    for(let [key, state] of keysReleased){
        keysReleased.set(key, false);
    }

    window.requestAnimationFrame(main);
}

function mousePos( ){
    return new Vec2(mouseX, mouseY).sub(renderer.offset).div(renderer.scale);
}

function prevMousePos() {
    return new Vec2(prevMouseX, prevMouseY).sub(renderer.offset).div(renderer.scale);
}

function handleInput() {
    function assignHeldNode(node) {
        heldNode = node;
        heldNode.tempFix();
    }

    function unassignHeldNode() {
        heldNode.tempUnfix();
        heldNode.setVel(new Vec2(0, 0));
        heldNode = undefined;
    }

    if(keys.get("Shift") && leftMouseDown) {
        renderer.offset.addV(new Vec2(mouseX-prevMouseX, mouseY-prevMouseY));
        return;
    }

    if(heldNode && keysReleased.get("f")) {
        if(heldNode.fixed) {
            heldNode.unfix();
        } else {
            heldNode.fix();
        }
    }

    if(keysReleased.get("o")) {
        solver.shatter();
    }

    if(leftMouseDown) {
        let node;
        if(heldNode) {
            node = heldNode;
        } else {
            let closestDist = Infinity;
            let closestNode = undefined;
            for(const node of solver.nodes) {
                let dist = Vec2.subV(mousePos(), node.pos).len();
                if(dist <= closestDist) {
                    closestDist = dist;
                    closestNode = node;
                }
            }
            if(closestDist > 40) {
                closestNode = undefined;
            }
            
            if(closestNode == undefined) return;
            
            node = closestNode;
            assignHeldNode(node);
        }
        node.pos.set(mousePos());
    }
    if(leftMouseReleased && heldNode) {
        unassignHeldNode();
    }

    if(rightMouseDown) {
        const m1 = mousePos();
        const m2 = prevMousePos();
        
        let linksToRemove = [];

        for(const link of solver.links) {
            const l1 = link.o1.pos;
            const l2 = link.o2.pos;
            if(linesIntersect(m1, m2, l1, l2)) {
                linksToRemove.push(link);
            }
        }
        for(const link of linksToRemove) {
            solver.removeLink(link);
        }
    }
}

function linesIntersect(p1, p2, q1, q2) {
    var det, gamma, lambda;
    det = (p2.x - p1.x) * (q2.y - q1.y) - (q2.x - q1.x) * (p2.y - p1.y);
    if (det === 0) {
        return false;
    } else {
        lambda = ((q2.y - q1.y) * (q2.x - p1.x) + (q1.x - q2.x) * (q2.y - p1.y)) / det;
        gamma = ((p1.y - p2.y) * (q2.x - p1.x) + (p2.x - p1.x) * (q2.y - p1.y)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
};