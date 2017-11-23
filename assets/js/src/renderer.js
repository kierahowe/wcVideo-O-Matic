
global.runType = 'renderer';

import $ from "jquery";

const remote = require('electron').remote;
var dataInput = remote.getCurrentWindow().dataInput;
var selectedVideo = null;
var cached = {};

import video from 'video.js';

addCss ();

function addCss() { 
	// Load in the CSS from the theme or the base
	var link = document.createElement( "link" );
	link.href = 'style.css'; 
	link.type = "text/css";
	link.rel = "stylesheet";
	link.media = "screen,print";
	document.getElementsByTagName( "head" )[0].appendChild( link );
	
	// Load in the CSS from the theme or the base
	var link = document.createElement( "link" );
	link.href = 'fontawesome/css/font-awesome.css'; 
	link.type = "text/css";
	link.rel = "stylesheet";
	link.media = "screen,print";
	document.getElementsByTagName( "head" )[0].appendChild( link );

	// Load in the CSS for the video player
	var link = document.createElement( "link" );
	link.href = 'node_modules/video.js/dist/video-js.css';
	link.type = "text/css";
	link.rel = "stylesheet";
	link.media = "screen,print";
	document.getElementsByTagName( "head" )[0].appendChild( link );

}

$(document).ready( function () {
	$( '#settings' ).click( e => {
		setSelected( e.target );
		ReactDOM.render(
			<SettingsInput/>,
			document.getElementById('mainarea')
		);
	});
	$( '#presentations' ).click( e => {
		setSelected( e.target );
		ReactDOM.render(
			<Presentations/>,
			document.getElementById('mainarea')
		);
	});
	$( '#editor' ).click( e => {
		setSelected( e.target );
		ReactDOM.render(
			<Editor/>,
			document.getElementById('mainarea')
		);
	});
	$( '#process' ).click( e => {
		setSelected( e.target );
		ReactDOM.render(
			<Process/>,
			document.getElementById('mainarea')
		);
	});
	$( '#upload' ).click( e => {
		setSelected( e.target );
		ReactDOM.render(
			<Upload/>,
			document.getElementById('mainarea')
		);
	});

	$( '#credits' ).click( e => {
		setSelected( e.target );
		ReactDOM.render(
			<Credits/>,
			document.getElementById('mainarea')
		);
	});
	
	$( '#settings' ).click();
});

function setSelected( target ){ 
	$( '.menu-item' ).each( function( i, item ) { 
		if( item.id === target.id || target.parentNode.id === item.id ) { 
			$(item).addClass('selected');
		} else { 
			$(item).removeClass('selected');
		}
	});
}


function getSettings( key ) { 
	var fs = require('fs');

	if( fs.existsSync( 'settings.json' ) ) { 
		var contents = fs.readFileSync("settings.json");
		try { 
			contents = JSON.parse( contents );
		} catch ( e ) { 
			return {};
		}
		if( key === '' ) {
			return contents;
		} else { 
			if( typeof contents[key] === 'undefined' ) {
				return {};				
			} else { 
				return contents[ key ]
			}
		}
	} else {
		fs.writeFile('settings.json', JSON.stringify({}), function() { }  ); 
		return {};
	}
}

function saveSettings( key, settings ) { 
	var fs = require('fs');
	
	var s = getSettings( '' );
	s[ key ] = settings;

	fs.writeFile('settings.json', JSON.stringify( s ), function() { } ); 
}

function getRemoteContent( settings, type, callback ) { 
	//setTimeout( function() { callback( { x: 'y', z: 'zz' });  }, 1000 );
	var url = settings.campURL + 'wp-json/wp/v2/' + type + '?per_page=100';
	if( cached[ url ] ) { 
		setTimeout( i => { callback( cached[ url ] ); }, 20 );
		return;
	}
	$.ajax( url, { 
		})
		.done( function( result ) { 
			console.log( result );
			cached[ url ] = result;
			callback( result );
		})
		.fail( function() { 
			alert( 'Failed to access site at ' + url );
		});
}

function getPresentationSettings( settings, callback ) { 
	getRemoteContent( settings, 'session_track', t => { 
		var tracks = t;

		getRemoteContent( settings, 'speakers', u => { 
			let s = {};
			for( let i = 0; i < u.length; i ++) {
				s[ u[i]['id'] ] = u[i];
			}

			var speakers = s;

			getRemoteContent( settings, 'sessions', d => { 
				for( let i = 0; i < d.length; i ++) {
					let p = [];
					if( typeof d[i]._links.speakers !== 'undefined' && d[i]._links.speakers !== null  ) {
						for( let n = 0; n < d[i]._links.speakers.length; n++ ){ 
							let snum = d[i]._links.speakers[n].href;
							snum = parseInt( snum.substring( snum.lastIndexOf('/') + 1 ) );
							p.push( snum );
						}
					}
					d[i].speakers = p;
				}
				d.sort( function( a, b ) { 
					if( a.meta._wcpt_session_time === b.meta._wcpt_session_time ) { return 0; }
					return a.meta._wcpt_session_time - b.meta._wcpt_session_time;
				})
				
				callback( tracks, speakers, d );
			} );
		} );
	} );
}


// The goal here is to eventually load the cats from the remote server at wordpress.tv, however, 
// right now we are just going to load from the default_cats.json file
function getCategories() { 
	var fs = require('fs');
	var cats = getSettings( 'cats' );

	if( 1 || typeof cats === 'undefined' || typeof cats.length === 'undefined' || cats.length === 0 ) { 
		if( fs.existsSync( 'default_cats.json' ) ) { 
			cats = fs.readFileSync("default_cats.json");
			try { 
				cats = JSON.parse( cats );
			} catch ( e ) { 
				return [];
			}

			saveSettings( 'cats', cats );
		}
	}

	return cats;
}