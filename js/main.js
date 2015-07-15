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
	COVER: Math.PI / 3,
	NUM_EYES: 6,
	DISTANCE: 300,
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
	FLOOR: {
		text: "FLOOR",
	},
	EYE_GROUP: {
		text: "EYES",
	},
};
var CAR_INFO = {
	CAR_TEXTURE: "./assets/textures/home.png",
	SIZE: 50,
	SPEED: 200,
	ROTATE_AMOUNT: 2
};

// cursor mode
var CURSOR_MODE = {
	SELECT: {
		TEXTURE: "./assets/textures/select.png",
		text: "SELECT",
	},
	DELETE: {
		TEXTURE: "./assets/textures/delete.png",
		text: "DELETE",
	},
	ADD_CAR: {
		TEXTURE: "./assets/textures/addCar.png",
		text: "+CAR",
	},
	ADD_OBSTACLE: {
		TEXTURE: "./assets/textures/barrier.png",
		text: "+BOX",
	},
	ADD_ITEM: {
		TEXTURE: "./assets/textures/item.png",
		text: "+ITEM",
	}
}

// deep learning mode
var MODE = {
	NONE: {
		switchStyle: "brightness(100%) grayscale(90%)",
		text: "NONE",
		class: "",
	},
	MANUAL: {
		switchStyle: "brightness(100%) hue-rotate(0deg)",
		text: "MANUAL",
		class: "inactive",
	},
	LEARNING: {
		switchStyle: "brightness(150%) hue-rotate(250deg)",
		text: "LEARNING",
		class: "safe",
	},
	FREEDOM: {
		switchStyle: "brightness(150%) hue-rotate(190deg)",
		text: "FREEDOM",
		class: "active",
	}
}
var COURSE = {
	NONE: 0,
	RANDOM: {
		NUM_OBSTACLES: 50,
		OBSTACLE_SIZE: 50,
		FLOOR_TEXTURE: "./assets/textures/circle.jpg",
		SKY_TEXTURE: "assets/textures/stars.jpg",
		OBSTACLE_TEXTURE: "./assets/textures/crystal.jpg",
		ITEM_TEXTURE:"./assets/textures/zero.png",
		ITEM_SIZE: 50,
		NUM_ITEMS: 2,
		WALL_SIZE: 100,
		WALL_TEXTURE: "./assets/textures/metal.jpg",	
	},
}
var WORLD_INFO = {
	WORLD_SIZE: 1600,
	COURSE: COURSE.RANDOM
}

/**********************
// Global variable
***********************/
var clock = new THREE.Clock();
var scene;
var renderer;
var camera;
var robotCamera;
var controls;
var light;
var delta = 0;
var debug;



var env;



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
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 4200);
	camera.position.y = 400;
	camera.position.z = 800;
	camera.lookAt(new THREE.Vector3(0, 0, 0))

	// robot camera
	robotCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 4200);

	// controls
	controls = new THREE.OrbitControls(camera);
	controls.keys = {};
	controls.maxDistance = 1500;
	controls.minDistance = 200;
	controls.damping = 0.2;

	// scene
	scene = new THREE.Scene();

	// env
	env = new Env();
	env.initEnv(scene, camera);

	// light
	light = new THREE.PointLight();
	light.position.set(300, 300, 300);
	scene.add(light);

	light = new THREE.PointLight();
	light.position.set(-600, 600, -600);
	scene.add(light);



/*
	var texture = THREE.ImageUtils.loadTexture("./assets/textures/soccer.png");
	texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
	var material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide, transparent: true, opacity: 1, bumpMap: texture});
	var geometry = new THREE.SphereGeometry(25, 32, 32 );
	var sphere = new THREE.Mesh( geometry, material );
	sphere.position.y = 22;
	scene.add( sphere );

	var texture = THREE.ImageUtils.loadTexture("./assets/textures/cola.png");
	texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
	var material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide, transparent: true, opacity: 1});
	var geometry = new THREE.CylinderGeometry(35, 25, 80, 32, 1, true);
	var cylinder = new THREE.Mesh( geometry, material );
	cylinder.position.y = 40;
	cylinder.position.x = 50;
	scene.add( cylinder );
*/
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
}


// called per frame
function animate() {	
	requestAnimationFrame(animate);
	delta = clock.getDelta();
	var time = clock.getElapsedTime() * 5;
	controls.update(delta);

	env.update(delta);

	// rendering
	renderer.autoClear = false;

	// renderer to viewport
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);

	// renderer robot camera
	var car = env.getCarSelected();
	if(car) {
		var robotCameraPos = car.directionVector.clone().multiplyScalar(car.cameraOffset);
		robotCameraPos.addVectors(robotCameraPos, car.mesh.position);
		robotCamera.position.set(robotCameraPos.x, robotCameraPos.y, robotCameraPos.z);
		var robotLookAt = robotCameraPos.addVectors(robotCameraPos, car.directionVector.clone());
		robotCamera.lookAt(robotLookAt);
	} else {
		robotCamera.position.set(camera.position.x, camera.position.y, camera.position.z);
		robotCamera.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
	}
	//robotCamera.position.y = 300;
	//robotCamera.lookAt(car.mesh.position.clone());
	renderer.setViewport(window.innerWidth/3*2, window.innerHeight/3*2, window.innerWidth/3, window.innerHeight/3);
	renderer.clearDepth();
	renderer.render(scene, robotCamera);
}



