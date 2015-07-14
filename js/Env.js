/****************************/
// environment class
/****************************/
var Env = function() {
	this.scene = null;
	this.world = null;
	this.cars = null;
	this.ui = null;
	this.selected = 0;
	this.raycaster = new THREE.Raycaster(); // create once
	this.mouse = new THREE.Vector2(); // create once
	this.cursorMode = CURSOR_MODE.SELECT;
	this.currentCursor = null;
	this.selectCursor = null;
	this.deleteCursor = null;
	this.addCarCursor = null;
	this.addObstacleCursor = null;
	this.carCount = 0;

	this.keyMap = {
		mouseX: 0,
		mouseY: 0,
		up: false,
		down: false,
		left: false,
		right: false,
		shift: false,
		ctrl: false,
	}


	// alias this to avoid namespace collision with event function
	var container = this;


	// function to initialize environment
	this.initEnv = function(scene, camera) {
		// declaration
		this.world = new World();
		this.cars = new Array();
		this.ui = new UI(this);
		this.camera = camera;

		// init scene
		this.scene = scene;
		while(this.scene.children.length) {
			this.scene.children.pop();
		}

		/**********************
		// init cursor helpers
		**********************/
		// select cursor
		var texture = THREE.ImageUtils.loadTexture("./assets/textures/select.png");
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.7, 
			map: texture,
			blending: THREE.AdditiveBlending,
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		this.selectCursor = new THREE.Mesh(planeGeometry, material);
		this.selectCursor.rotateX(-Math.PI/2);
		this.selectCursor.visible = false;
		this.selectCursor.theta = 0;
		this.selectCursor.update = function(delta) {
			this.theta += delta * 4;
			this.rotateZ(delta);
			this.scale.set(1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1);
		}
		this.scene.add(this.selectCursor);

		// delete cursor
		var texture = THREE.ImageUtils.loadTexture("./assets/textures/delete.png");
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.9, 
			map: texture,
			blending: THREE.AdditiveBlending,
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		this.deleteCursor = new THREE.Mesh(planeGeometry, material);
		this.deleteCursor.rotateX(-Math.PI/2);
		this.deleteCursor.visible = false;
		this.deleteCursor.theta = 0;
		this.deleteCursor.update = function(delta) {
			this.theta += delta * 4;
			this.scale.set(1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1);
		}
	
		this.scene.add(this.deleteCursor);

		// AddCar cursor
		var texture = THREE.ImageUtils.loadTexture("./assets/textures/addCar.png");
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.9, 
			map: texture,
			blending: THREE.AdditiveBlending,
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		this.addCarCursor = new THREE.Mesh(planeGeometry, material);
		this.addCarCursor.rotateX(-Math.PI/2);
		this.addCarCursor.visible = false;
		this.addCarCursor.theta = 0;
		this.addCarCursor.update = function(delta) {
			this.rotateZ(delta);
			//this.theta += delta * 4;
			//this.scale.set(1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1);
		}
		this.scene.add(this.addCarCursor);

		// AddObstacle cursor
		var texture = THREE.ImageUtils.loadTexture("./assets/textures/stop.png");
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.5, 
			map: texture,
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		this.addObstacleCursor = new THREE.Mesh(planeGeometry, material);
		this.addObstacleCursor.rotateX(-Math.PI/2);
		this.addObstacleCursor.visible = false;
		this.addObstacleCursor.theta = 0;
		this.addObstacleCursor.update = function(delta) {
			//this.rotateZ(-delta);
			this.theta += delta * 4;
			this.scale.set(1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1);
		}		
		this.scene.add(this.addObstacleCursor);		

		// set current mode to select mode
		this.switchCursorMode(CURSOR_MODE.SELECT);

		// init world
		this.world.initWorld(WORLD_INFO);
		this.scene.add(this.world);

		// init cars
		this.addCar(new THREE.Vector3(Math.random(), Math.random(), Math.random()));


		// init ui
		this.ui.initHTML(this.cars[0]);
		this.ui.drawHTML(this.cars[0]);
	}

	// return selected car
	this.getCarSelected = function() {
		if(this.selected != -1 && this.cars.length > 0) {
			return this.cars[this.selected];
		} else {
			return false;
		}
	}

	// function to rebuild only world 
	this.rebuildWorld = function() {
		this.world.initWorld(WORLD_INFO);

		// add cars
		for(var i = 0; i < this.cars.length; i++) {
			var car = this.cars[i];
			this.world.putIntoWorld(car.mesh, car.mesh.position);
			this.world.add(car.eyeGroup);	
			car.updateEyes();		
		}
	}

	// function to switch cursor mode
	this.switchCursorMode = function(cursorMode) {
		if(cursorMode != null) {
			this.cursorMode = cursorMode;
		} else {
			switch(this.cursorMode) {
				case CURSOR_MODE.SELECT: {
					this.cursorMode = CURSOR_MODE.DELETE;
					break;
				}
				case CURSOR_MODE.DELETE: {
					this.cursorMode = CURSOR_MODE.ADD_CAR;
					break;
				}
				case CURSOR_MODE.ADD_CAR: {
					this.cursorMode = CURSOR_MODE.ADD_OBSTACLE;
					break;
				}
				case CURSOR_MODE.ADD_OBSTACLE: {
					this.cursorMode = CURSOR_MODE.SELECT;
					break;
				}
			}
		}

		// init all cursors
		this.selectCursor.visible = false;
		this.deleteCursor.visible = false;
		this.addCarCursor.visible = false;
		this.addObstacleCursor.visible = false;

		// process cursor mode
		switch(this.cursorMode) {
			case CURSOR_MODE.SELECT: {
				this.currentCursor = this.selectCursor;
				this.selectCursor.visible = true;
				break;
			}
			case CURSOR_MODE.DELETE: {
				this.currentCursor = this.deleteCursor;
				this.deleteCursor.visible = true;
				break;
			}
			case CURSOR_MODE.ADD_CAR: {
				this.currentCursor = this.addCarCursor;
				this.addCarCursor.visible = true;
				break;
			}
			case CURSOR_MODE.ADD_OBSTACLE: {
				this.currentCursor = this.addObstacleCursor;
				this.addObstacleCursor.visible = true;
				break;
			}
		}
		this.mouseMove({clientX: this.keyMap.mouseX, clientY: this.keyMap.mouseY});
	}

	// function to add a car into the world
	this.addCar = function(position) {
		this.carCount += 1;
		var car = new Car({
			ID: "CAR" + this.carCount,
			src: CAR_INFO.CAR_TEXTURE,
			size: CAR_INFO.SIZE,
			eyeParam: EYE_PARAM,
			mode: MODE.MANUAL,
		}, this);
		car.mesh.rotation.y = Math.PI;

		// add car
		if(position) {
			car.mesh.position.set(position.x, car.mesh.position.y, position.z);
		}
		this.world.putIntoWorld(car.mesh, car.mesh.position);
		this.world.add(car.eyeGroup);
		this.cars.push(car);
		this.selectCar(this.cars.length-1);
	}

	this.removeCar = function(object) {
		if(this.cars.length < 1) {
			return false;
		}

 		// remove selected car
		if(!object || this.cars[this.selected].mesh == object) {
			this.world.removeCar(this.cars[this.selected]);
			this.cars.splice(this.selected, 1);

			// if num cars not equal zero, select it. else, select none
			if(this.cars.length > 0) {
				this.selectCar(this.cars.length-1);
			} else {
				this.ui.initHTML();		
				this.selected = -1;
			}
		} else { // remove other car
			var currentSelectedCar = this.cars[this.selected];
			for(var i = 0; i < this.cars.length; i++) {
				if(this.cars[i].mesh == object) {
					this.world.removeCar(this.cars[i]);
					this.cars.splice(i, 1);
					break;
				}
			}
			for(var i = 0; i < this.cars.length; i++) {
				if(this.cars[i] == currentSelectedCar) {
					this.selectCar(i);
				}
			}
		}
		return true;
	}

	// function to focus on a car selected
	this.selectCar = function(index) {
		// if no index, just swich car
		if(index == null && this.cars.length > 0) {
			if(this.selected) {
				this.selected = (this.selected+1) % this.cars.length;
			} else {
				this.selected = this.cars.length - 1;
			}
		} else if(index < this.cars.length) {
			this.selected = index;
		} else {
			// fail to update
			return false;
		}

		this.ui.initHTML(this.cars[this.selected]);
		this.ui.drawHTML(this.cars[this.selected]);
		for(var i = 0; i < this.cars.length; i++) {
			if(i == this.selected) {
				this.cars[i].eyeGroup.visible = true;
			} else {
				this.cars[i].eyeGroup.visible = false;
			}
		}
		return true;
	}

	// called each frame
	this.update = function(delta) {
		for(var i = 0; i < this.cars.length; i++) {
			switch(this.cars[i].mode) {
				// do manual run
				case MODE.MANUAL: {
					if(i == this.selected) {
						this.manualUpdate(delta);
					}
					break;
				}
				// do auto run
				case MODE.LEARNING:
				case MODE.FREEDOM: {
					var command = this.cars[i].think();
					this.cars[i].act(command, delta);
					if(i == this.selected) {
						this.ui.drawHTML(this.cars[i]);
					}
					break;
				}
			}
		}

		// update world
		this.world.update(delta);

		// update cursor
		if(this.currentCursor) {
			this.currentCursor.update(delta);
		}
	}

	// manual update
	this.manualUpdate = function(delta) {
		var acted = false;
		if(this.keyMap.up) {
			this.cars[this.selected].act(COMMAND.FORWARD, delta);		
			acted = true;
		} else if(this.keyMap.down) {
			this.cars[this.selected].act(COMMAND.BACK, delta);
			acted = true;
		}
		if(this.keyMap.left) {
			this.cars[this.selected].act(COMMAND.TURN_LEFT, delta);
			acted = true;
		} else if(this.keyMap.right) {
			this.cars[this.selected].act(COMMAND.TURN_RIGHT, delta);
			acted = true;
		}
		if(acted) {
			this.ui.drawHTML(this.cars[this.selected]);
		}
	}		

	/***************************/
	//  event controller
	/***************************/
	// keyup function
	document.onkeyup = function(e) { 
		switch(e.keyIdentifier) {
			case "Down":
				container.keyMap.down = false;
				break;
			case "Up":
				container.keyMap.up = false;
				break;
			case "Left":
				container.keyMap.left = false;
				break;
			case "Right":
				container.keyMap.right = false;
				break;
			case "Shift":
				container.keyMap.shift = false;
				break;
			case "Control":
				container.keyMap.ctrl = false;
				break;
		}
	}

	// keyup function
	document.onkeydown = function(e) { 
		switch(e.which) {
			case 49: //1
				container.switchCursorMode(CURSOR_MODE.SELECT)
				break;
			case 50: //2
				container.switchCursorMode(CURSOR_MODE.DELETE)
				break;
			case 51: //3
				container.switchCursorMode(CURSOR_MODE.ADD_CAR)
				break;
			case 52: //4
				container.switchCursorMode(CURSOR_MODE.ADD_OBSTACLE)
				break;
		}

		switch(e.keyIdentifier) {
			case "Down":
				container.keyMap.down = true;
				break;
			case "Up":
				container.keyMap.up = true;
				break;
			case "Left":
				container.keyMap.left = true;
				break;
			case "Right":
				container.keyMap.right = true;
				break;
			case "Shift":
				container.switchCursorMode();
				container.keyMap.shift = true;
				break;
			case "Control":
				container.keyMap.ctrl = true;
				break;
		}
	}	

	// onmouse move
	this.mouseMove = function(e) {
		// memorize mouse position
		container.keyMap.mouseX = e.clientX;
		container.keyMap.mouseY = e.clientY;

		var collisionResults = container.getSelectedObject(e);
		if(!collisionResults) {
			return false;
		}
		var collisionResult = collisionResults[0];
		var object = collisionResult.object;

		// update cursor
		container.currentCursor.visible = false;
		for(var i = 0; i < collisionResults.length; i++) {
			if(collisionResults[i].object.objectType == OBJECT_TYPE.FLOOR) {
				container.currentCursor.visible = true;
				container.currentCursor.position.set(
					collisionResults[i].point.x,
					collisionResults[i].point.y + 3,
					collisionResults[i].point.z
				);
				break;
			}
		}

		// process each mode
		document.body.style.cursor = "default";
		switch(container.cursorMode) {
			// select mode
			case CURSOR_MODE.SELECT: {
				switch(object.objectType) {
					case OBJECT_TYPE.CAR: {
						document.body.style.cursor = "pointer";
						break;
					}
				}				
				break;
			}
			// delete mode
			case CURSOR_MODE.DELETE: {
				switch(object.objectType) {
					case OBJECT_TYPE.CAR: 
					case OBJECT_TYPE.OBSTACLE: {
						document.body.style.cursor = "not-allowed";
						break;
					}
				}
				break;
			}
			// add car mode
			case CURSOR_MODE.ADD_CAR: {
				break;
			}
			// add obstacle mode
			case CURSOR_MODE.ADD_OBSTACLE: {
				break;
			}
		}
	}
	document.onmousemove = this.mouseMove;


	// function to process mouseclick event
	document.onmousedown = function(e) {
		var collisionResults = container.getSelectedObject(e);
		if(!collisionResults) {
			return false;
		}
		var collisionResult = collisionResults[0];
		var object = collisionResult.object;

		// process delete or add action by mouse cursor mode
		switch(container.cursorMode) {
			// select mode
			case CURSOR_MODE.SELECT: {
				switch(object.objectType) {
					case OBJECT_TYPE.CAR: {
						for(var i = 0; i < container.cars.length; i++) {
							if(container.cars[i].mesh == object) {
								container.selectCar(i);
								break;
							}
						}
						break;
					}
				}				
				break;
			}
			// delete mode
			case CURSOR_MODE.DELETE: {
				switch(object.objectType) {
					case OBJECT_TYPE.CAR: {
						container.removeCar(object);
						break;
					}
					case OBJECT_TYPE.OBSTACLE: {
						container.world.removeObstacle(object);
						break;
					}
				}
				break;
			}
			// add car
			case CURSOR_MODE.ADD_CAR: {
				var clickedPosition = null;
				for(var i = 0; i < collisionResults.length; i++) {
					if(collisionResults[i].object.objectType == OBJECT_TYPE.FLOOR) {
						clickedPosition = collisionResults[i].point.clone();
						container.addCar(clickedPosition);
						break;
					}
				}
				break;
			}
			// add obstacle
			case CURSOR_MODE.ADD_OBSTACLE: {
				var clickedPosition = null;
				for(var i = 0; i < collisionResults.length; i++) {
					if(collisionResults[i].object.objectType == OBJECT_TYPE.FLOOR) {
						clickedPosition = collisionResults[i].point.clone();
						container.world.addObstacle(clickedPosition);
						break;
					}
				}
				break;
			}
		}
	}

	// function to get an object from mouse event
	container.getSelectedObject = function(e) {
		container.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		container.mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
		container.raycaster.setFromCamera(container.mouse, container.camera);

		var collisionResults= container.raycaster.intersectObjects(container.world.children, false);
		if(collisionResults.length > 0) {
			return collisionResults;
		} else {
			return null;
		}
	}


	return this;
}

