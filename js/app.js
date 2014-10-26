function layOutDay(events){
	events = sort(events);
	events = addInfo(events);
	var eventName = 'Sample Item';
	var eventLocation = 'Sample Location';
	var maxWidth = $('#event-container').width();
	for(var i = 0; i < events.length; i++){
		console.log(i+': '+events[i].start+' '+events[i].end+' '+events[i].overlaps+' '+events[i].overlapsWith);
		var event = $('<div/>',{
			id:'event-'+i,
			class:'event',
			html:'<span class="facebook-color">'+eventName+i+'</span><br>'+eventLocation
		});
		var width = maxWidth/events[i].overlaps;
		var height = events[i].duration;
		var start = i==0?events[i].start:events[i].start-events[i].previousDurations;
		events[i].width = width;

		event.css('height',height);
		event.css('width',width-4); //-4 for blue event border
		event.css('top',start);

		event.appendTo('#event-container');
	}
	moveOverlap(events);
}

//preprocess events and add # of overlaps, who it overlaps with and total duration so far
function addInfo(events){
	var accumulativeDuration = 0;
	for(var i = 0; i < events.length; i++){
		var overlaps = 1;
		events[i].overlapsWith = [];
		events[i].duration = events[i].end-events[i].start;
		events[i].previousDurations = accumulativeDuration;
		accumulativeDuration += events[i].duration;
		for(var j = i+1; j < events.length; j++){
			if(checkIfOverlap(events[i],events[j])){ overlaps++;events[i].overlapsWith.push(j); }
			else{ break; }
		}
		if(i!=0){
			overlaps = Math.max(overlaps,events[i-1].overlaps);
		}
		events[i].overlaps = overlaps;
	}
	return events;
}

//move overlapped events
function moveOverlap(events){
	for(var i = 0; i < events.length; i++){
		for(var k = 0; k < events[i].overlapsWith.length; k++){
			var multiplier = 1;
			var eventToMove = $('#event-'+events[i].overlapsWith[k]);
			if(doTheyOverlap($('#event-'+i),eventToMove)){
				console.log("overlapped: "+i+' '+events[i].overlapsWith[k]);
				eventToMove.css('left',multiplier*events[i].width)
				multiplier++;
			}
		}
	}
}

//check if two events overlap each other visually. http://stackoverflow.com/questions/11641638/detecting-if-html-element-is-overlapping-another-html-element
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
    console.log("checking value0: "+((divX0.offset().left + divX0.width()) - divX1.offset().left));
    console.log("checking value1: "+divX0.offset().left);
    console.log("checking value2: "+divX0.width());
    console.log("checking value3: "+divX1.offset().left);
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
	return events;
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