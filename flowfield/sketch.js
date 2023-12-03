import { Simulation, Renderer } from "./simulation.js";

let isDebug = false;

let PARTICLE_COUNT = 4000;
let time = 0;

let img;

let simulation = new Simulation();
let renderer;

let backgroundColor = [20/255, 20/255, 20/255];

window.onload = setup;
window.onresize = windowResized;


async function setup() {
	setupUIScripts();
	renderer = new Renderer(PARTICLE_COUNT);
}

let lastTime = performance.now();
const fpsInterval = 1000 / 60;

async function draw() {
	window.requestAnimationFrame(draw);
	const now = performance.now();
	const elapsed = now - lastTime;
	
	if(elapsed > fpsInterval) {
		const frameStart = performance.now();
		lastTime = now - (elapsed % fpsInterval);
		
		time++;

		renderer.draw(simulation.particles);
		simulation.update();

		let debugEl = document.getElementById("debugInfo");
		if(isDebug) {
			const frameTime = performance.now() - frameStart;
			debugEl.style.display = "block";
			debugEl.innerHTML = "Frametime: " + frameTime + "ms";
		} else {
			debugEl.style.display = "none";
		}
	}
}

function resizeCanvas() {
	const dimensions = findCanvasSize();
	let c = document.getElementById("mainCanvas");
	c.width = dimensions.w;
	c.height = dimensions.h;
}

function windowResized() {
	resizeCanvas();
}

function findCanvasSize() {
	const maxWidth = window.innerWidth;
	const maxHeight = window.innerHeight;
	
	const vertScale = maxHeight/simulation.imgHeight;
	const horiScale = maxWidth/simulation.imgWidth;
	const scale = Math.min(vertScale, horiScale);
	
	const w = simulation.imgWidth * scale;
	const h = simulation.imgHeight * scale;

	return {
		w:w,
		h:h
	};
}

function setupUIScripts() {
	function toggleDebug() {
		const el = document.getElementById("btnShowDebuginfo");
		el.addEventListener("click", () => { isDebug = el.checked; });
	}

	function updateSim() {
		const updateBtn = document.getElementById("btnUpdateSim");
		updateBtn.addEventListener("click", () => {
			const particleCount = document.getElementById("inputParticleCount").value;
			PARTICLE_COUNT = particleCount;
			simulation.createParticles(PARTICLE_COUNT);
			renderer = new Renderer(PARTICLE_COUNT); 
		});
		
	}
	function setImage() {
		const imgEl = document.getElementById("imgImage");
		imgEl.addEventListener("change", () => {
			if(!imgEl.files && imgEl.files[0]) {
				console.log("NOOOO");
				return;
			}
			const file = imgEl.files[0];
			if(!file.type.includes("image")) {
				console.log("File is not a image");
			}

			img = new Image();

			img.onload = function () {
				simulation.createFlowfield(img);
				simulation.createParticles(PARTICLE_COUNT);
				resizeCanvas();
				draw();
			};
			img.src = URL.createObjectURL(file);
		});
	}

	function updateBackgroundColor() {
		const el = document.getElementById("colBackgroundColor");
		el.addEventListener("change", () => {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(el.value);
			const col = [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16)
			]
			backgroundColor = [col[0]/255, col[1]/255, col[2]/255];
			document.body.style.backgroundColor = `rgb(${col[0]}, ${col[1]}, ${col[2]})`
		});
	}

	function setDefualts() {
		document.getElementById("inputParticleCount").value = PARTICLE_COUNT;
	}

	setDefualts();
	toggleDebug();
	updateSim();
	updateBackgroundColor();
	setImage();

	window.onkeyup = (e) => {
		let keynum;
		if(window.event) {
			keynum = e.keyCode;
		} else if(e.which) {
			keynum = e.which;
		}

		const key = String.fromCharCode(keynum).toLowerCase();
		if(key == "m") {
			const menuEl = document.getElementById("customisationMenu");
			if(menuEl.style.display != "none") {
				menuEl.style.display = "none";
			} else {
				menuEl.style.display = "block";
			}
		}
	}
}

export { findCanvasSize, backgroundColor };