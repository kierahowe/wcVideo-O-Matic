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

  	starttime = (new Date()).getTime();
	try{ 
		var proc = ffmpeg( inname );
		proc.videoBitrate('2048k')
    	.videoCodec('mpeg4')
		.audioBitrate('128k')
		.audioChannels(2)
		.fps(25)
		.size('1280x720');

		proc
		.on('end', () => {
		  	status = 'transcode completed succesfully';
		  	percent = 100;
		  	success = true;
		  	complete = true;
		  	curid = null;
		})
		.on('error', function(err) {
		  	console.log('An error occured merging ' + err.message);
		  	status = 'An error occured merging ' + err.message;
		  	percent = 100;
		  	success = false;
		  	complete = true;
		  	curid = null;
		})
		.on('progress', info => {
			viddetail[ outname ] = info;
			var curtime = (new Date()).getTime();
			var avg = ((curtime - starttime) / info.percent );
			var est = (curtime - starttime) * ( 100 / info.percent);
	    	console.log('progress ' + info.percent + '% (' + avg + ' ::: ' + est + ')' );
	    	percent = Math.round( info.percent );
	  	})
	  	.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})
		.save( outname );
	} catch ( e ) { 
		console.log( 'Fail on FFMPeg file', e )
	  	percent = 100;
		status = 'FFMPeg error: ' + e.message;
		complete = true;
		success = false;
	  	curid = null;
	}

}