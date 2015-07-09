var GRID = {
	x: 32,  // -8 ~ 7
	z: 32,  // -8 ~ 7
	width: 800
};
var COMMAND = {
	Forward: false,
	Back: false,
	TurnRight: false,
	TurnLeft: false
};
var EYE_PARAM = {
	num: 32,
	eyeSight: 650,
};
var OBJECT_TYPE = {
	NONE: 0,
	OBSTACLE: 1,
	WALL: 2,
	ITEM: 3
};
var CAR_INFO = {
	SPEED: 5,
	ROTATE_AMOUNT: 0.1
};
var clock = new THREE.Clock();
var scene;
var renderer;
var camera;
var robotCamera;
var controls;
var light;
var obstacleCnt = 40;
var obstacles = [];
var car;
var debug;

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
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
	camera.position.y = 400;
	camera.position.z = 800;
	camera.lookAt(new THREE.Vector3(0, 0, 0))

	// robot camera
	robotCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);

	// controls
	controls = new THREE.OrbitControls(camera);
	controls.keys = {};
	controls.damping = 0.2;

	// scene
	scene = new THREE.Scene();

	// light
	light = new THREE.PointLight();
	light.position.set(300, 300, 300);
	scene.add(light);

	// scene helper
	var helper = new THREE.GridHelper(GRID.width, GRID.width / GRID.x * 2);
	helper.setColors(0x0000ff, 0x808080);
	scene.add(helper);

	// generate obstacles
	generateObstacles();

	// generate car
	car = createCube({x:0, z:0}, "./assets/textures/tago.jpg");
	scene.add(car);

	// car eyes
	var material = new THREE.LineBasicMaterial({color: 0xffff00});
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
	var line = new THREE.Line(geometry, material);
	scene.add(line);
	car.eyeLine = line;

	car.updateEyes = function() {
		car.rotationAutoUpdate = true;
		car.updateMatrix();
		car.updateMatrixWorld();
		var matrix = new THREE.Matrix4();
		matrix.extractRotation(car.matrix);
		var direction = new THREE.Vector3(0, 0, 1);
		car.eyeVector = direction.applyMatrix4(matrix);

		// ray caster
		var ray = new THREE.Raycaster(car.position, car.eyeVector.clone().normalize());
		var collisionResults = ray.intersectObjects(obstacles);
		if(collisionResults.length > 0 && collisionResults[0].distance < EYE_PARAM.eyeSight) {
			car.eyeLine.geometry.vertices[0].set(car.position.x, car.position.y, car.position.z);
			car.eyeLine.geometry.vertices[1].set(collisionResults[0].point.x, collisionResults[0].point.y, collisionResults[0].point.z)
			car.eyeLine.material.color.set(0xff0000)
			document.getElementById("eye").innerHTML = collisionResults[0].distance.toFixed(2);
			document.getElementById("eye").style.color = "#ff0000";
		} else {
			var targetPos = car.position.clone();
			targetPos.addVectors(targetPos, car.eyeVector.clone().multiplyScalar(EYE_PARAM.eyeSight))
			car.eyeLine.geometry.vertices[0].set(car.position.x, car.position.y, car.position.z);
			car.eyeLine.geometry.vertices[1].set(targetPos.x, targetPos.y, targetPos.z);
			car.eyeLine.material.color.set(0x99ff00);
			document.getElementById("eye").innerHTML = "650";
			document.getElementById("eye").style.color = "#ffff00";
		}
		car.eyeLine.material.needsUpdate = true;
		car.eyeLine.geometry.verticesNeedUpdate = true;
	}
	car.rotation.y += Math.PI;
	car.updateEyes();


	// window resize
	window.addEventListener("resize", onWindowResize, false);
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		robotCamera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		document.getElementById("robotView").style.width = (window.innerWidth / 3) + "px";
		document.getElementById("robotView").style.height = (window.innerHeight / 3) + "px";

		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	onWindowResize();
}

// keydown function
document.onkeydown = function(e) { 
	switch(e.keyIdentifier) {
		case "Down":
			COMMAND.Back = true;
			break;
		case "Up":
			COMMAND.Forward = true;
			break;
		case "Left":
			COMMAND.TurnLeft = true;
			break;
		case "Right":
			COMMAND.TurnRight = true;
			break;
	}
}

// keyup function
document.onkeyup = function(e) { 
	switch(e.keyIdentifier) {
		case "Down":
			COMMAND.Back = false;
			break;
		case "Up":
			COMMAND.Forward = false;
			break;
		case "Left":
			COMMAND.TurnLeft = false;
			break;
		case "Right":
			COMMAND.TurnRight = false;
			break;
	}
}


