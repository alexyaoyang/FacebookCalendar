function layOutDay(events){
	clearCalendar();
	swapStartEndIfNeeded(events);
	sort(events);
	addInfo(events);
	renderUI(events);
	moveOverlap(events);
}

//counts number of overlapped elemnents at a point
function getElementsUnder(xPos, yPos){
	var $wrapper = $("#event-container");
	$wrapper.underpoint({
	    selector: "*",
	    trigger: ["manual"],
	    depth: 0
	});
	return $wrapper.underpoint("point", { x: xPos, y: yPos });
}

// determines divisor, width and content to assign
function renderUI(events){

	var eventName = 'Event';
	var eventLocation = 'Location';

	var eventContainerRect = document.getElementById("event-container").getBoundingClientRect();
	var eventsY = eventContainerRect.top;
	var eventsX = eventContainerRect.left+11;
	var maxWidth = $('#event-container').width();

    //check one line of 720 pixels down from the top of events container
    ////////////////////
    for(var j = eventsY; j < eventsY+720; j+=10){
        var $elements = getElementsUnder(eventsX,j);

        for(var i = 0; i < $elements.length; i++){
    		var id = $elements[i].id;
    		var eventID = parseInt(id.substring(id.indexOf('-')+1));

    		if(events[eventID].divisor == null || events[eventID].divisor < $elements.length){
    			events[eventID].divisor = $elements.length;
    		}
    	}
    }
    // width and content
	for(var i = 0; i < events.length; i++){
		var event = $('#event-'+i);
		events[i].width = maxWidth/events[i].divisor;
		var width = events[i].width;
		var height = events[i].height;
		var markup = "";
		if(height>17 && width>33){
			markup = '<span class="facebook-color big-font">'+eventName+' </span><br>';
		}
		if(height>28 && width>33){
			markup += eventLocation;
		}
		event.css('width',width>10?width-10:0); //-10 for blue event border (4) + right gray border (1) + padding (5)
		event.html(markup);
		event.attr('divisor',events[i].divisor);
	}
}

//clears calendar and tree for next set of instructions
function clearCalendar(){
	scroll(0,0);

	for(var i = 0; ;i++){
		if($('#event-'+i).length){ $('#event-'+i).remove(); }
		else { break; }
	}
}

//preprocess events: total duration so far, add into tree, who it overlaps with and add divisor
function addInfo(events){
	var accumulativeDuration = 0;
	for(var i = 0; i < events.length; i++){
		if(events[i].overlapsWith==null){
			events[i].overlapsWith = [];
		}
		events[i].duration = events[i].end-events[i].start;
		events[i].previousDurations = accumulativeDuration;
		events[i].eventID = i;
		accumulativeDuration += events[i].duration;

		for(var j = i+1; j < events.length; j++){
			if(checkIfOverlap(events[i],events[j])){
				if(events[j].overlapsWith==null){
					events[j].overlapsWith = [];
				}
				events[i].overlapsWith.push(j);
				events[j].overlapsWith.push(i);
			}
			else{ break; }
		}

		var event = $('<div/>',{
			id:'event-'+i,
			class:'event gray small-font'
		});

		console.log('event-'+i+' overlapsWith: '+events[i].overlapsWith);
		var height = events[i].duration;
		var start = i===0?events[i].start:events[i].start-events[i].previousDurations;
		events[i].width = -1;
		events[i].height = height;
		events[i].start = start;

		event.css('height',height>2?height-2:0); //-2 for top and bottom border (2 x 1)
		event.css('width',0); //-10 for blue event border (4) + right gray border (1) + padding (5)
		event.css('top',start);

		if(height === 1){
			event.css('border-top','none');
		}
		else if(height === 0){
			event.css('border','none');
		}
		event.appendTo('#event-container');
	}
}

