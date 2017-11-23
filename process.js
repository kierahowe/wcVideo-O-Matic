var ffmpeg = require('fluent-ffmpeg');
var percent = 0;
var status = '';
var complete = true;
var viddetail = {};
var success = false;

//
//{ frames: 150,
  // currentFps: 0,
  // currentKbps: 1772.8,
  // targetSize: 1307,
  // timemark: '00:00:06.04',
  // percent: 100 }


exports.startProcess = ( args ) => { 
	//console.log( args );
	
	success = false;
	percent = 0;
	status = 'Starting video processing'
	complete = false;

	this.buildImageVideo( args['imagefile'], 'startfile.mp4', '', args['speaker'] + '\n' + args['title'], () => { 
		percent ++;
		if( args['credits'] === '' ) { 
			args['credits'] = args['speaker'] + '\n' + args['title'];
		}
		this.buildImageVideo( args['imagefile'], 'endfile.mp4', '', args['credits'], () => { 
			percent ++;
			this.transcode( args['mainvideo'], 'transcode_midfile.mp4', '', () => { 
				this.mergeVideos( args['outputfile'], [ 'startfile.mp4', 'transcode_midfile.mp4', 'endfile.mp4' ], () => { 
					status = 'File processed: ';
					percent = 100;
					complete = true;
					success = true;
				});
			});
		} );
	} );
}

exports.getDetails = () => { 
	return { 'percent': percent, 'status': status, 'complete': complete, 'success': success };
}

exports.buildImageVideo = ( img, outfile, audiofile, text, callback ) => { 
	status = 'Start building video from image';
	if( audiofile === '' ) { 
		audiofile = 'assets/media/empty-audio.mp3';
	}
	var proc = ffmpeg( img )
		.loop(6)
		.fps(25)
		.addInput( audiofile ).inputFormat('mp3')
		.size('1280x720')
		.videoBitrate('1024k')
    	.videoCodec('mpeg4')
		.audioBitrate('128k')
		.audioChannels(2)
		.format('avi')
		.size('?x720')
		.fps(25)
		.on('end', () => {
			console.log('Video has been created succesfully');
			status = 'Video complete';
			this.transcode( 'tmp_vid.mp4', outfile, 1, callback );
		})
		.on('error', function(err) {
			console.log('An error occured on creating the video: ' + err.message);
			status = 'An error occured on creating the video: ' + err.message;
			percent = 100;
			complete = true;
		})
  		.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})
		.on('progress', (info) => {
			viddetail[ outfile ] = info;
	    	percent = Math.round( info.percent / 50 );
	  	});

		var textsplit = text.split('\n');
		var th = '';
		if( textsplit.length % 2 === 1 ) { 
			th = '-( text_h * 1.2) /2';
		}
		if ( Math.floor(textsplit.length / 2) > 0 ) { 
			th = th + '-( text_h * 1.2) *' + Math.floor(textsplit.length / 2);
		}
		for( var i = 0; i < textsplit.length; i++ ) {
			proc.videoFilters({
			  filter: 'drawtext',
			  options: {
			  	fontfile: 'assets/media/Baskerville.ttc',
			    text: textsplit[i].replace('&amp', '&').replace(';', ''),
			    fontsize: 95,
			    fontcolor: 'black',
			    x: '(main_w/2-text_w/2)',
			    y: '( ( main_h/2 ' + th + ' ) + (' + ( i ) + ' * ( text_h * 1.2) ) )',
			    shadowcolor: '888888',
			    shadowx: 2,
			    shadowy: 2
			  }
			})
		}
		// save to file
		proc.save('tmp_vid.mp4');

	return 0;
}

exports.transcode = ( inname, outname, ratio, callback ) => { 
  	status = 'transcode pass started';
 //  	if( outname === 'transcode_midfile.mp4' ) { 
 //  		viddetail[ outname ] = { frames: 63327 }
	//   	callback();
	//   	return;
	// }
	try{ 
		var proc = ffmpeg( inname );
		proc.videoBitrate('2048k')
    	.videoCodec('mpeg4')
		.audioBitrate('128k')
		.audioChannels(2)
		//.format('avi')
		.fps(25)
		.size('1280x720');

		if( ratio !== '' ) { 
			proc
				.aspect( ratio )
				.autopad('white')
		}

		proc
		.on('end', () => {
			console.log('file have been transcoded succesfully');
		  	status = 'transcode completed succesfully';
		  	percent = 25;
		  	callback();
		})
		.on('error', function(err) {
		  	console.log('An error occured merging ' + err.message);
		  	status = 'An error occured merging ' + err.message;
		  	percent = 100;
		  	complete = true;
		})
		.on('progress', info => {
			viddetail[ outname ] = info;
	    	console.log('progress ' + info.percent + '%');
	    	percent = Math.round( info.percent / 4 );
	  	})
		.save( outname );
	} catch ( e ) { 

	}

}

exports.mergeVideos = ( outname, vidlist ) => { 
	status = 'Start merging videos';

	var totalframes = viddetail[ vidlist[0] ].frames;
	var flg = 0;	
	try{ 
		var proc = ffmpeg( vidlist[0] );
		for( var i = 1; i < vidlist.length; i++ ) { 
			proc.input( vidlist[i] );
			totalframes += viddetail[ vidlist[i] ].frames
		}
		proc.on('end', function() {
			console.log('files have been merged succesfully');
		  	status = 'Merging completed succesfully';
		  	percent = 50;
		  	complete = true;
		})
		.on('error', function(err) {
		  	console.log('An error occured merging ' + err.message);
		  	status = 'An error occured merging ' + err.message;
		  	percent = 100;
		  	complete = true;
		})
		.on('progress', function(info) {
	    	console.log('progress ' + Math.round( 100 * info.frames / totalframes ) + '%');
	    	percent = Math.round( 25 + ( 100 * info.frames / totalframes ) / 4 );
	    })
	  	.videoBitrate('2048k')
    	.videoCodec('mpeg4')
		.audioBitrate('128k')
		.audioChannels(2)
		.format('avi')
		.fps(25)
		.mergeToFile(outname);
	} catch( e ) { 
		console.log( 'Failed to process video', e );
		status = 'Video Compile failed: ' + e.message;
		percent = 100;
	  	complete = true;
	}
}


	 //  	}).on('codecData', function(data) {
		//     console.log('Input is ' + data.audio + ' audio ' +
		//       'with ' + data.video + ' video');
		// }).on('stderr', function(stderrLine) {
  //   		console.log('Stderr output: ' + stderrLine);
  // 		})
  // 		.on('start', function(commandLine) {
		// 	console.log('Spawned Ffmpeg with command: ' + commandLine);
		// })
