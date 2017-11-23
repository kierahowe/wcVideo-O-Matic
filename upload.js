var percent = 0;
var status = '';
var complete = true;
var viddetail = {};
var success = false;

exports.startProcess = ( args ) => { 
	//console.log( args );
	
	success = false;	
	percent = 0;
	status = 'Starting video processing'
	complete = false;

	this.sendFile( args, function() { 
		success = true;
		status = 'File processed: ';
		percent = 100;
		complete = true;
	} );
}

exports.getDetails = () => { 
	return { 'percent': percent, 'status': status, 'complete': complete, 'success': success };
}

exports.sendFile = ( args, callback ) => { 
	var https = require('https');
	var fs = require('fs');
	var striptags = require('striptags');

	var contents = fs.readFileSync("settings.json");
	try { 
		contents = JSON.parse( contents );
	} catch ( e ) { 
		console.log('An error occurred getting the settings for upload: ' + err.message);
		status = 'An error occurred getting the settings for upload: ' + err.message;
		percent = 100;
		complete = true;
		return;
	}
	if( typeof contents === 'undefined' || contents === null ) { 
		console.log('An error occurred getting the settings for upload2');
		status = 'An error occurred getting the settings for upload';
		percent = 100;
		complete = true;
		return;
	}
	var settings = contents['settings'];

	if( typeof settings === 'undefined' || settings === null ) { 
		console.log('An error occurred getting the settings for upload3');
		status = 'An error occurred getting the settings for upload';
		percent = 100;
		complete = true;
		return;
	}

	https.get( 'https://wordpress.tv/submit-video/', (result) => {
  		var page = '';
  		result.on('data', (d) => { 
  			page += d;
  		});
  		result.on('end', () => { 
  			var loc = page.indexOf( '<input type="hidden" id="wptvvideon" name="wptvvideon" value="' );
  			var data = page.substring( loc + 62, page.indexOf( '>', loc ) - 3 );
 			
 			var FormData = require('form-data');
			var fs = require('fs');
			
			var form = new FormData();
			form.append('wptvvideon', data );
			form.append('_wp_http_referer', '/submit-video/' );
			form.append('action', 'wptv_video_upload' );
			form.append('wptv_video_wordcamp', 'on' );
			form.append('wptv_video_title', args['title'].replace('&amp;', '&') );
			form.append('wptv_language', settings['language'] );
			if( typeof settings['cats'] !== undefined ) { 
				for( var i = 0; i < settings['cats'].length; i++ ) { 
					form.append('post_category[]', settings['cats'][i] );
				}
			}
			form.append('wptv_producer_username', settings['username'] );
			form.append('wptv_speakers', args['speaker'] );
			form.append('wptv_event', settings['event'] );

			if( typeof args['slides'] === 'undefined' ) { 
				form.append('wptv_slides_url', '' );
			} else { 
				form.append('wptv_slides_url', args['slides'] );
			}
			form.append('wptv_video_description', striptags( args['description'] ) );

			var stat = fs.statSync( args['outputfile'] );
			var filesz = stat.size;
			var stream = fs.createReadStream( args['outputfile'] );
			var datacnt = 0;
			stream.on('data', (chunk) => { 
				datacnt += chunk.length;
				percent = 50 + Math.floor( ( ( datacnt / filesz ) * 100 ) / 2)
			})
			form.append('wptv_file', stream);
			
			form.submit('https://wordpress.tv/submit-video/', function(err, res) {
				//console.log( res );
			}).on( 'finish', ( ) => { 
	  			console.log( 'done' );
				status = 'Done';
				percent = 100;
				complete = true;
			})

  		});
  		result.on('error', () => { 

  		});
	});

	return 0; 
	
}