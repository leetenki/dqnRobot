/***********************************/
// UI to draw information to window
/***********************************/
var UI = function(env) {
	this.infoTag = document.getElementById("info");
	this.statusTag = document.getElementById("status");
	this.neuralNetworkContainer = document.getElementById("neuralNetworkContainer");
	this.barChartContainer = document.getElementById("barChartContainer");
	this.IDTag = null;
	this.modeTag = null;
	this.actionTag = null;
	this.resultTag = null;
	this.victimTag = null;
	this.cursorTag = null;
	this.cursorImage = null;
	this.deleteCursorImage = null;
	this.selectCursorImage = null;
	this.addCarCursorImage = null;
	this.loadCarCursorImage = null;
	this.addObstacleCursorImage = null;
	this.addItemCursorImage = null;
	this.barChart = null;
	this.barChartCanvas = null;
	this.donutsChart = null;
	this.neuralNetwork = null;
	this.nodesOfLayers = null;
	this.donutsChartCanvas = null;
	this.averageDistanceTag = null;
	this.switchImage = null;
	this.env = env;

	// alias this object to avoid conflict happens in inner function
	var container = this;

	// redraw to html
	this.drawHTML = function(car) {
		// CURSOR
		this.cursorTag.innerHTML = "";
		this.cursorTag.appendChild(document.createTextNode(this.env.cursorMode.text));

		// CURSOR image
		this.cursorImage.innerHTML = "";
		switch(this.env.cursorMode) {
			case CURSOR_MODE.DELETE: {
				this.cursorImage.appendChild(this.deleteCursorImage);
				break;
			}
			case CURSOR_MODE.ADD_CAR: {
				this.cursorImage.appendChild(this.addCarCursorImage);
				break;
			}
			case CURSOR_MODE.LOAD_CAR: {
				this.cursorImage.appendChild(this.loadCarCursorImage);
				break
			}
			case CURSOR_MODE.ADD_OBSTACLE: {
				this.cursorImage.appendChild(this.addObstacleCursorImage);
				break;
			}
			case CURSOR_MODE.ADD_ITEM: {
				this.cursorImage.appendChild(this.addItemCursorImage);
				break;
			}
			default:
			case CURSOR_MODE.SELECT: {
				this.cursorImage.appendChild(this.selectCursorImage);
				break;
			}
		}

		
		// update information depends on car
		if(car) {
			// ID
			this.IDTag.innerHTML = "";
			this.IDTag.appendChild(document.createTextNode(car.ID));

			// mode
			this.modeTag.innerHTML = "";
			this.modeTag.appendChild(document.createTextNode(car.mode.text));
			this.modeTag.setAttribute("class", car.mode.class);

			// action
			this.actionTag.innerHTML = "";
			this.actionTag.appendChild(document.createTextNode(car.command.text));

			// result
			this.resultTag.innerHTML = "";
			if(!car.moveSucceeded) {
				this.resultTag.setAttribute("class", "danger");
				this.resultTag.appendChild(document.createTextNode("COLLISION!!"));
			} else {
				this.resultTag.setAttribute("class", "safe");
				this.resultTag.appendChild(document.createTextNode("SAFE"));		
			}

			// victim
			this.victimTag.innerHTML = "";
			if(car.victim) {
				this.victimTag.appendChild(document.createTextNode(car.victim.objectType.text));
			}

			// rewards
			this.rewardsTag.innerHTML = "";
			this.rewardsTag.appendChild(document.createTextNode(car.rewards.toFixed(2)));

			// update rewards graph
			percentage = Math.min(Math.max(car.rewards, 0), 1);
			blank = 1 - percentage;
			this.donutsChart.segments[0].value = percentage;
			this.donutsChart.segments[1].value = blank;
			this.donutsChart.update();

			// update barchart label
			this.averageDistanceTag.innerHTML = "";
			var averageDistance = 0;
			for(var i = 0; i < car.eyes.length; i++) {
				averageDistance += car.eyes[i].distance;
			}
			averageDistance /= car.eyes.length;
			this.averageDistanceTag.appendChild(document.createTextNode(averageDistance.toFixed(2)));

			// update barchart graph
			for(var i = 0; i < car.eyes.length; i++) {
				this.barChart.datasets[0].bars[i].value = car.eyes[i].distance;
			}
			this.barChart.update();

			// switch image
			this.switchImage.css({
				"-webkit-filter": car.mode.switchStyle
			});

			// draw neural network
			if(car.brain.value_net.layers[0].out_act) {
				var layers = car.brain.value_net.layers;
				var nodes = this.neuralNetwork.graph.nodes();
				var edges = this.neuralNetwork.graph.edges();

				var nodesCnt = 0;
				for(var i = 0; i < layers.length; i++) {
					var maximumWeight = {
						weight: layers[i].out_act.w[0],
						i: i,
						j: 0
					};
					// update nodes
					for(j = 0; j < layers[i].out_act.w.length; j++) {
						if(layers[i].out_act.w[j] >= 0) {
							nodes[nodesCnt+j].color = "rgba(255, " + (255-Math.floor(layers[i].out_act.w[j]*255)) + ", " + (255-Math.floor(layers[i].out_act.w[j]*255)) + ", 0.4)";
							if(maximumWeight.weight < layers[i].out_act.w[j]) {
								maximumWeight = {
									weight: layers[i].out_act.w[j],
									i: i, 
									j: j,
								};
							}
						} else {
							nodes[nodesCnt+j].color = "rgba(" + (255-Math.floor(layers[i].out_act.w[j]*-128)) + ", 255, 255, 0.4)";
						}
						if(this.nodesOfLayers[i][j].edgeIndex) {
							for(var k = 0; k < this.nodesOfLayers[i][j].edgeIndex.length; k++) {
								edges[this.nodesOfLayers[i][j].edgeIndex[k]].color = "rgba(255, 255, 255, " + (this.nodesOfLayers[i][j].basicColor) + ")"
							}
						}
					}
					nodesCnt += layers[i].out_act.w.length;

					// update edges
					if(this.nodesOfLayers[maximumWeight.i][maximumWeight.j].edgeIndex) {
						for(var k = 0; k < this.nodesOfLayers[maximumWeight.i][maximumWeight.j].edgeIndex.length; k++) {
							edges[this.nodesOfLayers[maximumWeight.i][maximumWeight.j].edgeIndex[k]].color = "rgba(255, 255, 255, " + (this.nodesOfLayers[maximumWeight.i][maximumWeight.j].basicColor*6) + ")"
						}
					}					
				}
				this.neuralNetwork.refresh();
			}
		}
	}

	// initialize all tag
	this.initHTML = function(car) {
		/*****************************
		//   init info tag
		/****************************/
		this.infoTag.innerHTML = "";


		// mouse cursor
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("CURSOR"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		this.cursorTag = document.createElement("span");
		pTag.appendChild(this.cursorTag);
		this.cursorImage = document.createElement("span");
		pTag.appendChild(this.cursorImage);
		this.infoTag.appendChild(pTag);


		// hr line
		var hrTag = document.createElement("hr");
		this.infoTag.appendChild(hrTag);


		// USAGE
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("USAGE："));
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);


		// Shift
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.setAttribute("class", "name");
		spanTag.appendChild(document.createTextNode("SHIFT"));
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("SWICH CAMERA"));
		spanTag.setAttribute("class", "usage");
		spanTag.onclick = function() {
			container.env.switchCameraMode();
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// 1
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [1]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("SELECT CAR"));
		spanTag.onclick = function() {
			container.env.switchCursorMode(CURSOR_MODE.SELECT);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// 2
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [2]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("DELETE OBJECT"));
		spanTag.onclick = function() {
			container.env.switchCursorMode(CURSOR_MODE.DELETE);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// 3
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [3]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("APPEND CAR"));
		spanTag.onclick = function() {
			container.env.switchCursorMode(CURSOR_MODE.ADD_CAR);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// 4
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [4]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("APPEND CUBE"));
		spanTag.onclick = function() {
			container.env.switchCursorMode(CURSOR_MODE.ADD_OBSTACLE);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// 5
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [5]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("APPEND ITEM"));
		spanTag.onclick = function() {
			container.env.switchCursorMode(CURSOR_MODE.ADD_ITEM);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// hr line
		var hrTag = document.createElement("hr");
		this.infoTag.appendChild(hrTag);

		// file
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("FILE："));
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// save world
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [X]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("SAVE STAGE"));
		spanTag.onclick = function() {
			container.env.saveWorldJSON();
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// save brain
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [C]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("SAVE CAR"));
		spanTag.onclick = function() {
			container.env.saveBrainJSON();
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// drag and drop usage
		var pTag = document.createElement("p");
		pTag.appendChild(document.createTextNode("DRAG & DROP TO LOAD"));
		this.infoTag.appendChild(pTag);

		// hr line
		var hrTag = document.createElement("hr");
		this.infoTag.appendChild(hrTag);


		// prebuilt world
		var pTag = document.createElement("p");
		pTag.appendChild(document.createTextNode("PREBUILT STAGE:"));
		this.infoTag.appendChild(pTag);

		// stage1
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("STAGE1"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "prebuilt");
		spanTag.appendChild(document.createTextNode("SIMPLE COURSE"));
		spanTag.onclick = function() {
			container.env.loadFromJSON(prebuiltWorldJSON[0]);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// hr line
		var hrTag = document.createElement("hr");
		this.infoTag.appendChild(hrTag);


		// prebuilt brain
		var pTag = document.createElement("p");
		pTag.appendChild(document.createTextNode("TRAINED CAR:"));
		this.infoTag.appendChild(pTag);

		// car 1
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("CAR1"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "prebuilt");
		spanTag.appendChild(document.createTextNode("SUPER CAR"));
		spanTag.onmousedown = function(e) {
			e.stopPropagation();
		}
		spanTag.onclick = function(e) {
			container.env.loadFromJSON(prebuiltBrainJSON[0]);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// car 2
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("CAR2"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "prebuilt");
		spanTag.appendChild(document.createTextNode("3 EYES"));
		spanTag.onmousedown = function(e) {
			e.stopPropagation();
		}
		spanTag.onclick = function(e) {
			container.env.loadFromJSON(prebuiltBrainJSON[1]);
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);


		// hr line
		var hrTag = document.createElement("hr");
		this.infoTag.appendChild(hrTag);


		/***************************
		// init cursor images
		***************************/
		// delete cursor image
		this.deleteCursorImage = document.createElement("img");
		this.deleteCursorImage.setAttribute("src", CURSOR_MODE.DELETE.TEXTURE);
		this.deleteCursorImage.setAttribute("id", "deleteCursor");

		// select cursor image
		this.selectCursorImage = document.createElement("img");
		this.selectCursorImage.setAttribute("src", CURSOR_MODE.SELECT.TEXTURE);
		this.selectCursorImage.setAttribute("id", "selectCursor");

		// add car cursor image
		this.addCarCursorImage = document.createElement("img");
		this.addCarCursorImage.setAttribute("src", CURSOR_MODE.ADD_CAR.TEXTURE);
		this.addCarCursorImage.setAttribute("id", "addCarCursor");

		// load car cursor image
		this.loadCarCursorImage = document.createElement("img");
		this.loadCarCursorImage.setAttribute("src", CURSOR_MODE.LOAD_CAR.TEXTURE);
		this.loadCarCursorImage.setAttribute("id", "loadCarCursor");

		// add obstacle cursor image
		this.addObstacleCursorImage = document.createElement("img");
		this.addObstacleCursorImage.setAttribute("src", CURSOR_MODE.ADD_OBSTACLE.TEXTURE);
		this.addObstacleCursorImage.setAttribute("id", "addObstacleCursor");

		// add item cursor image
		this.addItemCursorImage = document.createElement("img");
		this.addItemCursorImage.setAttribute("src", CURSOR_MODE.ADD_ITEM.TEXTURE);
		this.addItemCursorImage.setAttribute("id", "addItemCursor");

		// draw cursor info to html
		switch(this.env.cursorMode) {
			case CURSOR_MODE.DELETE: {
				this.cursorImage.appendChild(this.deleteCursorImage);
				break;
			}
			case CURSOR_MODE.ADD_CAR: {
				this.cursorImage.appendChild(this.addCarCursorImage);
				break;
			}
			case CURSOR_MODE.ADD_OBSTACLE: {
				this.cursorImage.appendChild(this.addObstacleCursorImage);
				break;
			}
			case CURSOR_MODE.ADD_ITEM: {
				this.cursorImage.appendChild(this.addItemCursorImage);
				break;
			}
			default:
			case CURSOR_MODE.SELECT: {
				this.cursorImage.appendChild(this.selectCursorImage);
				break;
			}
		}

		/*****************************
		//   init status tag
		/****************************/
		this.statusTag.innerHTML = "";

		// ID
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("ID"));
		pTag.appendChild(spanTag);
		this.IDTag = document.createElement("span");
		pTag.appendChild(this.IDTag);
		this.statusTag.appendChild(pTag);

		// mode
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("MODE"));
		pTag.appendChild(spanTag);
		this.modeTag = document.createElement("span");
		pTag.appendChild(this.modeTag);
		this.statusTag.appendChild(pTag);

		// action
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("ACTION"));
		pTag.appendChild(spanTag);
		this.actionTag = document.createElement("span");
		pTag.appendChild(this.actionTag);
		this.statusTag.appendChild(pTag);

		// results
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("RESULT"));
		pTag.appendChild(spanTag);
		this.resultTag = document.createElement("span");
		pTag.appendChild(this.resultTag);
		this.statusTag.appendChild(pTag);

		// victim
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("VICTIM"));
		pTag.appendChild(spanTag);
		this.victimTag = document.createElement("span");
		this.victimTag.setAttribute("class", "danger");
		pTag.appendChild(this.victimTag);
		this.statusTag.appendChild(pTag);

		// rewards tag
		pTag = document.createElement("p");
		spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("REWARDS"));
		pTag.appendChild(spanTag);
		this.rewardsTag = document.createElement("span");
		this.rewardsTag.setAttribute("class", "score");
		pTag.appendChild(this.rewardsTag);
		this.statusTag.appendChild(pTag);	

		// donuts chart
		this.donutsChartCanvas = document.createElement("canvas");
		this.donutsChartCanvas.width = 80;
		this.donutsChartCanvas.height = 80;
		this.donutsChartCanvas.setAttribute("class", "donutsChart");
		this.statusTag.appendChild(this.donutsChartCanvas);		
		var ctx = this.donutsChartCanvas.getContext("2d");
		var gradient = ctx.createLinearGradient(0, 0, 0, 100);
		gradient.addColorStop(0, 'rgba(100,200,100,0.8)');   
		gradient.addColorStop(0.5, 'rgba(100,200,205,0.6)');
		gradient.addColorStop(1, 'rgba(0,51,153,0.4)');   
		// chart label of average distance
		var segments = [
		{
			value: 0,
			color:"#F7464A",
		},
		{
			value: 1,
			color:"rgba(255, 255, 255, 0)"
		},
		];
		var percentage = 0;
		var blank = 1;
		if(car) {
			percentage = Math.min(Math.max(car.rewards, 0), 1);
			blank = 1 - percentage;
			segments[0].value = percentage;
			segments[1].value = blank;
		}
		this.donutsChart = new Chart(ctx).Doughnut(segments, {
			animateRotate: false,
			percentageInnerCutout : 50,
			animateScale : false,
		});


		/***********************************
		// init neural network information
		***********************************/
		this.neuralNetworkContainer.innerHTML = "";
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "neuralNetworkText");
		spanTag.appendChild(document.createTextNode("NEURAL NETWORK"));
		this.neuralNetworkContainer.appendChild(spanTag);
		this.neuralNetwork = null;
		if(car) {
			var layers = car.brain.value_net.layers;
			var maximumLayerLength = 0;
			for(var i = 0; i < layers.length; i++) {
				if(layers[i].out_depth > maximumLayerLength) {
					maximumLayerLength = layers[i].out_depth;
				}
			}
			var height = maximumLayerLength;

			// determine nodes
			var nodes = new Array();;
			var nodesOfLayers = new Array();
			this.nodesOfLayers = nodesOfLayers;
			var numLayers = layers.length;
			var stepX = maximumLayerLength * 1.3 / (layers.length);
			for(var i = 0; i < layers.length; i++) {
				var nodesOfLayer = new Array();
				var x = stepX * i;
				var layer = layers[i];
				var stepY = height / (layer.out_depth + 2);
				for(j = 0; j < layer.out_depth; j++) {
					var node = {
						id: "node" + i + "-" + j,
						x: x + (Math.random()) * 3 / 5 * stepX,
						y: stepY * (j+1),
						size: 1,
			        	color: "rgba(255, 255, 255, 0.4)"
						//borderColor: "#fff",
					};
					//node.basicNeuronColor = "rgba(" + Math.floor(i*255/layers.length) + "," + Math.floor(j*255/layer.out_depth) + ",128,0.4)";
					//node.color = node.basicNeuronColor;
					nodes.push(node);
					nodesOfLayer.push(node);
				}
				nodesOfLayers.push(nodesOfLayer);
			}

			// put dummy node
			nodes.push({
				id: "dammy1",
				x: maximumLayerLength * 1.3 - 2,
				y: maximumLayerLength + 2,
				size: 1,
	        	color: "rgba(255, 255, 255, 0.0)"
			});
			nodes.push({
				id: "dummy2",
				x: -2,
				y: maximumLayerLength+2,
				size: 1,
	        	color: "rgba(255, 255, 255, 0.0)"
			});
			nodes.push({
				id: "dummy3",
				x: -2,
				y: 0,
				size: 1,
	        	color: "rgba(255, 255, 255, 0.0)"
			});
			nodes.push({
				id: "dummy4",
				x: maximumLayerLength * 1.3 - 2,
				y: 0,
				size: 1,
	        	color: "rgba(255, 255, 255, 0.0)"
			});

			// determine edges
			var edges = new Array();
			for(var i = 1; i < nodesOfLayers.length; i++) {
				for(var j = 0; j < nodesOfLayers[i].length; j++) {
					nodesOfLayers[i][j].edgeIndex = new Array();
					nodesOfLayers[i][j].basicColor = (0.03 + (Math.pow(maximumLayerLength,2) - nodesOfLayers[i-1].length*nodesOfLayers[i].length) / Math.pow(maximumLayerLength,2) * 0.03);
					for(var k = 0; k < nodesOfLayers[i-1].length; k++) {
						var edge = {
							id: "edge" + i + "-" + j + "-" + k,
							source: nodesOfLayers[i-1][k].id,
							target: nodesOfLayers[i][j].id,
							color: "rgba(255, 255, 255, "+ nodesOfLayers[i][j].basicColor + ")"
						}
						nodesOfLayers[i][j].edgeIndex.push(edges.length);
						edges.push(edge);					
					}
				}
			}

			this.neuralNetwork = new sigma({
			  graph: {
			    nodes: nodes,
			    edges: edges
			  },
			  renderer: {
			    type: 'canvas',
			    container: 'neuralNetworkContainer'
			  },
			  settings: {
			  	mouseEnabled: false,
			   	autoRescale: true,
			   	resizeIgnoreSize: true,
			   	rescaleIgnoreSize: true,
			   	autoResize: false, 
			    defaultNodeType: 'border',
			    //defaultEdgeType: 'curve',
			    maxEdgeSize: 0.2,
			    minEdgeSize: 0.03,
			    minNodeSize: 0.01,
			    maxNodeSize: 7,
			  }
			});
		}

		/******************************
		//    init barchart tag
		/*****************************/
		this.barChartContainer.innerHTML = "";

		// chart label of average distance
		var pTag = document.createElement("p");
		pTag.setAttribute("id", "inputLabel");
		pTag.appendChild(document.createTextNode("INPUT AVERAGE　　"));
		this.averageDistanceTag = document.createElement("span");
		this.averageDistanceTag.setAttribute("class", "score");
		pTag.appendChild(this.averageDistanceTag);
		this.barChartContainer.appendChild(pTag);

		// chart graph
		this.barChartCanvas = document.createElement("canvas");
		this.barChartCanvas.width = 820;
		this.barChartCanvas.height = 100;
		this.barChartCanvas.setAttribute("class", "barChart");
		this.barChartContainer.appendChild(this.barChartCanvas);
		var ctx = this.barChartCanvas.getContext("2d");
		var gradient = ctx.createLinearGradient(0, 0, 0, 100);
		gradient.addColorStop(0, 'rgba(100,200,100,0.8)');   
		gradient.addColorStop(0.5, 'rgba(100,200,205,0.6)');
		gradient.addColorStop(1, 'rgba(0,51,153,0.4)');   
		var data = {
			labels: [],
			datasets: [
			{
				fillColor : gradient,
				strokeColor : "rgba(151,187,205,1)",
				data: []
			}
			]
		};
		var dataLength = 1;
		if(car) {
			dataLength = car.eyes.length;
		}
		data.labels = new Array(dataLength);
		data.datasets[0].data = new Array(dataLength);
		for(var i = 0; i < dataLength; i++) {
			data.labels[i] = "";
			data.datasets[0].data[i] = 0;
		}
		var option = {
			responsive: true,
			animation: false,
			inGraphDataShow: false,
			inGraphDataFontSize: 1,
			showScale: false,
			barValueSpacing: 0.7,
			barDatasetSpacing: 1,
			barStrokeWidth: 0.9,
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


		/**************************
		//    init switch button 
		**************************/
		$(function() {
			container.switchImage = $('img#switch');
			container.switchImage.off();

			if(car) {
				container.switchImage.css({
					"-webkit-filter": car.mode.switchStyle
				});

				container.switchImage.hover(
					function(){
						$(this).stop().animate({
							'width':'120px',
							'height':'120px',
							'marginTop': '-10px',
							'marginLeft':'-10px',
							'opacity': '0.9'
						},300);
					},
					function () {
						$(this).stop().animate({
							'width':'100px',
							'height':'100px',
							'marginTop': '0px',
							'marginLeft':'0px',
							'opacity': '0.6'
						},'fast');
					}
					).click(function() {
						var car = container.env.getCarSelected();
						if(car) {
							car.switchMode();
							container.drawHTML(car);			
							$(this).css({
								"-webkit-filter": car.mode.switchStyle
							});
						}
					});
				} else {
					container.switchImage.css({
						"-webkit-filter": MODE.NONE.switchStyle
					});				
				}
			});
	}

	return this;	
}