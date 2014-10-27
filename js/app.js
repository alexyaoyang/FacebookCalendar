// root for event tree
var tree = new Arboreal(tree,{},"event-root");

function layOutDay(events){
	clearCalendar();
	sort(events);
	addInfo(events);
	renderUI(events);
	fillSpace(events);
	moveOverlap(events);
}

function renderUI(events){
	var eventName = 'Sample Item';
	var eventLocation = 'Sample Location';
	var maxWidth = $('#event-container').width();
	for(var i = 0; i < events.length; i++){
		console.log('event '+i+' divisor: '+events[i].divisor+' overlapped with: '+events[i].overlapsWith);
		var markup = '<span class="facebook-color big-font">'+eventName+' '+i+'</span><br>';
		if(events[i].duration>29){
			markup += eventLocation;
		}
		var event = $('<div/>',{
			id:'event-'+i,
			class:'event gray small-font',
			html:markup
		});
		var width = maxWidth/events[i].divisor;	
		var height = events[i].duration;
		var start = i==0?events[i].start:events[i].start-events[i].previousDurations;
		events[i].width = width;

		event.css('height',height-2); //-2 for top and bottom border (2 x 1)
		event.css('width',width-10); //-10 for blue event border (4) + right gray border (1) + padding (5)
		event.css('top',start);

		event.appendTo('#event-container');
	}
}

//clears calendar and tree for next set of instructions
function clearCalendar(){
	var i=0;
	while(true){
		if($('#event-'+i).length){
			$('#event-'+i).remove();
		}
		else { break; }
		i++;
	}
	tree = new Arboreal(tree,{},"event-root");
	tree.depth = 0;
}

//preprocess events: total duration so far, add into tree, who it overlaps with and add divisor
function addInfo(events){
	var visited = Array.apply(null, new Array(events.length)).map(Number.prototype.valueOf,0); //visited array for dfs
	var accumulativeDuration = 0;
	for(var i = 0; i < events.length; i++){
		if(events[i].overlapsWith==null){
			events[i].overlapsWith = [];
		}
		events[i].duration = events[i].end-events[i].start;
		events[i].previousDurations = accumulativeDuration;
		events[i].eventID = i;
		accumulativeDuration += events[i].duration;

		if(tree.getLength() == 1){ // if tree is empty
			tree.appendChild(events[i],"event-"+i);
		}
		else {
			var deepestFound = "event-root";
			for(var k = 0; k < tree.children.length; k++){
				deepestFound = searchForOverlap(events[i],tree.children[k],visited,"event-root");
				if(deepestFound != "event-root"){ events[i].deepestFound = deepestFound;break; }
			}
			console.log("event "+i+ " deepestFound: "+deepestFound);
			if(k == tree.children.length){ //if not found, add to root
				tree.appendChild(events[i],"event-"+i);
			}
			else{
				var deepest = tree.find(deepestFound);
				//if first found and last found depth is same, that is the only place to insert new event
				if(deepest.depth == events[i].firstFoundDepth && deepest.depth>1){ 
					deepest.parent.appendChild(events[i],"event-"+i);
				}
				else{
					var it = deepest.parent;
					var hasGap = false;
					while(it.id!="event-root"){
						//if somewhere along the path from root to last overlap, one or more events don't overlap
						if(!checkIfOverlap(events[i],events[it.data.eventID])){ 
							hasGap = true;
							break;
						}
						it = it.parent;
					}
					//find first non-overlap on that path and insert event there
					if(hasGap){
						while(!checkIfOverlap(events[i],events[it.parent.data.eventID])){ it=it.parent; } 

						it.appendChild(events[i],"event-"+i);
					}
					//has no gap, insert event after last overlap
					else{ 
						deepest.appendChild(events[i],"event-"+i);
					}
				}
			}

		}

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
	}
	for(var k = 0; k < tree.children.length; k++){
		setDivisor(events, tree.children[k], visited, 1);
	}
}

//dfs to find new event's last overlap with existing event
function searchForOverlap(event, eventTree, visited, found){
	visited[eventTree.data.eventID]=1;
	
	if(checkIfOverlap(event,eventTree.data)){
		found = eventTree.id;
		if(event.firstFoundDepth==null){
			event.firstFoundDepth = eventTree.depth;
		}
	}
	for(var i = 0; i < eventTree.children.length; i++){
		found = searchForOverlap(event, eventTree.children[i], visited, found);
	}
	
	return found;
}