//moves function to avoid overlap visually
function moveOverlap(events){
	for(var i = 1; i < events.length; i++){
		//if it has overlaps and if first overlap is a parent/ancestor, then we need to move it
		if(events[i].overlapsWith.length>0 && events[i].overlapsWith[0]<i){
			var eventToMove = $('#event-'+i);
			var j = 0;
			for(; j < events[i].overlapsWith.length; j++){
				//break if current overlap is a child
				if(events[i].overlapsWith[j] > i) { break; }

				var currentOverlap = $('#event-'+events[i].overlapsWith[j]);
				var currentCheck = currentOverlap;
				var toIncrease = events[events[i].overlapsWith[j]].width;

				//if doesn't intersect with current parent/ancestor 
				if(!doTheyOverlap(eventToMove,currentOverlap)) {
					//check through all ancestor to clear current event or else report first ancestor overlap
					var k = 0;
					for(; k < events[i].overlapsWith.length; k++){
						if(doTheyOverlap(eventToMove,$('#event-'+events[i].overlapsWith[k]))) { 
							toIncrease = events[events[i].overlapsWith[k]].width+events[events[i].overlapsWith[k]].left-events[i].left;
							currentCheck = $('#event-'+events[i].overlapsWith[k]);
							//j = k;
							break; 
						}
					}
					//cleared
					if(k == events[i].overlapsWith.length) { break; }
				}

				//keep moving until it doesn't overlap
				while(doTheyOverlap(eventToMove,currentCheck)){
					var left = parseInt(eventToMove.css('left')=='auto'?0:eventToMove.css('left'))+toIncrease;
					eventToMove.css('left',left);
					events[i].left = left;
				}
			}

		}
	}
}

// fill extra space on UI
// function fillSpace(events){
// 	var eventStart = document.getElementById('event-'+0).getBoundingClientRect().left;
// 	var maxWidth = $('#event-container').width();
// 	for(var i = 1; i < events.length; i++){
// 		var it = tree.find("event-"+i);
// 		while(it.parent.id!="event-root"){ 
// 			if(events[it.data.eventID].divisor!=events[it.parent.data.eventID].divisor){
// 				var perUnitSpace = maxWidth / events[it.parent.data.eventID].divisor;
// 				var spaceToDivide = maxWidth - (perUnitSpace * it.parent.depth);
// 				var newWidth = spaceToDivide / (events[it.data.eventID].divisor - 1);
// 				events[i].width = newWidth;
// 				$('#event-'+i).css('width',newWidth-10);
// 				var parent = document.getElementById('event-'+it.parent.data.eventID);
// 				var parentBox = parent.getBoundingClientRect();
// 				var parentBoxRight = parentBox.right-eventStart;
// 				$('#event-'+i).css('left',parentBoxRight);
// 				break;
// 			}
// 			it = it.parent;
// 		} 
// 	}
// }

//check if two events overlap each other visually. 
//http://stackoverflow.com/questions/11641638/detecting-if-html-element-is-overlapping-another-html-element
function doTheyOverlap(div0, div1){return (yInstersection(div0, div1) && xInstersection(div0, div1));}

function findSmallestY(div0, div1){
    return (div0.offset().top < div1.offset().top)? div0 : div1;
}
function yInstersection(div0, div1){
    var divY0 = findSmallestY(div0, div1);
    var divY1 = (div0 != divY0)? div0 : div1;

    var test = (divY0.offset().top + divY0.height()) - divY1.offset().top;
    return (divY0.offset().top + divY0.height()) - divY1.offset().top >= -2;
}

function findSmallestX(div0, div1){
    return (div0.offset().left < div1.offset().left)? div0 : div1;
}

function xInstersection(div0, div1){
    var divX0 = findSmallestX(div0, div1);
    var divX1 = (div0 != divX0)? div0 : div1;
    var test =(divX0.offset().left + divX0.width()) - divX1.offset().left;
    return (divX0.offset().left + divX0.width()) - divX1.offset().left >= -5;
}

//check if two events's time overlap
function checkIfOverlap(e1, e2){
	var e1start = e1.start;
	var e1end = e1.end;
	var e2start = e2.start;
	var e2end = e2.end;

	return (e1start >= e2start && e1start < e2end || 
	    	e2start >= e1start && e2start < e1end)
}

function swapStartEndIfNeeded(events){
	for(var i = 0; i < events.length; i++){
		if(events[i].start>events[i].end){
			var temp = events[i].start;
			events[i].start = events[i].end;
			events[i].end = temp;
		}
		if(events[i].end>720){
			events[i].end = 720;
		}
	}
}

//sort based on start time
function sort(events){
	events.sort(function(e1,e2){
		if(e1.start == e2.start){
			return e2.end-e1.end;
		}
		return e1.start - e2.start;
	});
}

//automate time creation
function initialize(){
	var AMPM = ' AM';
	for(var i = 9; i < 22; i++){
		var hour = i%12;
		if(i%12 === 0) { AMPM = ' PM';hour = 12; }
		
		var mainTime = $('<span/>',{
			class:'bold big-font',
			html:hour + AMPM + '<br>'
		});
		
		var halfTime = $('<span/>',{
			class:'gray',
			html:hour+':30<br>'
		});
		
		mainTime.appendTo('#time-container');
		if(i!=21) { halfTime.appendTo('#time-container'); }
	}
}