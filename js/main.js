/********************
// Constant variable
*********************/
var COMMAND = {
	FORWARD: {
		action: 0,
		text: "⇧ FORWARD"
	},
	BACK: {
		action: 1,
		text: "⇩ BACK"
	},
	TURN_LEFT: {
		action: 2,
		text: "⇦ LEFT"
	},
	TURN_RIGHT: {
		action: 3,
		text: "⇨ RIGHT"
	},
	LENGTH: 4
};
var EYE_PARAM = {
	COVER: Math.PI * 2,
	NUM_EYES: 128,
	DISTANCE: 300,
//	DANGER_COLOR: 0xff0000,
//	WARNNING_COLOR: 0xff8800,
	SAFE_COLOR: 0xffff00,
};
var OBJECT_TYPE = {
	NONE: {
		text: "NONE",
	},
	OBSTACLE: {
		text: "BARRIER",
	},
	WALL: {
		text: "WALL",
	},
	ITEM: {
		text: "ITEM",
	},
	CAR: {
		text: "CAR",
	},
};
var CAR_INFO = {
	SIZE: 50,
	SPEED: 200,
	ROTATE_AMOUNT: 2
};
var MODE = {
	MANUAL: {
		switchStyle: "brightness(100%) hue-rotate(0deg)",
		text: "MANUAL",
		class: "inactive",
	},
	LEARNING: {
		switchStyle: "brightness(150%) hue-rotate(190deg)",
		text: "LEARNING",
		class: "active",
	},
	FREEDOM: {
		switchStyle: "brightness(150%) hue-rotate(250deg)",
		text: "FREEDOM",
		class: "safe",
	}
}
var COURSE = {
	NONE: 0,
	RANDOM: {
		NUM_OBSTACLES: 50,
		OBSTACLE_SIZE: 50,
		OBSTACLE_TEXTURE: "./assets/textures/crate.gif",
		WALL_SIZE: 100,
		WALL_TEXTURE: "./assets/textures/stone.jpg",	
	},
}
var WORLD_INFO = {
	WORLD_SIZE: 1600,
	COURSE: COURSE.RANDOM
}

/**********************
// Global variable
***********************/
var keyState = {
	up: false,
	down: false,
	left: false,
	right: false
}
var clock = new THREE.Clock();
var scene;
var renderer;
var camera;
var robotCamera;
var controls;
var light;
var delta = 0;
var debug;

var ui;
var cars;
var selected;
var world;



window.onload = function() {
	init();
	animate();
}


// initialize window
function init() {
	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// camera
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 4200);
	camera.position.y = 400;
	camera.position.z = 800;
	camera.lookAt(new THREE.Vector3(0, 0, 0))

	// robot camera
	robotCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 4000);

	// controls
	controls = new THREE.OrbitControls(camera);
	controls.keys = {};
	controls.maxDistance = 1500;
	controls.minDistance = 200;
	controls.damping = 0.2;

	// scene
	scene = new THREE.Scene();

	// light
	light = new THREE.PointLight();
	light.position.set(300, 300, 300);
	scene.add(light);

	// World
	world = new World(WORLD_INFO);
	scene.add(world);

	// generate car
	cars = new Array();
	var car = new Car({
		ID: "CAR1",
		src: "./assets/textures/tago.jpg",
		size: CAR_INFO.SIZE,
		eyeParam: EYE_PARAM,
		mode: MODE.MANUAL
	});
	car.mesh.rotation.y += Math.PI;
	world.putIntoWorld(car.mesh, car.mesh.position);
	for(var i = 0; i < car.eyes.length; i++) {
		world.add(car.eyes[i]);
	}
	cars.push(car);

	var car = new Car({
		ID: "CAR2",
		src: "./assets/textures/tago.jpg",
		size: CAR_INFO.SIZE,
		eyeParam: EYE_PARAM,
		mode: MODE.FREEDOM
	});
	car.mesh.rotation.y += Math.PI;
	world.putIntoWorld(car.mesh, car.mesh.position);
	for(var i = 0; i < car.eyes.length; i++) {
		world.add(car.eyes[i]);
	}
	cars.push(car);
	selected = 0;

	// ui
	ui = new UI();
	ui.initHTML(cars[0]);
	ui.drawHTML(cars[0]);

	// window resize
	window.addEventListener("resize", onWindowResize, false);
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		robotCamera.aspect = window.innerWidth / window.innerHeight;
		robotCamera.updateProjectionMatrix();

		document.getElementById("robotView").style.width = (window.innerWidth / 3) + "px";
		document.getElementById("robotView").style.height = (window.innerHeight / 3) + "px";

		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	onWindowResize();

	// onmouse move
	window.addEventListener("mousemove", onMouseMove, false);
	function onMouseMove(e) {
		//console.log(e.clientX + ", " + e.clientY);
	}
}


// called per frame
function animate() {	
	requestAnimationFrame(animate);
	delta = clock.getDelta();
	var time = clock.getElapsedTime() * 5;
	controls.update(delta);

	for(var i = 0; i < cars.length; i++) {
		switch(cars[i].mode) {
			// do manual run
			case MODE.MANUAL: {
				manualAction(delta);
				break;
			}
			// do auto run
			case MODE.LEARNING:
			case MODE.FREEDOM: {
				var command = cars[i].think();
				cars[i].act(command, delta);
				if(i == selected) {
					ui.drawHTML(cars[i]);
				}
				break;
			}
		}
	}

	// update world
	world.update(delta);

	// rendering
	renderer.autoClear = false;

	// renderer to viewport
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);

	// renderer robot camera
	var robotCameraPos = cars[selected].directionVector.clone().multiplyScalar(cars[selected].size / 2);
	robotCameraPos.addVectors(robotCameraPos, cars[selected].mesh.position);
	robotCamera.position.set(robotCameraPos.x, robotCameraPos.y, robotCameraPos.z);
	var robotLookAt = robotCameraPos.addVectors(robotCameraPos, cars[selected].directionVector.clone());
	robotCamera.lookAt(robotLookAt);
	renderer.setViewport(window.innerWidth/3*2, window.innerHeight/3*2, window.innerWidth/3, window.innerHeight/3);
	renderer.clearDepth();
	renderer.render(scene, robotCamera);
}

// keydown function
function manualAction(delta) {
	var acted = false;
	if(keyState.up) {
		cars[selected].act(COMMAND.FORWARD, delta);		
		acted = true;
	} else if(keyState.down) {
		cars[selected].act(COMMAND.BACK, delta);
		acted = true;
	}
	if(keyState.left) {
		cars[selected].act(COMMAND.TURN_LEFT, delta);
		acted = true;
	} else if(keyState.right) {
		cars[selected].act(COMMAND.TURN_RIGHT, delta);
		acted = true;
	}
	if(acted) {
		ui.drawHTML(cars[selected]);
	}
}

// keyup function
document.onkeyup = function(e) { 
	switch(e.keyIdentifier) {
		case "Down":
			keyState.down = false;
			break;
		case "Up":
			keyState.up = false;
			break;
		case "Left":
			keyState.left = false;
			break;
		case "Right":
			keyState.right = false;
			break;
	}
}

// keyup function
document.onkeydown = function(e) { 
	switch(e.keyIdentifier) {
		case "Down":
			keyState.down = true;
			break;
		case "Up":
			keyState.up = true;
			break;
		case "Left":
			keyState.left = true;
			break;
		case "Right":
			keyState.right = true;
			break;
	}
}
