var ffmpeg = require('fluent-ffmpeg');
var percent = 0;
var status = '';
var complete = true;
var viddetail = {};
var success = false;
var curid = null;
var fname = null;

exports.getDetails = () => { 
	return { 'percent': percent, 'status': status, 'complete': complete, 'success': success, 'curid': curid, 'fname': fname };
}

var starttime = null;

exports.transcode = ( inname, outname, id ) => { 
  	status = 'transcode pass started';
  	percent = 0;
	status = '';
	complete = false;
	viddetail = {};
	success = false;
	curid = id;
	fname = outname;

	try {
    	files = JSON.parse(inname);
	} catch (e) {
		files = [ inname ];
	}

	const fs = require("fs"); //Load the filesystem module

  	starttime = (new Date()).getTime();
	try{ 
		var proc = ffmpeg( files[0] );
		let fsz = fs.statSync( files[0] ).size;
		const firstSize = fsz;
		
		var filter = '';
		var cat = '';
		filter += '[0:0] scale=1280:720 [v0]'
		cat += '[v0][0:1]';
		for( var i = 1; i < files.length; i++ ) { 
			proc.input( files[i] );
			fsz += fs.statSync( files[i] ).size;
			filter += ',[' + i + ':0] scale=1280:720 [v' + i + ']';
			cat += '[v' + i + '][' + i + ':1]';
		}

		proc.videoBitrate('2048k')
    	.videoCodec('libx264')
    	.audioCodec('aac')
		.audioBitrate('128k')
		.audioChannels(2)
		.fps(25);

		if( files.length > 1 ) {
			proc.addOption('-filter_complex', filter + ',' + cat + 'concat=n=' + files.length + ':v=1:a=1')
		} else { 
			proc.size('1280x720');
		}

		proc
		.on('end', () => {
		  	status = 'transcode completed succesfully';
		  	percent = 100;
		  	success = true;
		  	complete = true;
		  	curid = null;

			var curtime = (new Date()).getTime();
			var time = Math.floor((curtime - starttime) / 3600) + ':' + 
					  Math.floor(((curtime - starttime) % 3600) / 60) + ':' + 
					  Math.floor((curtime - starttime) % 60);
			console.log( 'Total processed Time: ' + time );
		})
		.on('error', function(err) {
		  	console.log('An error occured transcoding ' + err.message);
		  	status = 'An error occured transcoding ' + err.message;
		  	percent = 100;
		  	success = false;
		  	complete = true;
		  	curid = null;
		})
		.on('progress', info => {
			viddetail[ outname ] = info;
			var curtime = (new Date()).getTime();
			var diff = (curtime - starttime) / 1000;
			var avg = ( (diff * 100 / info.percent) * firstSize / fsz );
			var pred = Math.floor(avg / 3600) + ':' + 
					  Math.floor((avg % 3600) / 60) + ':' + 
					  Math.floor(avg % 60);
			var time = Math.floor(diff / 3600) + ':' + 
					  Math.floor((diff % 3600) / 60) + ':' + 
					  Math.floor(diff % 60);
			
	    	console.log('progress ' + info.percent + '% (' + pred + ' ::: ' + time + ')' );
	    	// recalculate the percent based off of the file size - its not going to be perfect, but, best case
	    	percent = Math.round( info.percent * firstSize / fsz );  
	  	})
	  	.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})

		proc.save( outname );
	} catch ( e ) { 
		console.log( 'Fail on FFMPeg file', e )
	  	percent = 100;
		status = 'FFMPeg error: ' + e.message;
		complete = true;
		success = false;
	  	curid = null;
	}

}