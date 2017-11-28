import $ from "jquery";
import videojs from 'video.js'

class Editor extends React.Component {
	constructor( props ) { 
		super(props);
		
		var viddet = getSettings( 'viddetail' );
		if( typeof viddet[ selectedVideo ] === 'undefined' ) { 
			// failed this should really never happen
			viddet[ selectedVideo ]	= {};
		}
		if( typeof viddet[ selectedVideo ]['video_start'] === 'undefined' ) { 
			// failed this should really never happen
			viddet[ selectedVideo ]['video_start']	= '0';
		}
		if( typeof viddet[ selectedVideo ]['video_end'] === 'undefined' ) { 
			// failed this should really never happen
			viddet[ selectedVideo ]['video_end'] = null;
		}
		this.player = null;
		
		this.state = { 
			settings: getSettings( 'settings' ), 
			viddetail: viddet,
			selectedVideo: selectedVideo
		};
	}

	componentDidMount() { 
		document.getElementById('video-js').innerHTML = 
			'<video width="640" id="videoplayer" class="video-js vjs-default-skin" controls>' + 
				'<source src="' + this.state.viddetail[this.state.selectedVideo]['tmp_file'] + '"></source>' + //' ' + this.state.viddetail[this.state.selectedVideo]['videofile'] +'"></source>' + 
//				'<source src="file:///Users/kiera/Documents/Development/wcvideoomatic/out.mp4"></source>' + //' ' + this.state.viddetail[this.state.selectedVideo]['videofile'] +'"></source>' + 
			'</video>';
								//<video width="640" id="vjs" ref={ node => this.vjsNode = node } className="video-js"></video>
		var self = this;

		this.player = videojs( 'videoplayer', {
//				src: this.state.viddetail[this.state.selectedVideo]['videofile']
			}, function onPlayerReady() {

			var htm = '<button class="vjs-mark-start vjs-control" type="button" aria-live="polite" title="Mark Start" aria-disabled="false"><span aria-hidden="true" class="vjs-icon-placeholder"></span><span class="vjs-control-text">Mark Start</span></button>';
			htm += '<button class="vjs-mark-end vjs-control" type="button" aria-live="polite" title="Mark Start" aria-disabled="false"><span aria-hidden="true" class="vjs-icon-placeholder"></span><span class="vjs-control-text">Mark Start</span></button>';
			$('.vjs-play-control').after( htm );

			$('.vjs-mark-end').click( e => { 
				self.setTimers( 'end', this.currentTime() );
			});
			$('.vjs-mark-start').click( e => { 
				self.setTimers( 'start', this.currentTime() );
			});
		});

		this.player.one('loadedmetadata', function() {
			console.log(self.state.viddetail,selectedVideo, this.duration() )
			if( self.state.viddetail[ selectedVideo ]['video_end'] === null ) { 
				self.setTimers( 'end', this.duration() );
			}
		});
	}

	setTimers( item, val ) { 
		 var x = this.state.viddetail;
		 x[ this.state.selectedVideo ]['video_' + item] = val;
		 this.setState( { viddetail: x });
		 this.handleLostFocus();
	}
	
	componentWillUnmount() {
		if (this.player) {
			this.player.dispose()
		}
	}

	updateSettings( e, id ) { 
		var x = this.state.viddetail;
		if( typeof x[id] === 'undefined' ) { 
			x[id] = {};
		}
		var val = e.target.value;
		if ( e.target.type === 'checkbox' ) { 
			if( e.target.checked ) { 
				val = 'on';
			} else { 
				val = '';
			}
		}
		x[id][ e.target.id ] = val;
		this.setState( { viddetail: x });

		if ( e.target.type === 'checkbox' ) { 
			this.handleLostFocus();
		}
	}

	handleLostFocus( e ) { 
		saveSettings( 'viddetail', this.state.viddetail );
	}

	
	render() {
		const videoJsOptions = {
				autoplay: true,
				controls: true,
				sources: [{
					src: this.state.viddetail[this.state.selectedVideo]['videofile'],
					type: 'video/mp4'
				}]
			};

		
		return (<div className="editor_input"><br/>
					<h1>Editor</h1>
					<div style={ { display: ( this.state.selectedVideo !== null ? 'none':'block' ) } }>
						Please select a video to edit
					</div>
					<div id="video-js" style={ { display: ( this.state.selectedVideo !== null ? 'block':'none' ) } }>
					</div>
					<div className="vid_start_div">
						Video Start: <input type="text" id="video_start"
									onChange={( e ) => this.updateSettings( e, this.state.selectedVideo ) } 
									onBlur={(e) => this.handleLostFocus(e) } 
									value={ ( this.state.viddetail[ this.state.selectedVideo ] ) ? this.state.viddetail[ this.state.selectedVideo ]['video_start']: ''}  />
					</div>
					<div className="vid_end_div">
						Video End: <input type="text" id="video_end"
									onChange={( e ) => this.updateSettings( e, this.state.selectedVideo ) } 
									onBlur={(e) => this.handleLostFocus(e) } 
									value={ ( this.state.viddetail[ this.state.selectedVideo ] ) ? this.state.viddetail[ this.state.selectedVideo ]['video_end']: ''}  />
					</div>
					<div>
					<input type="checkbox" id="doneedit"
								onChange={( e ) => this.updateSettings( e, this.state.selectedVideo ) } 
								defaultChecked={ ( this.state.viddetail[ this.state.selectedVideo ] && this.state.viddetail[ this.state.selectedVideo ].doneedit === 'on' ) ? true:false }  />
								<span className="checkbox_note">I am done editing this video</span>
					</div>	
				</div>
				);
	}
}

// <video id="videoplayer" width="640" height="480" controls>
// 						 	<source src={this.state.viddetail[this.state.selectedVideo]['videofile']}/>
// 							Your browser does not support the video tag.
// 						</video>
