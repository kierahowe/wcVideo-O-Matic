var ffmpeg = require('fluent-ffmpeg');
var percent = 0;
var status = '';
var complete = true;
var viddetail = {};
var success = false;
var curid = null;
var arg = null;
var outfile = null;

exports.startProcess = ( args ) => { 
	//console.log( args );
	
	success = false;
	percent = 0;
	status = 'Starting video processing';
	complete = false;
	curid = args['id'];
	arg = args;

	var param = { 
		'fontfile': arg['fontfile'] ? arg['fontfile'][0] : 'assets/media/Baskerville.ttc', 
		'fontsize': arg['fontsize'] ? arg['fontsize'] : 40, 
		'text_y': arg['text_y'] ? arg['text_y'] : 40, 
		'fontcolor': arg['fontcolor'] ? arg['fontcolor'].substring( 1 ) : '000000', 
	};

	outfile = args['outputfile'];
	console.log( args );

	this.buildImageVideo( args['imagefile'][0], args['tmpdir'][0] + '/startfile.mp4', '', 
						args['speaker'] + '\n' + args['title'], param, () => { 
		percent ++;
		if( typeof args['credits'] === 'undefined' || args['credits'] === '' ) { 
			args['credits'] = args['speaker'] + '\n' + args['title'];
		}
		this.buildImageVideo( args['imagefile'][0], args['tmpdir'][0] + '/endfile.mp4', '', 
						args['credits'], param, () => { 
			percent ++;
			this.mergeVideos( args['outputfile'], 
				[ args['tmpdir'][0] + '/startfile.mp4', args['mainvideo'], args['tmpdir'][0] + '/endfile.mp4' ], 
				{ 'bounds': { [args['mainvideo']]: { 'start': args['start'], 'end': args['end'] } } },
				() => { 
					status = 'File processed: ';
					percent = 100;
					complete = true;
					success = true;
			});
		} );
	} );
}

exports.getDetails = () => { 
	return { 'percent': percent, 'status': status, 'complete': complete, 'success': success, 'curid': curid, 'outfile':outfile };
}

exports.buildImageVideo = ( img, outfile, audiofile, text, params, callback ) => { 
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
			this.transcode( arg['tmpdir'][0] + '/tmp_vid.mp4', outfile, 1, callback );
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
		  	fontfile: params['fontfile'],
		    text: textsplit[i].replace('&amp', '&').replace(';', ''),
		    fontsize: params['fontsize'],
		    fontcolor: params['fontcolor'],
		    x: '(main_w/2-text_w/2)',
		    y: '( ( ' + params['text_y'] + ' ' + th + ' ) + (' + ( i ) + ' * ( text_h * 1.2) ) )',
		    shadowcolor: '888888',
		    shadowx: 2,
		    shadowy: 2
		  }
		})
	}

	// save to file
	proc.save( arg['tmpdir'][0] + '/tmp_vid.mp4');

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

exports.mergeVideos = ( outname, vidlist, param, callback ) => { 
	status = 'Start merging videos';
	const fs = require("fs"); 

	var flg = 0;	
	try{ 
		var proc = ffmpeg( vidlist[0] );
		
		let fsz = fs.statSync( vidlist[0] ).size;
		const firstSize = fsz;

		var filter = '';
		var cat = '';
		if( typeof param['bounds'][vidlist[0]] !== 'undefined' ) { 
			filter += '[0:0] trim=' + param['bounds'][vidlist[0]]['start'] + ':' + param['bounds'][vidlist[0]]['end'] +' [v0]'
			filter += '[0:1] atrim=' + param['bounds'][vidlist[0]]['start'] + ':' + param['bounds'][vidlist[0]]['end'] +' [a0]'
			cat += '[v0][a0]';
		} else { 
			cat += '[0:0][0:1]';
		}
		for( var i = 1; i < vidlist.length; i++ ) { 
			proc.input( vidlist[i] );
			fsz += fs.statSync( vidlist[i] ).size;
			if( typeof param['bounds'][vidlist[i]] !== 'undefined' ) { 
				if ( filter  !== '' ) { filter += ';'; }
				filter += '[' + i + ':0] trim=' + param['bounds'][vidlist[i]]['start'] + ':' + param['bounds'][vidlist[i]]['end'] +',setpts=PTS-STARTPTS [v' + i + ']'
				filter += ';[' + i + ':1] atrim=' + param['bounds'][vidlist[i]]['start'] + ':' + param['bounds'][vidlist[i]]['end'] +',asetpts=PTS-STARTPTS [a' + i + ']'
				cat += '[v' + i + '][a' + i + ']';
			} else { 
				cat += '[' + i + ':0][' + i + ':1]';
			}
		}

		proc.on('end', function() {
			console.log('files have been merged succesfully');
		  	status = 'Merging completed succesfully';
		  	percent = 50;
		  	complete = true;
		  	success = true;
		  	callback();
		})
		.on('error', function(err) {
		  	console.log('An error occured merging ' + err.message);
		  	status = 'An error occured merging ' + err.message;
		  	percent = 100;
		  	complete = true;
		})
		.on('progress', function(info) {
	    	console.log('progress ' + (info.percent * firstSize / fsz) + '%');
	    	percent = Math.round( info.percent * firstSize / fsz );
	    })
	    .on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})
	  	.videoBitrate('2048k')
    	.videoCodec('mpeg4')
		.audioBitrate('128k')
		.audioChannels(2)
		.format('avi')
		.fps(25);
		console.log( 'filter', filter );
		if( filter !== '' ) {
			proc.addOption('-filter_complex', filter + ';' + cat + 'concat=n=' + vidlist.length + ':v=1:a=1');
			proc.save( outname );
		} else { 
			proc.mergeToFile(outname);
		}		
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
