/****************************/
//  World to put object
/****************************/
var World = function() {
	var container = new THREE.Mesh();
	container.param = null;
	container.worldSize = 0;

	container.skydome = null;
	container.floor = null;
	container.walls = [];
	container.obstacles = [];
	container.cars = [];

	// function to detect collision
	container.collisionDetection = function(object) {
		object.matrixAutoUpdate = true;
		object.updateMatrix();
		object.updateMatrixWorld();

		// all object
		var allObjects = container.getEverythingExceptMe(object);

		// from car vector to each objects vector
		var boundingBox = [
			object.geometry.vertices[0].clone().applyMatrix4(object.matrixWorld),
			object.geometry.vertices[1].clone().applyMatrix4(object.matrixWorld),
			object.geometry.vertices[4].clone().applyMatrix4(object.matrixWorld),
			object.geometry.vertices[5].clone().applyMatrix4(object.matrixWorld),
			object.geometry.vertices[0].clone().applyMatrix4(object.matrixWorld),
		]
		// set y to the middle to avoid bug
		for(var i = 0; i < boundingBox.length; i++) {
			boundingBox[i].y /= 2;
		}
		for(var i = 0; i < boundingBox.length-1; i++) {
			var edgeVector = boundingBox[i+1].clone();
			edgeVector.subVectors(edgeVector, boundingBox[i]);
			var edgeLength = edgeVector.length();

			var ray = new THREE.Raycaster(boundingBox[i], edgeVector.normalize());
			var collisionResults = ray.intersectObjects(allObjects, false);
			if(collisionResults.length > 0) {
				if(collisionResults[0].object == object) {
					collisionResults.splice(0, 1);
				}
				if(collisionResults.length > 0 && collisionResults[0].distance < edgeLength) {
					return collisionResults[0].object;
				}
			}
		}
		return false;
	}

	// function to put an object into the world
	container.putIntoWorld = function(object, position) {
		var halfSize = container.worldSize / 2;

		// random put into the world if no position
		if(!position) {
			do {
				object.position.x = Math.random()*this.worldSize - halfSize;
				object.position.z = Math.random()*this.worldSize - halfSize;
				object.rotateY(Math.random() * Math.PI * 2);
			} while(container.collisionDetection(object));
		} else {
			var radius = 0;
			do {
				var theta = Math.random() * Math.PI * 2;
				object.position.x = position.x + Math.cos(theta) * radius;
				object.position.z = position.z + Math.sin(theta) * radius;
				radius += 1;
				if(radius > container.worldSize) {
					alert("cant put object there");
					return false;
				}
			} while(container.collisionDetection(object));
		}
		if(object.objectType == OBJECT_TYPE.CAR) {
			container.cars.push(object);
		}
		container.add(object);
		object.updateMatrix();
		object.updateMatrixWorld();
		return true;
	}

	// function to get all the obejects except ifself
	container.getEverythingExceptMe = function(object) {
		var allObjects = container.children.slice();
		for(var i = 0; i < allObjects.length; i++) {
			if(object == allObjects[i]) {
				allObjects.splice(i, 1);
			}
		}
		return allObjects;
	}


	// function to init world
	container.initWorld = function(param) {
		// initialize everything
		container.clearWorld();
		container.param = param;
		container.worldSize = param.WORLD_SIZE;

		// generate obstacles
		switch(param.COURSE) {
			/*****************
			// none barrier
			*****************/
			case COURSE.NONE: {
				break;
			}
			/******************
			// random pattern
			*******************/
			case COURSE.RANDOM: {
				// world half size
				var halfSize = param.WORLD_SIZE / 2;

				// floor
				var geometry = new THREE.PlaneGeometry(param.WORLD_SIZE, param.WORLD_SIZE, 32, 32);
				var texture = THREE.ImageUtils.loadTexture(param.COURSE.FLOOR_TEXTURE);
				texture.magFilter = THREE.NearestFilter;
			    texture.minFilter = THREE.NearestFilter;
				var material = new THREE.MeshBasicMaterial({
					side: THREE.DoubleSide, 
					map: texture,
					transparent: false, 
					opacity: 1,
					shininess: 10
				});
				container.floor = new THREE.Mesh(geometry, material);
				container.floor.rotateX(-Math.PI/2);
				container.floor.position.y -= 3;
				container.floor.objectType = OBJECT_TYPE.FLOOR;
				container.floor.updateMatrix();
				container.floor.updateMatrixWorld();
				container.add(container.floor);

				// generate skydome
				var texture = THREE.ImageUtils.loadTexture(param.COURSE.SKY_TEXTURE)
				texture.magFilter = THREE.NearestFilter;
			    texture.minFilter = THREE.NearestFilter;
				var material = new THREE.MeshPhongMaterial({
					shininess: 10,
					side: THREE.DoubleSide,
					map: texture
				});
				var sphere = new THREE.BoxGeometry(4200, 3300, 4200);
				container.skydome = new THREE.Mesh(sphere, material);
				container.skydome.updateMatrix();
				container.skydome.updateMatrixWorld();
				container.add(container.skydome);

				// walls
				var size = param.COURSE.WALL_SIZE;
				var geometry = new THREE.BoxGeometry(size, size, size);
				var texture = THREE.ImageUtils.loadTexture(param.COURSE.WALL_TEXTURE);
				var material = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0.8});
				for(var x = -halfSize; x <= halfSize; x += size) {
					var mesh = new THREE.Mesh(geometry, material);
					mesh.position.y = size / 2;
					mesh.position.x = x;
					mesh.position.z = -halfSize;
					mesh.objectType = OBJECT_TYPE.WALL;
					container.add(mesh);
					container.walls.push(mesh);
					mesh.updateMatrix();
					mesh.updateMatrixWorld();

					mesh = mesh.clone();
					mesh.position.z = halfSize;
					mesh.objectType = OBJECT_TYPE.WALL;
					container.add(mesh);
					container.walls.push(mesh);
					mesh.updateMatrix();
					mesh.updateMatrixWorld();
				}
				for(var z = -halfSize + size; z < halfSize; z += size) {
					var mesh = new THREE.Mesh(geometry, material);
					mesh.position.y = size / 2;
					mesh.position.z = z;
					mesh.position.x = -halfSize;
					mesh.objectType = OBJECT_TYPE.WALL;
					container.add(mesh);
					container.walls.push(mesh);
					mesh.updateMatrix();
					mesh.updateMatrixWorld();

					mesh = mesh.clone();
					mesh.position.x = halfSize;
					mesh.objectType = OBJECT_TYPE.WALL;
					container.add(mesh);
					container.walls.push(mesh);
					mesh.updateMatrix();
					mesh.updateMatrixWorld();
				}

				// obstacles
				var size = param.COURSE.OBSTACLE_SIZE;
				var geometry = new THREE.BoxGeometry(size, size, size);
				var texture = THREE.ImageUtils.loadTexture(param.COURSE.OBSTACLE_TEXTURE);
				var material = new THREE.MeshBasicMaterial({map: texture});
				for(var i = 0; i < param.COURSE.NUM_OBSTACLES; i++) {
					var mesh = new THREE.Mesh(geometry, material);
					mesh.position.y = size / 2;
					container.putIntoWorld(mesh);
					container.obstacles.push(mesh);
					mesh.objectType = OBJECT_TYPE.OBSTACLE;
				}
				break;
			}
			/********************
			// prebuilt course
			********************/
			default: {
				// generate course using course parameters
				break;
			}
		}
	}

	// function to put an obstacle into the world
	container.addObstacle = function(position, rotation, scale) {		
		var size = container.param.COURSE.OBSTACLE_SIZE;
		var geometry = new THREE.BoxGeometry(size, size, size);
		var texture = THREE.ImageUtils.loadTexture(container.param.COURSE.OBSTACLE_TEXTURE);
		var material = new THREE.MeshBasicMaterial({map: texture});
		var mesh = new THREE.Mesh(geometry, material);
		mesh.objectType = OBJECT_TYPE.OBSTACLE;
		mesh.position.y = size / 2;

		if(position) {
			mesh.position.x = position.x;
			mesh.position.z = position.z;
		}
		if(rotation) {
			mesh.rotation.set(rotation.x, rotation.y, rotation.z);
		}
		if(scale) {
			mesh.scale.set(scale.x, scale.y, scale.z);
		}

		container.putIntoWorld(mesh, position);
		container.obstacles.push(mesh);
	}


	// function to remove car
	container.removeCar = function(car) {
		for(var i = 0; i < container.cars.length; i++) {
			if(container.cars[i] == car.mesh) {
				container.cars.splice(i, 1);
				container.remove(car.mesh);
				container.remove(car.eyeGroup);
				return true;
			}
		}
		return false;
	}

	// function to remove cars
	container.removeCars = function() {
		while(container.cars.length) {
			container.remove(container.cars.pop());
		}
		var eyeGroups = []
		for(var i = 0; i < container.children.length; i++) {
			if(container.children[i].objectType == OBJECT_TYPE.EYE_GROUP) {
				eyeGroups.push(container.children[i]);
			}
		}
		while(eyeGroups.length) {
			container.remove(eyeGroups.pop());
		}
	}

	// funciton to remove obstacle
	container.removeObstacle = function(obstacle) {
		for(var i = 0; i < container.obstacles.length; i++) {
			if(container.obstacles[i] == obstacle) {
				container.obstacles.splice(i, 1);
				container.remove(obstacle);
				return true;
			}
		}
		return false;
	}

	// function to remove all of obstacles
	container.removeObstacles = function() {
		while(container.obstacles.length) {
			container.remove(container.obstacles.pop());
		}
	}

	// function to remove wall
	container.removeWall = function(wall) {
		for(var i = 0; i < container.walls.length; i++) {
			if(container.walls[i] == wall) {
				container.walls.splice(i, 1);
				container.remove(wall);
			}
		}
	}

	// function to remove all of walls
	container.removeWalls = function() {
		while(container.walls.length) {
			container.remove(container.walls.pop());
		}
	}

	// function to remove skydome
	container.removeSkydome = function() {
		if(container.skydome) {
			container.remove(container.skydome);
			container.skydome = null;
			return true;
		}
		return false;
	}

	// function to remove floor
	container.removeFloor = function() {
		if(container.floor) {
			container.remove(container.floor);
			container.floor = null;
			return true;
		}
		return false;
	}

	// remove everything from the world
	container.clearWorld = function() {
		container.removeCars();
		container.removeSkydome();
		container.removeFloor();
		container.removeWalls();
		container.removeObstacles();
	}

	// function to update objects in world
	container.update = function(delta) {
		// update skydome
		if(container.skydome) {
			container.skydome.rotation.y += delta/20;
		}
	}

	return container;
}