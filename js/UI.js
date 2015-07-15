/***********************************/
// UI to draw information to window
/***********************************/
var UI = function(env) {
	this.infoTag = document.getElementById("info");
	this.statusTag = document.getElementById("status");
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
	this.addObstacleCursorImage = null;
	this.addItemCursorImage = null;
	this.barChart = null;
	this.barChartCanvas = null;
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


		// cursor
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("CURSOR："));
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);


		// Shift
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.setAttribute("class", "name");
		spanTag.appendChild(document.createTextNode("SHIFT"));
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("CHANGE MODE"));
		spanTag.setAttribute("class", "usage");
		spanTag.onclick = function() {
			container.env.switchCursorMode();
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
		spanTag.appendChild(document.createTextNode("KEY [J]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("SAVE WORLD"));
		spanTag.onclick = function() {
			container.env.saveWorldJSON();
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// save brain
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("KEY [B]"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "usage");
		spanTag.appendChild(document.createTextNode("SAVE BRAIN"));
		spanTag.onclick = function() {
			container.env.saveBrainJSON();
		}
		pTag.appendChild(spanTag);
		this.infoTag.appendChild(pTag);

		// drag and drop usage
		var pTag = document.createElement("p");
		pTag.appendChild(document.createTextNode("DRAG & DROP TO READ"));
		this.infoTag.appendChild(pTag);

		// hr line
		var hrTag = document.createElement("hr");
		this.infoTag.appendChild(hrTag);


		// prebuilt world
		var pTag = document.createElement("p");
		pTag.appendChild(document.createTextNode("PREBUILT WORLD:"));
		this.infoTag.appendChild(pTag);

		// stage1
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("STAGE1"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "prebuilt");
		spanTag.appendChild(document.createTextNode("CURVE COURSE"));
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
		pTag.appendChild(document.createTextNode("TRAINED BRAIN:"));
		this.infoTag.appendChild(pTag);

		// brain 1
		var pTag = document.createElement("p");
		var spanTag = document.createElement("span");
		spanTag.appendChild(document.createTextNode("BRAIN1"));
		spanTag.setAttribute("class", "name");
		pTag.appendChild(spanTag);
		spanTag = document.createElement("span");
		spanTag.setAttribute("class", "prebuilt");
		spanTag.appendChild(document.createTextNode("FAST MOVE"));
		spanTag.onclick = function() {
			container.env.loadFromJSON(prebuiltBrainJSON[0]);
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