/********************
// Constant variable
*********************/
var GRID = {
	x: 32,
	z: 32,
	width: 800
};
var COMMAND = {
	FORWARD: 0,
	BACK: 1,
	TURN_LEFT: 2,
	TURN_RIGHT: 3,
	LENGTH: 4
};
var COMMAND_TEXT = [
	"⇧ FORWARD",
	"⇩ BACK",
	"⇦ LEFT",
	"⇨ RIGHT"
];
var EYE_PARAM = {
	COVER: Math.PI * 2,
	NUM_EYES: 128,
	DISTANCE: 650,
	DANGER_COLOR: 0xff0000,
	SAFE_COLOR: 0xffff00,
};
var OBJECT_TYPE = {
	NONE: 0,
	OBSTACLE: 1,
	WALL: 2,
	ITEM: 3,
	CAR: 4
};
var CAR_INFO = {
	SIZE: 50,
	SPEED: 200,
	ROTATE_AMOUNT: 2
};
var MODE = {
	MANUAL: 0,
	AUTO: 1,
}


/**********************
// Global variable
***********************/
var mode = MODE.AUTO;
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
var obstacleCnt = 40;
var delta = 0;
var obstacles = [];
var yAxis = new THREE.Vector3(0, 1, 0);
var cars;
var selected;
var skydome;


var debug;