// move object to somewhere
function moveTo(mesh) {
	var xMax = Math.floor((GRID.x - 1) / 2);
	var zMax = Math.floor((GRID.z - 1) / 2);
	var xMin = Math.floor(GRID.x/2) * -1;
	var zMin = Math.floor(GRID.z/2) * -1;

	if(COMMAND.TurnRight) {
		mesh.rotation.y -= CAR_INFO.ROTATE_AMOUNT;
		if(collisionDetection()) {
			mesh.rotation.y += CAR_INFO.ROTATE_AMOUNT;
		}
	} else if(COMMAND.TurnLeft) {
		mesh.rotation.y += CAR_INFO.ROTATE_AMOUNT;
		if(collisionDetection()) {
			mesh.rotation.y -= CAR_INFO.ROTATE_AMOUNT;
		}
	}
	if(COMMAND.Forward) {
		mesh.position.addVectors(mesh.position.clone(), car.eyeVector.clone().multiplyScalar(CAR_INFO.SPEED));
		if(collisionDetection()) {
			mesh.position.sub(car.eyeVector.clone().multiplyScalar(CAR_INFO.SPEED));
		}		
	} else if(COMMAND.Back) {
		mesh.position.sub(car.eyeVector.clone().multiplyScalar(CAR_INFO.SPEED));
		if(collisionDetection()) {
			mesh.position.addVectors(mesh.position.clone(), car.eyeVector.clone().multiplyScalar(CAR_INFO.SPEED));
		}		
	}
	mesh.updateEyes();
}

// collision detection
function collisionDetection() {
	car.matrixAutoUpdate = true;
	car.updateMatrix();
	car.updateMatrixWorld();

	// from car vector to each objects vector
	var boundingBox = [
		car.geometry.vertices[0].clone().applyMatrix4(car.matrixWorld),
		car.geometry.vertices[1].clone().applyMatrix4(car.matrixWorld),
		car.geometry.vertices[4].clone().applyMatrix4(car.matrixWorld),
		car.geometry.vertices[5].clone().applyMatrix4(car.matrixWorld),
		car.geometry.vertices[0].clone().applyMatrix4(car.matrixWorld),
	]
	// set y to the middle to avoid bug
	for(var i = 0; i < boundingBox.length; i++) {
		boundingBox[i].y /= 2;
	}
	for(var i = 0; i < boundingBox.length-1; i++) {
		var directionVector = boundingBox[i+1].clone();
		directionVector.subVectors(directionVector, boundingBox[i]);

		var ray = new THREE.Raycaster(boundingBox[i], directionVector.normalize());
		var collisionResults = ray.intersectObjects(obstacles);
		if(collisionResults.length > 0 && collisionResults[0].distance < car.size) {
			return true;
		}
	}
	return false;
}

// generaget obstacles
function generateObstacles() {
	for(var i = 0; i < obstacleCnt; i++) {
		var obstacle = {
			x: 0,
			z: 0
		}
		do {
			obstacle.x = Math.floor(Math.random() * GRID.x) - Math.floor(GRID.x / 2);
			obstacle.z = Math.floor(Math.random() * GRID.z) - Math.floor(GRID.z / 2);
		} while((obstacle.x < 2 && obstacle.x > -3 && obstacle.z < 2 && obstacle.z > -3));
		var alreadyExists = false;
		for(var j = 0; j < obstacles.length; j++) {
			if(obstacles[j].x == obstacle.x && obstacles[j].z == obstacle.z) {
				alreadyExists = true;
				break;
			}
		}
		if(alreadyExists) {
			i--;
		} else {
			var cube = createCube(obstacle, "./assets/textures/crate.gif");
			cube.x = cube.position.x;
			cube.y = cube.position.y;
			cube.z = cube.position.z;
			cube.objectType = OBJECT_TYPE.OBSTACLE;
			obstacles.push(cube);
			scene.add(cube);
		}
	}
}

// called per frame
function animate() {	
	requestAnimationFrame(animate);
	moveTo(car);
	var delta = clock.getDelta();
	var time = clock.getElapsedTime() * 5;
	controls.update(delta);
	renderer.autoClear = false;

	// renderer to viewport
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render( scene, camera);

	// renderer robot camera
	var robotCameraPos = car.eyeVector.clone().multiplyScalar(car.size / 2);
	robotCameraPos.addVectors(robotCameraPos, car.position);
	robotCamera.position.set(robotCameraPos.x, robotCameraPos.y, robotCameraPos.z);
	var robotLookAt = robotCameraPos.addVectors(robotCameraPos, car.eyeVector.clone());
	robotCamera.lookAt(robotLookAt);
	renderer.setViewport(window.innerWidth/3*2, window.innerHeight/3*2, window.innerWidth/3, window.innerHeight/3);
	renderer.render(scene, robotCamera);
}



// function to create a cube
function createCube(obstacle, src) {
	// obstacle
	var size = GRID.width * 2 / GRID.x;
	var geometry = new THREE.BoxGeometry(size, size, size);
	var texture = THREE.ImageUtils.loadTexture(src);
	texture.anisotropy = renderer.getMaxAnisotropy();
	var material = new THREE.MeshBasicMaterial({map: texture});
	mesh = new THREE.Mesh(geometry, material);
	mesh.size = size;
	mesh.grid = obstacle;
	adjustMesh(mesh);
	return mesh;
}

// convert grid position to normal position
function adjustMesh(mesh) {
	mesh.position.y = mesh.size / 2;
	mesh.position.z = mesh.grid.z * mesh.size;
	mesh.position.x = mesh.grid.x * mesh.size;
	if(GRID.x % 2 == 0) {
		mesh.position.z += GRID.width / GRID.z;
		mesh.position.x += GRID.width / GRID.x;		
	}
}
