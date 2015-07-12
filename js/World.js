/****************************/
//  World to put object
/****************************/
var World = function(param) {
	var container = new THREE.Mesh();
	container.param = param;
	container.floor = null;
	container.skydome = null;
	container.worldSize = param.WORLD_SIZE;
	container.obstacles = [];

	// floor
	var geometry = new THREE.PlaneGeometry(param.WORLD_SIZE, param.WORLD_SIZE, 16, 16);
	var texture = THREE.ImageUtils.loadTexture("./assets/textures/floor.jpg");
	texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
	var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: texture});
	container.floor = new THREE.Mesh(geometry, material);
	container.floor.rotateX(-Math.PI/2);
	container.floor.position.y -= 0.4;
	container.add(container.floor);

	// generate skydome
	var texture = THREE.ImageUtils.loadTexture("assets/textures/stars.jpg")
	texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
	var material = new THREE.MeshPhongMaterial({
		shininess: 10,
		side: THREE.DoubleSide,
		map: texture
	});
	var sphere = new THREE.BoxGeometry(4200, 3000, 4200);
	container.skydome = new THREE.Mesh(sphere, material);
	scene.add(container.skydome);

	// function to detect collision
	container.collisionDetection = function(object) {
		object.matrixAutoUpdate = true;
		object.updateMatrix();
		object.updateMatrixWorld();

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
			var collisionResults = ray.intersectObjects(container.children);
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
				object.position.x = Math.random()*param.WORLD_SIZE - halfSize;
				object.position.z = Math.random()*param.WORLD_SIZE - halfSize;
				object.rotateY(Math.random() * Math.PI * 2);
			} while(container.collisionDetection(object));
		} else {
			var radius = 0;
			do {
				var theta = Math.random() * Math.PI * 2;
				object.position.x = position.x + Math.cos(theta) * radius;
				object.position.z = position.z + Math.cos(theta) * radius;
				radius += 1;
				if(radius > container.worldSize) {
					alert("cant put object there");
					return false;
				}
			} while(container.collisionDetection(object));
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
				break;
			}
		}
		return allObjects;
	}


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

			// walls
			var size = COURSE.RANDOM.WALL_SIZE;
			var geometry = new THREE.BoxGeometry(size, size, size);
			var texture = THREE.ImageUtils.loadTexture(COURSE.RANDOM.WALL_TEXTURE);
			var material = new THREE.MeshBasicMaterial({map: texture});
			for(var x = -halfSize; x <= halfSize; x += size) {
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.y = size / 2;
				mesh.position.x = x;
				mesh.position.z = -halfSize;
				mesh.objectType = OBJECT_TYPE.WALL;
				container.add(mesh);
				mesh.updateMatrix();
				mesh.updateMatrixWorld();

				mesh = mesh.clone();
				mesh.position.z = halfSize;
				mesh.objectType = OBJECT_TYPE.WALL;
				container.add(mesh);
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
				mesh.updateMatrix();
				mesh.updateMatrixWorld();

				mesh = mesh.clone();
				mesh.position.x = halfSize;
				mesh.objectType = OBJECT_TYPE.WALL;
				container.add(mesh);
				mesh.updateMatrix();
				mesh.updateMatrixWorld();
			}

			// obstacles
			var size = COURSE.RANDOM.OBSTACLE_SIZE;
			var geometry = new THREE.BoxGeometry(size, size, size);
			var texture = THREE.ImageUtils.loadTexture(COURSE.RANDOM.OBSTACLE_TEXTURE);
			var material = new THREE.MeshBasicMaterial({map: texture});
			for(var i = 0; i < COURSE.RANDOM.NUM_OBSTACLES; i++) {
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.y = size / 2;
				container.putIntoWorld(mesh);
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

	// function to update objects in world
	container.update = function(delta) {
		// update skydome
		container.skydome.rotation.y += delta/20;
	}

	return container;
}