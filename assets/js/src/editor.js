import videojs from 'video.js'

class Editor extends React.Component {
	constructor( props ) { 
		super(props);
		this.state = { 
			settings: getSettings( 'settings' ), 
			viddetail: getSettings( 'viddetail' ),
			selectedVideo: selectedVideo
		};
	}

	componentDidMount() { 
		this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
	      console.log('onPlayerReady', this)
	    });
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
					<div style={ { display: ( this.state.selectedVideo !== null ? 'block':'none' ) } }>
						<VideoPlayer id="canvas"/>
					</div>
					<input type="checkbox" id="doneedit" 
								onChange={( e ) => this.updateSettings( e, this.state.selectedVideo ) } 
								defaultChecked={ ( this.state.viddetail[ this.state.selectedVideo ] && this.state.viddetail[ this.state.selectedVideo ].doneedit === 'on' ) ? true:false }  />
								<span className="checkbox_note">I am done editing this video</span>
							
				</div>
				);
	}
}

// <video id="videoplayer" width="640" height="480" controls>
// 						 	<source src={this.state.viddetail[this.state.selectedVideo]['videofile']}/>
// 							Your browser does not support the video tag.
// 						</video>

class VideoPlayer extends React.Component {
	componentDidMount() {
		// instantiate video.js
		this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
			console.log('onPlayerReady', this)
		});
	}

	// destroy player on unmount
	componentWillUnmount() {
		if (this.player) {
			this.player.dispose()
		}
	}

	// wrap the player in a div with a `data-vjs-player` attribute
	// so videojs won't create additional wrapper in the DOM
	// see https://github.com/videojs/video.js/pull/3856
	render() {
		return (
			<div data-vjs-player>
				<video ref={ node => this.videoNode = node } className="video-js"></video>
			</div>
		)
	}
}