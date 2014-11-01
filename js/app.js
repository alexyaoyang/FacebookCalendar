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
	var eventName = '';
	var eventLocation = 'Location';

	var eventContainerRect = document.getElementById("event-container").getBoundingClientRect();
	var eventsY = eventContainerRect.top;
	var eventsX = eventContainerRect.left+10;
	var maxWidth = $('#event-container').width();
	var $elements;
	var id;
	var eventID;
	var hop = 3;
    //check one line of 720 pixels down from the top of events container
    for(var j = eventsY; j < eventsY+720; j+=hop){
        $elements = getElementsUnder(eventsX,j);
        //for each element overlapped
        for(var i = 0; i < $elements.length; i++){
    		id = $elements[i].id;
    		eventID = parseInt(id.substring(id.indexOf('-')+1));
    		//set divisor if not set or if divisor needs to be changed
    		if(events[eventID].divisor == null || events[eventID].divisor < $elements.length){
    			events[eventID].divisor = $elements.length;
    		}
    	}
    }
    var event;
    var width;
    var height;
    var markup;
    // width and content
	for(var i = 0; i < events.length; i++){
		event = $('#event-'+i);
		events[i].width = Math.floor(maxWidth/events[i].divisor);
		markup = "";
		width = events[i].width;
		height = events[i].height;
		//append event name
		if(height>17 && width>38){ markup = '<span class="facebook-color big-font">'+eventName+i+' </span><br>'; }
		//append location
		if(height>28 && width>38){ markup += eventLocation; }

		//subtract borders and paddings
		if(width>10){ event.css('width',width-10); } //-10 for blue event border (4) + right gray border (1) + padding (5)
		else {
			event.css('padding-left','0px');
			if(width==0){
				event.css('border','none');
				event.css('width',width);
			}
			else {
				event.css('width',width-2);
				event.css('border-left','1px solid #3b5998');
			}
		}
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

//preprocess events: total duration so far, who it overlaps with
function addInfo(events){
	var accumulativeDuration = 0;
	var height;
	for(var i = 0; i < events.length; i++){
		if(events[i].overlapsWith==null){ events[i].overlapsWith = []; }
		events[i].duration = events[i].end-events[i].start;
		events[i].previousDurations = accumulativeDuration;
		events[i].eventID = i;
		accumulativeDuration += events[i].duration;

		// determine and store all overlaps
		for(var j = 0; j < events.length; j++){
			if(i==j) { continue; }
			if(checkIfOverlap(events[i],events[j])){ events[i].overlapsWith.push(j); }
		}

		var event = $('<div/>',{
			id:'event-'+i,
			class:'event gray small-font'
		});

		console.log('event-'+i+' overlapsWith: '+events[i].overlapsWith);
		height = events[i].duration;
		events[i].width = -1;
		events[i].height = height;

		event.css('height', height > 2? height - 2 : 0); //-2 for top and bottom border (2 x 1)
		event.css('width', 0); //-10 for blue event border (4) + right gray border (1) + padding (5)
		event.css('top', i === 0? events[i].start : events[i].start - events[i].previousDurations);

		if(height === 1){ event.css('border-top','none'); }
		else if(height === 0){ event.css('border','none'); }

		event.appendTo('#event-container');
	}
}

//move overlap events so they are adjacent
function moveOverlap(events){
	var eventsX = document.getElementById("event-container").getBoundingClientRect().left+10;
	var eventToMove;
	var currentAncestor;
	var toIncrease;
	var skippingForward;
	var needToMove;
	var lastRoundCheck;
	var runCount;
	var antiLockMultiplier = 2;

	for(var i = 1; i < events.length; i++){
		//if event has overlaps and its first overlap is a parent/ancestor, then we need to move it
		if(events[i].overlapsWith.length>0 && events[i].overlapsWith[0]<i){
			runCount = 0;
			lastRoundCheck = false;
			skippingForward = false;
			needToMove = true;
			eventToMove = $('#event-'+i);
			currentAncestor = $('#event-'+events[i].overlapsWith[0]);
			//if current event and first ancestor doesn't overlap, then don't need to move it
			if(doTheyOverlap(eventToMove,currentAncestor)){
				for(var j = 0; j < events[i].overlapsWith.length; j++){
					runCount++;
					currentOverlap = events[i].overlapsWith[j];
					//break if current ancestor is a child, let the child move themselves
					if(currentOverlap > i) { break; }

					currentAncestor = $('#event-'+currentOverlap);

					//break if current event and current ancestor doesn't overlap
					if(!doTheyOverlap(eventToMove,currentAncestor) && !skippingForward) { continue; }

					//if current ancestor and next ancestor is continuous, no point moving one by one (not last round check)
					if(j < (events[i].overlapsWith.length-1) && ((events[i].overlapsWith[j+1]-currentOverlap) == 1) && !lastRoundCheck){
						//start to skip forward, determine if it needs to be moved in the first place
						if(!skippingForward){ needToMove = doTheyOverlap(eventToMove,currentAncestor); }
						skippingForward = true;
						continue;
					}
					//gap found in ancestor, possible place to slot current event in.
					else {
						//skip to ancestor
						if(needToMove){ eventToMove.css('left',currentAncestor.offset().left-eventsX); }

						//if anti-lock limit reached OR end of overlapped event OR next ancestor is a child
						if(runCount > (events[i].overlapsWith.length * antiLockMultiplier) || j == events[i].overlapsWith.length-1 || (j < (events[i].overlapsWith.length-1) && events[i].overlapsWith[j+1] > i)){
							lastRoundCheck = true;
						}

						//double check after every move, it might overlap with prior ancestor
						j = 0;
						skippingForward = false;
					}

					//set amount to increase to as ancestor's width
					toIncrease = currentAncestor.outerWidth();

					var left;
					if(doTheyOverlap(eventToMove,currentAncestor)){
						left = parseInt(eventToMove.css('left')=='auto'?0:eventToMove.css('left'))+toIncrease;
						eventToMove.css('left',left);
						events[i].left = left;
					}
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
function doTheyOverlap(div0, div1){
	var divOffset0 = div0.offset();
	var divOffset1 = div1.offset();

	var divY0 = (divOffset0.left < divOffset1.left)? divOffset0 : divOffset1;
	var divY1 = null;
	var smallestHeight = 0;
	if(divOffset0 == divY0){
		divY1 = divOffset1;
		smallestHeight = div0.height();
	}
	else {
		divY1 = divOffset0;
		smallestHeight = div1.height();
	}
    var divX0 = (divOffset0.left < divOffset1.left)? divOffset0 : divOffset1;
    var divX1 = (divOffset0 != divX0)? divOffset0 : divOffset1;
    var divX1 = null;
    var smallestWidth = 0;
    if(divOffset0 == divX0){
		divX1 = divOffset1;
		smallestWidth = div0.outerWidth();
    }
    else {
    	divX1 = divOffset0;
		smallestWidth = div1.outerWidth();
    }

    return ((divY0.top + smallestHeight) - divY1.top >= -2) &&
    		((divX0.left + smallestWidth) - divX1.left > 1);
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
		//reduce end time if exceeds max allowed
		if(events[i].end>720){ events[i].end = 720; }
	}
}

//sort based on 1) length 2) start time
function sort(events){
	events.sort(function(e1,e2){
		if((e1.end-e1.start) == (e2.end-e2.start)){ return e1.start - e2.start; }
		return (e2.end-e2.start) - (e1.end-e1.start);
	});
}

//automate time creation
function initialize(){
	var AMPM = ' AM';
	var hour;
	for(var i = 9; i < 22; i++){
		hour = i%12;
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