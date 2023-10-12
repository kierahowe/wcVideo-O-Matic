class Process extends React.Component {
	constructor( props ) { 
		super(props);
		this.doneitems = {};
		this.endit = 0;

		this.p = require('electron').remote.require('./process')
		var stat = this.p.getDetails();

		this.state = { 
			settings: getSettings( 'settings' ),
			viddetail: getSettings( 'viddetail' ),
			progress: {}, 
			currentid: stat.curid !== null ? stat.curid : null,
			interval: null,
		};
		getPresentationSettings( this.state.settings, ( t, s, d ) => { 
			this.setState( { tracks: t, speakers: s, details: d } );
		} );

		if( stat.curid !== null ) { 
			var inter = setInterval( e => { this.checkProcess(); }, 200 );
			this.setState( { interval: inter } );
		}
	}

	componentDidMount() { 
		
	}

	endProcess() { 
		if( this.state.interval !== null ) {
			this.endit = 1;
		}
	}

	killProcess() { 
		this.endProcess();
		// todo:  call out and kill the running process
	}

	checkProcess() { 
		if( this.state.currentid !== null ) {  
			var val = this.p.getDetails();
			var s = this.state.progress;
			s[ this.state.currentid ].percent = val.percent;
			s[ this.state.currentid ].state = val.status;
			this.setState( { progress: s });
			if( val.complete ) { 
				if ( val.success === true ) { 
					var vid = this.state.viddetail;
					vid[ this.state.currentid ]['doneprocess'] = true;
					vid[ this.state.currentid ]['donefile'] = val.outfile;
					saveSettings( 'viddetail', vid )
					this.setState( { viddetail: vid } );
				}
				this.doneitems[ this.state.currentid ] = 1;
				this.setState( { currentid: null } ); 
				if( this.endit === 1 ) { 
					clearInterval( this.state.interval );
					this.setState( { interval: null } );
				}
			}
		}
		if( this.endit !== 1 && this.state.currentid === null ) { 
			this.beginVideoProcess();
		}
	}

	getDetailFromID( id ) { 
		var viddetail = '';
		for( var i in this.state.details ) { 
			if( parseInt( this.state.details[i].id ) === parseInt( id ) ) { 
				viddetail = this.state.details[i];
				break;
			}
		}

		var speaker = '';
		var outfile = '';
		if( viddetail !== '' ) {
			if( viddetail.speakers ) { 
				for( let i = 0; i < viddetail.speakers.length; i ++) {
					if( this.state.speakers[ viddetail.speakers[i] ] ) { 
						if( speaker !== '' ) { speaker += ' and '; }
						speaker += this.state.speakers[ viddetail.speakers[i] ]['title']['rendered'];
					}
				}
			}

			outfile = viddetail.title.rendered;
			outfile = outfile.replace( /[^a-zA-Z0-9\_]/g, '_');
		}
		return { 'viddetail': viddetail, 'speaker': speaker, 'outfile': outfile };
	}

	startProcess( e ) {
		if( this.state.interval === null ) {
			var inter = setInterval( e => { this.checkProcess(); }, 200 );
			this.setState( { interval: inter } );
			this.doneitems = {};
		}
	}

	beginVideoProcess() { 
		var id = '';
		this.endit = 0;
		for( var key in this.state.viddetail ) { 
			console.log( key, this.state.viddetail[key], ! this.state.viddetail[key]['donefile'], this.state.viddetail[key]['doneedit'] === 'on', 
				!this.doneitems[key]);
			if ( this.state.viddetail[key] && ! this.state.viddetail[key]['doneprocess'] &&
				this.state.viddetail[key]['doneedit'] && !this.doneitems[key] ) { 
				id = key; 
				break;
			}
		}
		if( id === '' ) { 
			this.endProcess();
			if( this.doneitems.length === 0 ) { 
				alert( 'There are no videos to process');
			} else { 
				alert( 'All videos have been processed');
			}
			return;
		}

		this.setState( { currentid: id });
		var s = this.state.progress;
		s[ id ] = { percent: 0, state: 'Starting to process' };
		this.setState( { progress: s });

		var details = this.getDetailFromID( id );
		if( details['viddetail'] === '' ) { 
			alert( 'There are no details for the video');
			return;
		}

		if( ! this.state.settings['fontfile'] ) { alert( 'You must have a font set to process' ); return; }
		if( ! this.state.settings.outdir ) { alert( 'You must have a outdir set to process'); return; }
		if( ! this.state.settings.imagefile ) { alert( 'You must have a imagefile set to process'); return; }
		//if( ! this.state.settings.credits ) { alert( 'You must have a credits set to process'); return; }
		if( ! this.state.settings.tmpdir ) { alert( 'You must have a tmpdir set to process'); return; }
		if( ! this.state.settings['fontsize'] ) { alert( 'You must have a fontsize set to process'); return; }
		if( ! this.state.settings['text_y'] ) { alert( 'You must have a text_y set to process'); return; }
		if( ! this.state.settings['fontcolor'] ) { alert( 'You must have a fontcolor set to process'); return; }

		this.p.startProcess( { 
			'id': id, 
			'outputfile':  JSON.parse( this.state.settings.outdir )[0] + '/' + details['outfile'] + '.mp4', 
			'imagefile': JSON.parse( this.state.settings.imagefile ),
			'speaker': details['speaker'], 
			'title': details['viddetail'].title.rendered,
			'description': details['viddetail'].content.rendered,
			'mainvideo': this.state.viddetail[id]['tmp_file'],
			'credits': this.state.settings.credits,
			'slides': this.state.viddetail[id]['slides'],
			'tmpdir': JSON.parse( this.state.settings.tmpdir ),
			'start': this.state.viddetail[id]['video_start'],
			'end': this.state.viddetail[id]['video_end'],
			'fontfile': JSON.parse( this.state.settings['fontfile'] ), 
			'fontsize': this.state.settings['fontsize'], 
			'text_y': this.state.settings['text_y'], 
			'fontcolor': this.state.settings['fontcolor'], 
		});
	}

	render() {
		var listReady = Object.keys( this.state.viddetail).map( i => {
			var item = this.state.viddetail[i];
			if( ! this.state.details || this.state.viddetail[i]['doneedit'] !== 'on' || this.state.viddetail[i]['doneprocess'] )  { return; }

			var detail = this.getDetailFromID( i );
			return (
				<div className="pvideo_select" key={ i }
					> 
					{ detail['viddetail'].title ? detail['viddetail'].title.rendered : '' }
					{ (detail['speaker'] !== '' ) ? ' By ' + detail['speaker'] : '' }
					<div className="process_detail" style={ { display: ( typeof this.state.progress[i] !== 'undefined' ) ? 'block' : 'none' } }>
						<div className="percent">
							<div className="percentblock" style={{width:  this.state.progress[i] ? this.state.progress[i].percent : 0 }}>
								<span style={{ display: ( ( this.state.progress[i] ? this.state.progress[i].percent : 0)  >= 50 )?'inline-block':'none'}}>
									{ this.state.progress[i] ? this.state.progress[i].percent : 0 }%
								</span>&nbsp;
							</div>
							<span style={{ display: ( (this.state.progress[i] ? this.state.progress[i].percent : 0) < 50 )?'inline-block':'none'}}>
								{ this.state.progress[i] ? this.state.progress[i].percent : 0 }%
							</span>
						</div>
						<div className="status">
							{ this.state.progress[i] ? this.state.progress[i].state : '' }
						</div>
					</div>
				</div>
			);
		});

		return (<div className="process_input"><br/>
				<div className="process_controls"> 
					<i className={  this.state.interval === null ? 'fa fa-play':'fa fa-refresh fa-spin' }  aria-hidden="true" 
						title="Start Processing" 
						onClick={( e ) => this.startProcess( e )}
						></i>
					<i className="fa fa-stop" aria-hidden="true" 
						title="Stop Processing after this item" 
						onClick={( e ) => this.endProcess( e )}
						></i>
					<i className="fa fa-window-close-o" aria-hidden="true" 
						title="Stop Processing right now" 
						onClick={( e ) => { this.killProcess( e ) } }
						></i>
				</div>
				<h1>Process</h1>
				<div className="swirlwait" style={ { display: (this.state === null || this.state.details === null) ? 'block' : 'none' } }>
						Loading ...
				</div>
				<div className="list" style={ { display: (this.state !== null && this.state.details !== null) ? 'block' : 'none' } }>
					{listReady}
				</div>
			</div>
			);
	}
}