//dfs to set divisor for UI rendering
function setDivisor(events, eventTree, visited, maxDivisor){
	visited[eventTree.data.eventID]=1;
	
	if(eventTree.children.length == 0){
		maxDivisor = eventTree.depth;
		events[eventTree.data.eventID].divisor = maxDivisor;
	}
	else{
		for(var i = 0; i < eventTree.children.length; i++){
			maxDivisor = setDivisor(events, eventTree.children[i], visited, maxDivisor);
			if(events[eventTree.data.eventID].divisor == null){
				events[eventTree.data.eventID].divisor = maxDivisor;
			}
			else {
				if(events[eventTree.data.eventID].divisor < maxDivisor){
					events[eventTree.data.eventID].divisor = maxDivisor;
				}
			}
		}
	}
	return maxDivisor;
}

// move overlapped events
function moveOverlap(events){
	for(var i = 0; i < events.length; i++){
		for(var k = 0; k < events[i].overlapsWith.length; k++){
			if(events[i].overlapsWith[k]>i){
				var multiplier = 1;
				var eventToMove = $('#event-'+events[i].overlapsWith[k]);
				while(doTheyOverlap($('#event-'+i),eventToMove)){
					var left = parseInt(eventToMove.css('left')=='auto'?0:eventToMove.css('left'))+events[events[i].overlapsWith[k]].width;
					eventToMove.css('left',left);
				}
			}
		}
	}
}

//fill extra space on UI
function fillSpace(events){
	var eventStart = document.getElementById('event-'+0).getBoundingClientRect().left;
	var maxWidth = $('#event-container').width();
	for(var i = 1; i < events.length; i++){
		var it = tree.find("event-"+i);
		while(it.parent.id!="event-root"){ 
			if(events[it.data.eventID].divisor!=events[it.parent.data.eventID].divisor){
				var perUnitSpace = maxWidth / events[it.parent.data.eventID].divisor;
				var spaceToDivide = maxWidth - (perUnitSpace * it.parent.depth);
				var newWidth = spaceToDivide / (events[it.data.eventID].divisor - 1);
				events[i].width = newWidth;
				$('#event-'+i).css('width',newWidth-10);
				var parent = document.getElementById('event-'+it.parent.data.eventID);
				var parentBox = parent.getBoundingClientRect();
				var parentBoxRight = parentBox.right-eventStart;
				$('#event-'+i).css('left',parentBoxRight);
				break;
			}
			it = it.parent;
		} 
	}
}

//check if two events overlap each other visually. 
//http://stackoverflow.com/questions/11641638/detecting-if-html-element-is-overlapping-another-html-element
function doTheyOverlap(div0, div1){return (yInstersection(div0, div1) && xInstersection(div0, div1));}

function findSmallestY(div0, div1){
    return (div0.offset().top < div1.offset().top)? div0 : div1;
}
function yInstersection(div0, div1){
    var divY0 = findSmallestY(div0, div1);
    var divY1 = (div0 != divY0)? div0 : div1;

    return (divY0.offset().top + divY0.height()) - divY1.offset().top >= 0;
}

function findSmallestX(div0, div1){
    return (div0.offset().left < div1.offset().left)? div0 : div1;
}

function xInstersection(div0, div1){
    var divX0 = findSmallestX(div0, div1);
    var divX1 = (div0 != divX0)? div0 : div1;
    return (divX0.offset().left + divX0.width()) - divX1.offset().left >= 0;
}

//check if two events's time overlap
function checkIfOverlap(e1, e2){
	var e1start = e1.start;
	var e1end = e1.end;
	var e2start = e2.start;
	var e2end = e2.end;

	return (e1start > e2start && e1start < e2end || 
	    	e2start > e1start && e2start < e1end)
}

//sort based on start time
function sort(events){
	events.sort(function(e1,e2){
		return e1.start - e2.start;
	});
}

//automate time creation
function initialize(){
	var AMPM = ' AM';
	for(var i = 9; i < 22; i++){
		var hour = i%12;
		if(i%12 == 0) { AMPM = ' PM';hour = 12; }
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