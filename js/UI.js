/***********************************/
// UI to draw information to window
/***********************************/
var UI = function() {
	this.infoTag = document.getElementById("info");
	this.statusTag = document.getElementById("status");
	this.barChartContainer = document.getElementById("barChartContainer");
	this.IDTag = null;
	this.modeTag = null;
	this.actionTag = null;
	this.resultTag = null;
	this.victimTag = null;
	this.barChart = null;
	this.barChartCanvas = null;
	this.averageDistanceTag = null;
	this.switchImage = null;

	// alias this object to avoid conflict happens in inner function
	var container = this;

	// redraw to html
	this.drawHTML = function(car) {
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

	// initialize all tag
	this.initHTML = function(car) {
		/*****************************
		//   init info tag
		/****************************/
		this.infoTag.innerHTML = "";

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
		data.labels = new Array(car.eyes.length);
		data.datasets[0].data = new Array(car.eyes.length);
		for(var i = 0; i < car.eyes.length; i++) {
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
		    container.switchImage = $('#switch');
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
	    		cars[selected].switchMode();
	            $(this).css({
	            	"-webkit-filter": cars[selected].mode.switchStyle
				});	    	
		    });
		});
	}

	return this;	
}