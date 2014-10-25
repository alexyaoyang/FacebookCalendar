function layOutDay(events){
	for(var i=0;i<events.length;i++){
		console.log(events[i].start+" "+events[i].end);

	}
}

//automate time creation
function initialize(){
	var AMPM = ' AM';
	for(var i=9;i<22;i++){
		var hour = i%12;
		if(i%12==0) { AMPM = ' PM';hour=12; }
		var mainTime = $('<span/>',{
			class:'bold big-font',
			html:hour+AMPM+'<br>'
		});
		var halfTime = $('<span/>',{
			class:'gray',
			html:hour+':30<br>'
		});
		mainTime.appendTo('#time-container');
		if(i!=21) { halfTime.appendTo('#time-container'); }
	}
}