/************************
// Car object definition
// param.ID
// param.src
// param.size
// param.eyeParam
************************/
var Car = function(param) {
	// object variables
	this.mesh = null;
	this.eyes = new Array();
	this.directionVector = new THREE.Vector3(0, 0, 1);
	this.barChart = null;
	this.barChartCanvas = null;
	this.IDTag = null;
	this.ID = param.ID;
	this.action = COMMAND.FORWARD;
	this.rewards = 0;
	this.moveSucceeded = false;
	this.brain = new deepqlearn.Brain(param.eyeParam.NUM_EYES, COMMAND.LENGTH);
	this.size = param.size;
	this.offsetY = this.size / 2;

	// create bar chart
	this.barChartCanvas = document.createElement("canvas");
	this.barChartCanvas.width = 800;
	this.barChartCanvas.height = 110;
	this.barChartCanvas.setAttribute("class", "barChart");
	document.getElementById("barChartContainer").appendChild(this.barChartCanvas);

	var ctx = this.barChartCanvas.getContext("2d");
    var gradient = ctx.createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, 'rgba(100,250,100,1)');   
    gradient.addColorStop(0.7, 'rgba(100,200,205,0.3)');
    gradient.addColorStop(1, 'rgba(0,51,153,0.5)');   
    
    var gradient2 = ctx.createLinearGradient(0, 0, 0, 100);
    gradient2.addColorStop(0, 'rgba(0,51,153,0.9)');   
    gradient2.addColorStop(1, 'rgba(0,51,153,0)');

	var data = {
	    labels: [],
	    datasets: [
	        {
                fillColor : gradient,
                highlightFill: gradient2,
                strokeColor : "rgba(151,187,205,1)",
 	            data: []
	        }
	    ]
	};
	data.labels = new Array(param.eyeParam.NUM_EYES);
	data.datasets[0].data = new Array(param.eyeParam.NUM_EYES);
	for(var i = 0; i < param.eyeParam.NUM_EYES; i++) {
		data.labels[i] = "";
		data.datasets[0].data[i] = 0;
	}
	var option = {
		responsive: true,
		animation: false,
		inGraphDataShow: false,
		inGraphDataFontSize: 1,
//		barShowStroke: false,
		showScale: false,
		barValueSpacing: 0.7,
		barDatasetSpacing: 1,
		barStrokeWidth: 0.5,
		scaleShowLabels: false,
		scaleShowLine: false,
		scaleShowHorizontalLines: false,
		scaleShowGridLines: false,
		scaleShowVerticalLines: false,
		scaleBeginAtZero: true,
		legendTemplate: "",
		scaleShowGridLines: false,
	}
	this.barChart = new Chart(this.barChartCanvas.getContext("2d")).Bar(data, option);

	// create car mesh
	var geometry = new THREE.BoxGeometry(param.size, param.size, param.size);
	var texture = THREE.ImageUtils.loadTexture(param.src);
	texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
	var material = new THREE.MeshBasicMaterial({map: texture});
	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position.y = this.offsetY;

	// ID tag
	var pTag = document.createElement("p");
	var spanTag = document.createElement("span");
	spanTag.appendChild(document.createTextNode("ID"));
	pTag.appendChild(spanTag);
	spanTag = document.createElement("span");
	spanTag.appendChild(document.createTextNode(this.ID));
	pTag.appendChild(spanTag);
	this.IDTag = pTag;

	// car eyes
	var stepAngle = param.eyeParam.COVER / (param.eyeParam.NUM_EYES - 1);
	var startAngle = -param.eyeParam.COVER / 2;
	for(var i = 0; i < param.eyeParam.NUM_EYES; i++) {
		var material = new THREE.LineBasicMaterial({color: param.eyeParam.SAFE_COLOR});
		var geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
		var eye = new THREE.Line(geometry, material);
		eye.angleY = startAngle + stepAngle * i;
		this.eyes.push(eye);
	}

	// function to update eyes
	/*********************
	eye.angleY;     // rotation from y axis.
	eye.target;     // what that eye can see.
	eye.distance;   // distance to target.
	**********************/
	this.updateEyes = function() {
		// update mesh
		this.mesh.rotationAutoUpdate = true;
		this.mesh.updateMatrix();
		this.mesh.updateMatrixWorld();

		var matrix = new THREE.Matrix4();
		matrix.extractRotation(this.mesh.matrix);
		var direction = new THREE.Vector3(0, 0, 1);
		this.directionVector = direction.applyMatrix4(matrix);

		this.infoTags = new Array();
		for(var i = 0; i < this.eyes.length; i++) {
			// update each eye
			var ray = new THREE.Raycaster(this.mesh.position, this.directionVector.clone().applyAxisAngle(yAxis, this.eyes[i].angleY));
			var collisionResults = ray.intersectObjects(obstacles);
			if(collisionResults.length > 0 && collisionResults[0].distance < param.eyeParam.DISTANCE) {
				this.eyes[i].geometry.vertices[0].set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
				this.eyes[i].geometry.vertices[1].set(collisionResults[0].point.x, collisionResults[0].point.y, collisionResults[0].point.z)
				this.eyes[i].material.color.set(EYE_PARAM.DANGER_COLOR);
				this.eyes[i].target = OBJECT_TYPE.OBSTACLE;
				this.eyes[i].distance = collisionResults[0].distance;
			} else {
				var targetPos = this.mesh.position.clone();
				targetPos.addVectors(targetPos, this.directionVector.clone().applyAxisAngle(yAxis, this.eyes[i].angleY).multiplyScalar(param.eyeParam.DISTANCE))
				this.eyes[i].geometry.vertices[0].set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
				this.eyes[i].geometry.vertices[1].set(targetPos.x, targetPos.y, targetPos.z);
				this.eyes[i].material.color.set(param.eyeParam.SAFE_COLOR);
				this.eyes[i].target = OBJECT_TYPE.NONE;
				this.eyes[i].distance = param.eyeParam.DISTANCE;
			}
			this.eyes[i].material.needsUpdate = true;
			this.eyes[i].geometry.verticesNeedUpdate = true;
		}
	}

	// function to detect collision
	this.collisionDetection = function() {
		this.mesh.matrixAutoUpdate = true;
		this.mesh.updateMatrix();
		this.mesh.updateMatrixWorld();

		// from car vector to each objects vector
		var boundingBox = [
			this.mesh.geometry.vertices[0].clone().applyMatrix4(this.mesh.matrixWorld),
			this.mesh.geometry.vertices[1].clone().applyMatrix4(this.mesh.matrixWorld),
			this.mesh.geometry.vertices[4].clone().applyMatrix4(this.mesh.matrixWorld),
			this.mesh.geometry.vertices[5].clone().applyMatrix4(this.mesh.matrixWorld),
			this.mesh.geometry.vertices[0].clone().applyMatrix4(this.mesh.matrixWorld),
		]
		// set y to the middle to avoid bug
		for(var i = 0; i < boundingBox.length; i++) {
			boundingBox[i].y /= 2;
		}
		for(var i = 0; i < boundingBox.length-1; i++) {
			var edgeVector = boundingBox[i+1].clone();
			edgeVector.subVectors(edgeVector, boundingBox[i]);

			var ray = new THREE.Raycaster(boundingBox[i], edgeVector.normalize());
			var collisionResults = ray.intersectObjects(obstacles);
			if(collisionResults.length > 0 && collisionResults[0].distance < this.size) {
				return true;
			}
		}
		return false;
	}

	// function to move car
	this.move = function(action, delta) {
		var moveSucceeded = true;

		if(action == COMMAND.TURN_RIGHT) {
			this.mesh.rotation.y -= CAR_INFO.ROTATE_AMOUNT * delta;
			if(this.collisionDetection()) {
				moveSucceeded = false;
				this.mesh.rotation.y += CAR_INFO.ROTATE_AMOUNT * delta;
			}
		} else if(action == COMMAND.TURN_LEFT) {
			this.mesh.rotation.y += CAR_INFO.ROTATE_AMOUNT * delta;
			if(this.collisionDetection()) {
				moveSucceeded = false;
				this.mesh.rotation.y -= CAR_INFO.ROTATE_AMOUNT * delta;
			}
		} else if(action == COMMAND.FORWARD) {
			this.mesh.position.addVectors(this.mesh.position.clone(), this.directionVector.clone().multiplyScalar(CAR_INFO.SPEED * delta));
			if(this.collisionDetection()) {
				moveSucceeded = false;
				this.mesh.position.sub(this.directionVector.clone().multiplyScalar(CAR_INFO.SPEED * delta));
			}		
		} else if(action == COMMAND.BACK) {
			this.mesh.position.sub(this.directionVector.clone().multiplyScalar(CAR_INFO.SPEED * delta));
			if(this.collisionDetection()) {
				moveSucceeded = false;
				this.mesh.position.addVectors(this.mesh.position.clone(), this.directionVector.clone().multiplyScalar(CAR_INFO.SPEED * delta));
			}
		}
		this.updateEyes();
		return moveSucceeded;
	}

	// stop to learn
	this.stopToLearn = function() {
		this.brain.epsilon_test_time = 0.05;
		this.brain.learning = false;
	}

	// start to learn
	this.startToLearn = function() {
		this.brain.epsilon_test_time = 0.05;
		this.brain.learning = true;		
	}

	// function to think what action to do
	this.think = function() {
		var inputInfo = new Array();
		for(var i = 0; i < this.eyes.length; i++) {
			inputInfo.push(this.eyes[i].distance/param.eyeParam.DISTANCE);
		}
		this.action = this.brain.forward(inputInfo);
		return this.action;
	}

	// function to do action
	this.act = function(action, delta) {
		this.action = action;
		this.moveSucceeded = this.move(this.action, delta);

		// compute rewards
		// rewards of distance
		var distanceRewards = 0;
		for(var i = 0; i < this.eyes.length; i++) {
			distanceRewards += this.eyes[i].distance / param.eyeParam.DISTANCE;
		}
		distanceRewards /= this.eyes.length;

		// rewards of forward
		var forwardRewards = 0;
		if(action == COMMAND.FORWARD && distanceRewards > 0.7 && this.moveSucceeded) {
			forwardRewards = 0.1 * distanceRewards;
		}

		// penalty  
		var penalty = 0;
		if(!this.moveSucceeded) {
			penalty = 1;
		}

		// backwards
		this.rewards = distanceRewards + forwardRewards - penalty;
		this.brain.backward(this.rewards);
	}

	// function to draw HTML
	this.drawToHTML = function() {
		/***************************
		// info tag
		****************************/
		/*
		var infoTag = document.getElementById("info");
		infoTag.innerHTML = "";
		*/

		/***************************
		// status tag
		****************************/
		var statusTag = document.getElementById("status");
		statusTag.innerHTML = "";
		statusTag.appendChild(this.IDTag);

		// action tag
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("ACTION"));
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode(COMMAND_TEXT[this.action]));
		pTag.appendChild(spanTag);
		statusTag.appendChild(pTag);

		// result tag
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("RESULT"));
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		if(!this.moveSucceeded) {
			spanTag.setAttribute("class", "danger");
			spanTag.appendChild(document.createTextNode("COLLISION!!"));
		} else {
			spanTag.setAttribute("class", "safe");
			spanTag.appendChild(document.createTextNode("CLEAR"));		
		}
		pTag.appendChild(spanTag);
		statusTag.appendChild(pTag);

		// rewards tag
		pTag = document.createElement("p");
		spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("REWARDS"));
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "score");
		spanTag.appendChild(document.createTextNode(this.rewards.toFixed(2)));
		pTag.appendChild(spanTag);
		statusTag.appendChild(pTag);

		/************************
		// update barchart tag
		/************************/
		var barChartContainer = document.getElementById("barChartContainer");
		barChartContainer.innerHTML = "";
		var pTag = document.createElement("p");
		pTag.setAttribute("id", "inputLabel");
		var averageDistance = 0;
		for(var i = 0; i < this.eyes.length; i++) {
			averageDistance += this.eyes[i].distance;
		}
		averageDistance /= this.eyes.length;
		pTag.appendChild(document.createTextNode("INPUT AVERAGE　　" + averageDistance.toFixed(2)));
		barChartContainer.appendChild(pTag);
		barChartContainer.appendChild(this.barChartCanvas);
		for(var i = 0; i < this.eyes.length; i++) {
			this.barChart.datasets[0].bars[i].value = this.eyes[i].distance;
		}
		this.barChart.update();
	}

	return this;
}

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

	// floor
	var geometry = new THREE.PlaneGeometry(GRID.width * 2, GRID.width * 2, 16, 16);
	var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: THREE.ImageUtils.loadTexture("./assets/textures/floor.jpg")});
	var floor = new THREE.Mesh(geometry, material);
	floor.rotateX(-Math.PI/2);
	floor.position.y -= 0.4;
	scene.add(floor);

	// generate obstacles
	generateObstacles();

	// generate skydome

	var texture = THREE.ImageUtils.loadTexture("assets/textures/stars.jpg")
	texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
	var material = new THREE.MeshPhongMaterial({
		shininess: 10,
		side: THREE.DoubleSide,
//		emissive: 0x444444,
		map: texture
	});
	var sphere = new THREE.BoxGeometry(4200, 3000, 4200);
	skydome = new THREE.Mesh(sphere, material);
	scene.add(skydome);

	// generate car
	cars = new Array();
	var car = new Car({
		ID: "CAR1",
		src: "./assets/textures/tago.jpg",
		size: CAR_INFO.SIZE,
		eyeParam: EYE_PARAM,
	});
	car.mesh.rotation.y += Math.PI;
	scene.add(car.mesh);
	for(var i = 0; i < car.eyes.length; i++) {
		scene.add(car.eyes[i]);
	}
	cars.push(car);
	selected = 0;

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

	// create wall
	var xMax = Math.floor((GRID.x - 1) / 2) + 1;
	var zMax = Math.floor((GRID.z - 1) / 2) + 1;
	var xMin = Math.floor(GRID.x/2) * -1 - 1;
	var zMin = Math.floor(GRID.z/2) * -1 - 1;
	for(var x = xMin; x <= xMax; x++) {
		var cube = createCube({x:x, z:zMin}, "./assets/textures/stone.jpg");
		cube.x = cube.position.x;
		cube.y = cube.position.y;
		cube.z = cube.position.z;
		cube.objectType = OBJECT_TYPE.OBSTACLE;
		obstacles.push(cube);
		scene.add(cube);

		var cube = createCube({x:x, z:zMax}, "./assets/textures/stone.jpg");
		cube.x = cube.position.x;
		cube.y = cube.position.y;
		cube.z = cube.position.z;
		cube.objectType = OBJECT_TYPE.OBSTACLE;
		obstacles.push(cube);
		scene.add(cube);	
	}
	for(var z = zMin+1; z < zMax; z++) {
		var cube = createCube({x:xMin, z:z}, "./assets/textures/stone.jpg");
		cube.x = cube.position.x;
		cube.y = cube.position.y;
		cube.z = cube.position.z;
		cube.objectType = OBJECT_TYPE.OBSTACLE;
		obstacles.push(cube);
		scene.add(cube);	

		var cube = createCube({x:xMax, z:z}, "./assets/textures/stone.jpg");
		cube.x = cube.position.x;
		cube.y = cube.position.y;
		cube.z = cube.position.z;
		cube.objectType = OBJECT_TYPE.OBSTACLE;
		obstacles.push(cube);
		scene.add(cube);	
	}
}


// called per frame
function animate() {	
	requestAnimationFrame(animate);
	delta = clock.getDelta();
	var time = clock.getElapsedTime() * 5;
	controls.update(delta);

	// do auto run
	if(mode == MODE.AUTO) {
		for(var i = 0; i < cars.length; i++) {
			var action = cars[i].think();
			cars[i].act(action, delta);
			cars[i].drawToHTML();
		}
	} else {
		manualAction(delta);
	}

	// update skydome
	skydome.rotation.y += delta/10;

	// rendering
	renderer.autoClear = false;

	// renderer to viewport
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render( scene, camera);

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
		cars[selected].drawToHTML();
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
