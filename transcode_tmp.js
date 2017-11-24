var ffmpeg = require('fluent-ffmpeg');
var percent = 0;
var status = '';
var complete = true;
var viddetail = {};
var success = false;
var curid = null;

exports.getDetails = () => { 
	return { 'percent': percent, 'status': status, 'complete': complete, 'success': success, 'curid': curid };
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

	try {
    	files = JSON.parse(inname);
	} catch (e) {
		files = [ inname ];
	}

  	starttime = (new Date()).getTime();
	try{ 
		var proc = ffmpeg( files[0] );
		for( var i = 1; i < files.length; i++ ) { 
			proc.input( files[i] );
		}

		proc.videoBitrate('2048k')
    	.videoCodec('libx264')
    	.audioCodec('aac')
		.audioBitrate('128k')
		.audioChannels(2)
		.fps(25)
//		.size('?x720');

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
			var avg = (diff * 100 / info.percent );
			var pred = Math.floor(avg / 3600) + ':' + 
					  Math.floor((avg % 3600) / 60) + ':' + 
					  Math.floor(avg % 60);
			var time = Math.floor(diff / 3600) + ':' + 
					  Math.floor((diff % 3600) / 60) + ':' + 
					  Math.floor(diff % 60);
			
	    	console.log('progress ' + info.percent + '% (' + pred + ' ::: ' + time + ')' );
	    	percent = Math.round( info.percent );
	  	})
	  	.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})

	  	if( files.length > 1 ) {
		  	proc.mergeToFile( outname )
		} else { 
			proc.save( outname );
		}
	} catch ( e ) { 
		console.log( 'Fail on FFMPeg file', e )
	  	percent = 100;
		status = 'FFMPeg error: ' + e.message;
		complete = true;
		success = false;
	  	curid = null;
	}

}