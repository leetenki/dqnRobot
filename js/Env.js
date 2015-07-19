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
	this.loadCarCursor = null;
	this.addItemCursor = null;
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
		A: false,
		S: false,
		W: false,
		D: false,
	}

	// this param is used to share special parameter, when special mode invoked.
 	// car take value {mode: "loadCar", jsonText: jsonText};
	this.exclusiveParam = null;

	// alias this to avoid namespace collision with event function
	var container = this;


	// function to initialize environment
	this.initEnv = function(scene, camera, subCamera) {
		// declaration
		this.world = new World();
		this.cars = new Array();
		this.ui = new UI(this);
		this.camera = camera;
		this.subCamera = subCamera;

		// init scene
		this.scene = scene;
		while(this.scene.children.length) {
			this.scene.children.pop();
		}

		// init world
		//this.world.initWorld(WORLD_INFO);
		this.world.initWorldFromJSON(WORLD_INFO, prebuiltWorldJSON[0]);
		this.scene.add(this.world);

		// init cars
		this.addCar(new THREE.Vector3(300, 0, 0));


		// init ui
		this.ui.initHTML(this.cars[0]);
		this.ui.drawHTML(this.cars[0]);


		/**********************
		// init cursor helpers
		**********************/
		// select cursor
		var texture = THREE.ImageUtils.loadTexture(CURSOR_MODE.SELECT.TEXTURE);
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.9, 
			map: texture,
			blending: THREE.AdditiveBlending,
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		this.selectCursor = new THREE.Mesh(planeGeometry, material);
		this.selectCursor.rotateX(-Math.PI/2);
		this.selectCursor.position.y = 3;
		this.selectCursor.visible = false;
		this.selectCursor.theta = 0;
		this.selectCursor.update = function(delta) {
			this.theta += delta * 4;
			this.rotateZ(delta);
			this.scale.set(1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1);
		}
		this.scene.add(this.selectCursor);



		// delete cursor
		var texture = THREE.ImageUtils.loadTexture(CURSOR_MODE.DELETE.TEXTURE);
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
		this.deleteCursor.position.y = 3;
		this.deleteCursor.visible = false;
		this.deleteCursor.theta = 0;
		this.deleteCursor.update = function(delta) {
			this.theta += delta * 4;
			this.scale.set(1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1,1+Math.sin(this.theta)*0.1);
		}
		this.scene.add(this.deleteCursor);



		// AddCar cursor
		this.addCarCursor = new THREE.Mesh();
		this.addCarCursor.visible = false;
		this.addCarCursor.position.y = 3;
		this.scene.add(this.addCarCursor);
		// cursor image
		var texture = THREE.ImageUtils.loadTexture(CURSOR_MODE.ADD_CAR.TEXTURE);
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.9, 
			map: texture,
			blending: THREE.AdditiveBlending,
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		var cursorImage = new THREE.Mesh(planeGeometry, material);
		cursorImage.rotateX(-Math.PI/2);
		this.addCarCursor.cursorImage = cursorImage;
		this.addCarCursor.add(cursorImage);
		// cursor helper
		var cursorHelper = new CarMesh({
			src: CAR_INFO.CAR_TEXTURE,
			size: CAR_INFO.SIZE,
		}, this);
		cursorHelper.rotation.y = Math.PI;
		cursorHelper.material.opacity = 0.6;
		cursorHelper.material.transparent = true;
		this.addCarCursor.cursorHelper = cursorHelper;
		this.addCarCursor.add(cursorHelper);
		this.addCarCursor.theta = 0;
		this.addCarCursor.cursorHelper.theta = 0;
		this.addCarCursor.update = function(delta) {
			this.cursorImage.rotateZ(delta);
			if(container.keyMap.A) {
				this.cursorHelper.theta += delta * 3;
				this.cursorHelper.rotation.y += delta;
			} else if(container.keyMap.D) {
				this.cursorHelper.theta -= delta * 3;
				this.cursorHelper.rotation.y -= delta;
			}			
		}


		// loadCar cursor
		this.loadCarCursor = new THREE.Mesh();
		this.loadCarCursor.visible = false;
		this.loadCarCursor.position.y = 3;
		this.scene.add(this.loadCarCursor);
		// cursor image
		var texture = THREE.ImageUtils.loadTexture(CURSOR_MODE.LOAD_CAR.TEXTURE);
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.9, 
			map: texture,
			blending: THREE.AdditiveBlending,
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		var cursorImage = new THREE.Mesh(planeGeometry, material);
		cursorImage.rotateX(-Math.PI/2);
		this.loadCarCursor.cursorImage = cursorImage;
		this.loadCarCursor.add(cursorImage);
		// cursor helper
		var cursorHelper = new CarMesh({
			src: CAR_INFO.CAR_TEXTURE,
			size: CAR_INFO.SIZE,
		}, this);
		cursorHelper.rotation.y = Math.PI;
		cursorHelper.material.opacity = 0.6;
		cursorHelper.material.transparent = true;
		this.loadCarCursor.cursorHelper = cursorHelper;
		this.loadCarCursor.add(cursorHelper);
		this.loadCarCursor.theta = 0;
		this.loadCarCursor.cursorHelper.theta = 0;
		this.loadCarCursor.update = function(delta) {
			this.cursorImage.rotateZ(delta);
			if(container.keyMap.A) {
				this.cursorHelper.theta += delta * 3;
				this.cursorHelper.rotation.y += delta;
			} else if(container.keyMap.D) {
				this.cursorHelper.theta -= delta * 3;
				this.cursorHelper.rotation.y -= delta;
			}			
		}


		// AddObstacle cursor 
		// has children 'cursorImage' and 'cursorHelper'
		this.addObstacleCursor = new THREE.Mesh();
		this.addObstacleCursor.visible = false;
		this.addObstacleCursor.position.y = 3;
		this.scene.add(this.addObstacleCursor);
		// cursor image
		var texture = THREE.ImageUtils.loadTexture(CURSOR_MODE.ADD_OBSTACLE.TEXTURE);
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.8, 
			map: texture,
			blending: THREE.AdditiveBlending
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		var cursorImage = new THREE.Mesh(planeGeometry, material);
		cursorImage.rotateX(-Math.PI/2);
		this.addObstacleCursor.cursorImage = cursorImage;
		this.addObstacleCursor.add(cursorImage);
		// cursor helper
		var cursorHelper = this.world.createObstacle();
		cursorHelper.material.opacity = 0.6;
		cursorHelper.material.transparent = true;
		cursorHelper.material.color.set(0xffffff);
		this.addObstacleCursor.cursorHelper = cursorHelper;
		this.addObstacleCursor.add(cursorHelper);
		this.addObstacleCursor.theta = 0;
		this.addObstacleCursor.update = function(delta) {
			if(container.keyMap.A) {
				this.theta += delta * 3;
				this.rotation.y += delta;
			} else if(container.keyMap.D) {
				this.theta -= delta * 3;
				this.rotation.y -= delta;
			}
			//this.cursorHelper.material.opacity = 0.6 +  Math.sin(this.theta) * 0.05;
		}		
	

		// AddItem cursor 
		// has children 'cursorImage' and 'cursorHelper'
		this.addItemCursor = new THREE.Mesh();
		this.addItemCursor.visible = false;
		this.addItemCursor.position.y = 3;
		this.scene.add(this.addItemCursor);
		// cursor image
		var texture = THREE.ImageUtils.loadTexture(CURSOR_MODE.ADD_ITEM.TEXTURE);
		texture.magFilter = THREE.NearestFilter;
	    texture.minFilter = THREE.NearestFilter;
		var material = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.8, 
			map: texture,
			blending: THREE.AdditiveBlending
		});
		var planeGeometry = new THREE.PlaneGeometry(300, 300, 32, 32);			
		var cursorImage = new THREE.Mesh(planeGeometry, material);
		cursorImage.rotateX(-Math.PI/2);
		this.addItemCursor.cursorImage = cursorImage;
		this.addItemCursor.add(cursorImage);
		// cursor helper
		var cursorHelper = this.world.createItem();
		cursorHelper.material.opacity = 0.6;
		cursorHelper.material.transparent = true;
		cursorHelper.material.color.set(0xffffff);
		this.addItemCursor.cursorHelper = cursorHelper;
		this.addItemCursor.add(cursorHelper);
		this.addItemCursor.theta = 0;
		this.addItemCursor.update = function(delta) {
			if(container.keyMap.A) {
				this.theta += delta * 3;
				this.rotateY(delta);
			} else if(container.keyMap.D) {
				this.theta -= delta * 3;
				this.rotateY(-delta);
			}
			//this.cursorHelper.material.opacity = 0.6 +  Math.sin(this.theta) * 0.05;
		}		

		// set current mode to select mode
		this.switchCursorMode(CURSOR_MODE.SELECT);
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

	// function to switch camera mode
	this.switchCameraMode = function(cameraMode) {
		if(cameraMode) {
			this.subCamera.cameraMode = cameraMode;
		} else {
			switch(this.subCamera.cameraMode) {
				case CAMERA_MODE.ROBOT_VIEW: {
					this.subCamera.cameraMode = CAMERA_MODE.ROBOT_HEAD_VIEW;
					break;
				}
				case CAMERA_MODE.ROBOT_HEAD_VIEW: {
					this.subCamera.cameraMode = CAMERA_MODE.SKY_VIEW;
					break;
				}
				case CAMERA_MODE.SKY_VIEW: {
					this.subCamera.cameraMode = CAMERA_MODE.ROBOT_VIEW;
					break;
				}
			}		
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
					this.cursorMode = CURSOR_MODE.ADD_ITEM;
					break;
				}
				case CURSOR_MODE.ADD_ITEM: {
					this.cursorMode = CURSOR_MODE.SELECT;
					break;
				}
			}
		}

		// init all cursors
		this.selectCursor.visible = false;
		this.deleteCursor.visible = false;
		this.addCarCursor.visible = false;
		this.loadCarCursor.visible = false;
		this.addItemCursor.visible = false;
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
			case CURSOR_MODE.LOAD_CAR: {
				this.currentCursor = this.loadCarCursor;
				this.loadCarCursor.visible = true;
				break;
			}
			case CURSOR_MODE.ADD_OBSTACLE: {
				this.currentCursor = this.addObstacleCursor;
				this.addObstacleCursor.visible = true;
				break;
			}
			case CURSOR_MODE.ADD_ITEM: {
				this.currentCursor = this.addItemCursor;
				this.addItemCursor.visible = true;
			}
		}

		// update all information
		this.mouseMove({clientX: this.keyMap.mouseX, clientY: this.keyMap.mouseY});
		if(this.selected != -1) {
			this.ui.drawHTML(this.cars[this.selected]);
		} else {
			this.ui.drawHTML();
		}
	}

	// function to add a new car from json text
	this.addCarFromJSON = function(position, rotation, jsonText) {
		var carData = JSON.parse(jsonText);
		this.carCount += 1;
		carData.param.ID = "CAR" + this.carCount;
		carData.param.mode = MODE.FREEDOM;
		var car = new Car(carData.param, this);

		// add brain
		car.brain.learning = false;
		car.brain.epsilon_test_time = 0.05;
		car.brain.value_net.fromJSON(carData.brain);

		// set position and rotation
		if(rotation) {
			car.mesh.rotation.y = rotation.y;
		} else {
			car.mesh.rotation.y = -Math.PI;
		}
		if(position) {
			car.mesh.position.set(position.x, car.mesh.position.y, position.z);
		}

		// add car
		this.world.putIntoWorld(car.mesh, car.mesh.position);
		this.world.add(car.eyeGroup);
		this.cars.push(car);
		this.selectCar(this.cars.length-1);
	}

	// function to add a car into the world
	this.addCar = function(position, rotation) {
		this.carCount += 1;
		var car = new Car({
			SPEED: CAR_INFO.SPEED,
			ROTATE_AMOUNT: CAR_INFO.ROTATE_AMOUNT,
			ID: "CAR" + this.carCount,
			src: CAR_INFO.CAR_TEXTURE,
			size: CAR_INFO.SIZE,
			eyeParam: EYE_PARAM,
			mode: MODE.LEARNING,
		}, this);
		if(rotation) {
			car.mesh.rotation.y = rotation.y;
		} else {
			car.mesh.rotation.y = -Math.PI;
		}

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
		if(this.selected == index) {
			return;
		}
		
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

	// load world and brain from json text
	container.loadFromJSON = function(jsonText) {
	    var data = JSON.parse(jsonText);
	    if(data.brain) { // is brain.json
	    	container.exclusiveParam = {
	    		mode: "loadCar",
	    		jsonText: jsonText,
	    	}
			container.switchCursorMode(CURSOR_MODE.LOAD_CAR);
	    } else if(data.obstacles) { // is world.json
			container.world.initWorldFromJSON(WORLD_INFO, jsonText);
			var car = null;
			for(var i = 0; i < container.cars.length; i++) {
				car = container.cars[i];
				container.world.putIntoWorld(car.mesh, car.mesh.position);
				container.world.add(car.eyeGroup);
			}
			if(container.cars.length && container.selected != -1) {
				car = container.cars[container.selected];
			}

			// init ui
			container.ui.initHTML(car);
			container.ui.drawHTML(car);
	    }		
	}	

	/***************************/
	//  event controller
	/***************************/
	// cancel dragover
 	document.body.ondragover = function(event){ 
	    event.preventDefault(); 
	} 
	
	// add drop event
	document.body.ondrop = function(event){ 
	    var files = event.dataTransfer.files;
	    var files_info = "";
	    for (var i=0; i<files.length; i++) {
			var reader = new FileReader();
			reader.readAsText(files[0]);
			reader.onload = function(ev){
			    jsonText = reader.result;
			    container.loadFromJSON(jsonText);
			}
	    }
	    event.preventDefault();
	}

	// keyup function
	document.onkeyup = function(e) { 
		switch(e.keyCode) {
			case 65: // A
				container.keyMap.A = false;
				break;
			case 83: // S
				container.keyMap.S = false;
				break;
			case 68: // D
				container.keyMap.D = false;
				break;
			case 87: // W
				container.keyMap.W = false;
				break;						
		}
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
		//console.log(e.keyCode);
		switch(e.keyCode) {
			case 65: // A
				container.keyMap.A = true;
				break;
			case 83: // S
				container.keyMap.S = true;
				break;
			case 68: // D
				container.keyMap.D = true;
				break;
			case 87: // W
				container.keyMap.W = true;
				break;
			case 74: // J
				//container.saveWorldJSON();
				break;
			case 66: // B
				//container.saveBrainJSON();
				break;
			case 77: // M
				//container.saveBrainJSON();
				break;
			case 88: // X
				container.saveWorldJSON();
				break;
			case 67: // C
				container.saveBrainJSON();
				break;
			case 49: //1
				container.switchCursorMode(CURSOR_MODE.SELECT);
				break;
			case 50: //2
				container.switchCursorMode(CURSOR_MODE.DELETE);
				break;
			case 51: //3
				container.switchCursorMode(CURSOR_MODE.ADD_CAR);
				break;
			case 52: //4
				container.switchCursorMode(CURSOR_MODE.ADD_OBSTACLE);
				break;
			case 53: //5
				container.switchCursorMode(CURSOR_MODE.ADD_ITEM);
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
				//container.switchCursorMode();
				container.switchCameraMode();
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
					container.currentCursor.position.y,
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
					case OBJECT_TYPE.ITEM:
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
			// add item mode
			case CURSOR_MODE.ADD_ITEM: {
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
					case OBJECT_TYPE.ITEM: {
						container.world.removeItem(object);
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
						container.addCar(clickedPosition, container.addCarCursor.cursorHelper.rotation);
						container.switchCursorMode(CURSOR_MODE.SELECT);
						break;
					}
				}
				break;
			}
			// load car
			case CURSOR_MODE.LOAD_CAR: {
				var clickedPosition = null;
				for(var i = 0; i < collisionResults.length; i++) {
					if(collisionResults[i].object.objectType == OBJECT_TYPE.FLOOR) {
						clickedPosition = collisionResults[i].point.clone();
						if(container.exclusiveParam && container.exclusiveParam.mode == "loadCar") {
							container.addCarFromJSON(clickedPosition, container.loadCarCursor.cursorHelper.rotation, container.exclusiveParam.jsonText);
							container.exclusiveParam = null;
						}
						container.switchCursorMode(CURSOR_MODE.SELECT);
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
						container.world.addObstacle(clickedPosition, container.addObstacleCursor.rotation);
						break;
					}
				}
				break;
			}
			// add item
			case CURSOR_MODE.ADD_ITEM: {
				var clickedPosition = null;
				for(var i = 0; i < collisionResults.length; i++) {
					if(collisionResults[i].object.objectType == OBJECT_TYPE.FLOOR) {
						clickedPosition = collisionResults[i].point.clone();
						container.world.addItem(clickedPosition, container.addItemCursor.rotation);
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

	// function to save brain json
	container.saveBrainJSON = function() {
		if(this.cars.length && this.selected != -1) {
			var car = this.cars[this.selected];
			var carJSON = {
				brain: this.cars[this.selected].brain.value_net.toJSON(),
				param: car.param,
			}

			var blob = new Blob([JSON.stringify(carJSON)], {"type" : "text/plain"});
			window.URL = window.URL || window.webkitURL;
			window.open(window.URL.createObjectURL(blob), "target");
		}
	}

	// function to save json 
	container.saveWorldJSON = function() {
		var blob = new Blob([container.world.getJSON()], {"type" : "text/plain"});
		window.URL = window.URL || window.webkitURL;
		window.open(window.URL.createObjectURL(blob), "target");
	}

	return this;
}

