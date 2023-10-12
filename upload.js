var percent = 0;
var status = '';
var complete = true;
var viddetail = {};
var success = false;
var detail = '';

exports.startProcess = ( args ) => { 
	//console.log( args );
	
	success = false;	
	percent = 0;
	status = 'Starting video uploading'
	complete = false;


	this.sendFile( args, function() { 
		console.log( 'file uploaded' );
		success = true;
		status = 'File uploaded';
		percent = 100;
		complete = true;
	} );
}

exports.getDetails = () => { 
	return { 'percent': percent, 'status': status, 'complete': complete, 'success': success, 'detail': detail };
}

exports.sendFile = ( args, callback ) => { 
	var https = require('https');
	var fs = require('fs');
	var striptags = require('striptags');

	var contents;
	try { 
		contents = fs.readFileSync("./settings.json", 'utf8');
		contents = JSON.parse( contents );
	} catch ( e ) { 
		console.log('An error occurred getting the settings for upload: ' + e.message );
		status = 'An error occurred getting the settings for upload: ' + e.message;
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
	var opt = {
		host: 'wordpress.tv',
		path: '/submit-video/',
		strictSSL: false,
	};			
	console.log( 'starting upload ', opt );
	let req = https.get( opt, (result) => {
  		var page = '';
  		result.on('data', (d) => { 
  			page += d;
  		});
  		result.on('end', () => { 
  			console.log( 'Got first page' );
  			var loc = page.indexOf( '<input type="hidden" id="wptvvideon" name="wptvvideon" value="' );
  			var data = page.substring( loc + 62, page.indexOf( '>', loc ) - 3 );
 			
 			var FormData = require('form-data');
			var fs = require('fs');
			
			var form = new FormData();
			form.append('wptv_uploaded_by', settings['upload_by'] );
			form.append('wptv_email', settings['email_addr'] );

			form.append('wptv_honey', '' );
			form.append('wptvvideon', data );
			form.append('_wp_http_referer', '/submit-video/' );
			form.append('action', 'wptv_video_upload' );
			form.append('wptv_video_wordcamp', 'on' );
			form.append('wptv_video_title', args['speaker'] + ': ' + args['title'].replace('&amp;', '&') );
			form.append('wptv_language', settings['language'] );
			if( typeof settings['cats'] !== undefined ) { 
				for( var i = 0; i < settings['cats'].length; i++ ) { 
					form.append('post_category[]', settings['cats'][i] );
				}
			}
			form.append('wptv_producer_username', settings['username'] );
			form.append('wptv_speakers', args['speaker'] );
			form.append('wptv_event', settings['event'] );

			if( typeof args['slides'] === 'undefined' || args['slides'] === '' ) { 
				form.append('wptv_slides_url', args['link'] ? args['link'] : '' );
			} else { 
				form.append('wptv_slides_url', args['slides'] );
			}
			form.append('wptv_video_description', striptags( args['description'] ) );
			
			var stat = fs.statSync( args['outputfile'] );
			var filesz = stat.size;
			var stream = fs.createReadStream( args['outputfile'] );
			var datacnt = 0;
			var lastcnt = 0;
			stream.on('data', (chunk) => { 
				datacnt += chunk.length;
				if ( Math.floor( ( datacnt / filesz ) * 100 ) > lastcnt ) { 
					console.log( 'uploading: ', ( datacnt / filesz ) * 100, complete );
					lastcnt = Math.floor( ( datacnt / filesz ) * 100 );
				}
				percent = Math.floor( ( datacnt / filesz ) * 100 )
			})
			form.append('wptv_file', stream);
			detail = '';

			var http = require('https');
		 	var options = {
				method: 'post',
				port: 443, 
				host: 'wptv.wordpress.com',
				path: '/wp-admin/admin-post.php',
				headers: form.getHeaders(),
				strictSSL: false,
			};			

			console.log( 'posting to form', options );
			const req = http.request(options, (res) => {
				console.log( 'Returned: code:' + res.statusCode + ' and headers: ', res.headers );
				res.on( 'data', function( chunk ) { 
					detail += chunk.toString();
				});
				res.on( 'end', ( ) => { 
					if ( res.statusCode !== 302 || 
						typeof res.headers.location === 'undefined' || res.headers.location === null || res.headers.location === '' ||
						res.headers.location.indexOf('success=1') === -1 ) 
					{ 
						if ( typeof res.headers.location === 'undefined' || res.headers.location === null || res.headers.location === '' ||
						res.headers.location.indexOf('success=1') === -1 ) { 
							console.log( 'Failed upload: did not return a redirect', detail );
							status = 'Failed to upload, site did not return a redirect';
						} else { 
							console.log( 'Failed upload: site returned ' + res.statusCode, detail );
							status = 'Failed to upload, site returned ' + res.statusCode ;
						}
						percent = 100;
						complete = true;
						success = false;
					} else { 
			  			console.log( 'done', detail );
						status = 'Done';
						percent = 100;
						complete = true;
						success = true;
						callback();
					}
				});
				res.on('error', ( e ) => { 
					console.log( 'Failed on http', e.message );
					status = 'Failed to upload';
					percent = 100;
					complete = true;
					success = false;
		  		});
			});

			req.on('error', ( e ) => { 
				console.log( 'Failed on http3', e.message );
				status = 'Failed to upload';
				percent = 100;
				complete = true;
				success = false;
	  		} );

			form.pipe(req);
  		});
  		result.on('error', ( e ) => { 
			console.log( 'Failed to connect', e );
			status = 'Failed to connect to WPTV site';
			percent = 100;
			complete = true;
			success = false;
  		});
	} );

	req.on('error', ( e ) => { 
		console.log( 'Failed to connect1', e );
		status = 'Failed to connect to WPTV site';
		percent = 100;
		complete = true;
		success = false;
	});

	return 0; 
	
}