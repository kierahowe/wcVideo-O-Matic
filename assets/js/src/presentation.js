import $ from "jquery";

class Presentations extends React.Component {
	constructor( props ) { 
		super(props);

		this.tc = require('electron').remote.require('./transcode_tmp')
		const stat = this.tc.getDetails();
		
		this.state = { 
			details: null,
			settings: getSettings( 'settings' ),
			speakers: null,
			tracks: null,
			curtrack: -1,
			viddetail: getSettings( 'viddetail' ),
			showsettings: null, 
			transStat: {},
			currentItem: stat.curid !== null ? stat.curid : null,
		};

		getPresentationSettings( this.state.settings, ( t, s, d ) => { 
			this.setState( { tracks: t, speakers: s, details: d } );
		} );

		this.inter = setInterval( e => { this.checkProcess(); }, 200 );
		this.currentOutname = '';
	}

	checkProcess() { 
		if( this.state.currentItem !== null ) { 
			const stat = this.tc.getDetails();

			if( stat.complete === true ) { 
				let vd = this.state.viddetail;
				if( stat.success ) { 
					vd[ this.state.currentItem ].tmp_file = stat.fname;
					vd[ this.state.currentItem ].processfail = false;
					vd[ this.state.currentItem ].failmessage = null;
				} else { 
					vd[ this.state.currentItem ].processfail = true;
					vd[ this.state.currentItem ].failmessage = stat.status;
				}
				console.log( 'done item ', vd[ this.state.currentItem ], stat );
				this.setState( { viddetail: vd, currentItem: null } );
				saveSettings( 'viddetail', vd );
			}
			this.setState( { transStat: stat } );

			return; 
		}		
		
		for( var vid in this.state.viddetail ) { 
			if( typeof this.state.viddetail[ vid ].videofile !== 'undefined' && 
				this.state.viddetail[ vid ].videofile !== '' && 
				! this.state.viddetail[ vid ].processfail && 
				typeof this.state.viddetail[ vid ].tmp_file === 'undefined' && 
				! this.state.viddetail[ vid ].novideo 
				) { 
				
				this.currentOutname = '';
				if( typeof this.state.settings.tmpdir === 'undefined' || this.state.settings.tmpdir === null || this.state.settings.tmpdir === '' ) { 
					this.currentOutname = '.';
				} else { 
					this.currentOutname = this.state.settings.tmpdir;
				}
				this.currentOutname += '/' + this.state.viddetail[ vid ].videofile.replace( /[^a-zA-Z0-9\_]/g, '_') + '.mp4';
				this.setState( { currentItem: parseInt( vid ) } );

				this.tc.transcode( this.state.viddetail[ vid ].videofile, this.currentOutname, vid );
				break;
			}
		}
	}

	componentWillUnmount() {
		clearInterval( this.inter );
	}

	changeTrack( e ) { 
		const id = e.target.getAttribute('data-reactid').split( '$' )[1];
		this.setState( { curtrack: id } );
	}

	headColor( id ) { 
		if(  this.state === null ) { return 'transparent'; }
		if ( parseInt( this.state.curtrack ) === id ) { 
			return 'grey';
		}
		return 'transparent';
	}

	getDateInfo( last, item ) { 
		var data = ''; 
		var d = new Date();
		var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

		if( this.state.curtrack != -1 ) { return ''; }
		if ( last === null || last.meta._wcpt_session_time !== item.meta._wcpt_session_time ) { 
			var date = new Date( ( item.meta._wcpt_session_time + d.getTimezoneOffset() * 60 ) * 1000);
			if( last === null ) { 
				data = <div>{days[ date.getDay() ]}</div>
			} else { 
				var lastdate = new Date( ( last.meta._wcpt_session_time + d.getTimezoneOffset() * 60 ) * 1000);
				if( lastdate.getDay() !== date.getDay() ) { 
					data = <div>{days[ date.getDay() ]}</div>
				}
			}
			data = <div className="datefield">
					{data}
					<div className="timefield">
						{date.getHours()}:{ ( (date.getMinutes() < 10 ) ? '0':'' ) + date.getMinutes()}
					</div>
				</div>
		}

		return data;
	}

	toggleDisplaySettings( id ) {
		if( this.state.showsettings === id ) { 
			id = null;
		}
		this.setState( { showsettings: id });
	}

	updateSessionSettings( e, id ) { 
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

	openVideo( id ) { 
		 selectedVideo = id;
		 $( '#editor' ).click();
	}

	handleLostFocus( e ) { 
		saveSettings( 'viddetail', this.state.viddetail );
	}

	iconout( id ) { 
		if ( typeof this.state.viddetail[ id ] === 'undefined' ||  this.state.viddetail[ id ] === null ) { 
			return '';
		}

		if( parseInt( this.state.currentItem ) === parseInt( id ) ) { 
			return 'fa-spinner fa-spin'
		} else if ( this.state.viddetail[ id ]['novideo'] || this.state.viddetail[ id ]['donefile'] ) {
			return 'fa-check';
		} else if ( this.state.viddetail[ id ]['doneedit'] ) { 
			return 'fa-thumbs-o-up';
		} else if ( this.state.viddetail[ id ]['tmp_file'] ) {
			return 'fa-pencil';
		} else if ( this.state.viddetail[ id ]['processfail'] ) {
			return 'fa-times';
		} else if ( this.state.viddetail[ id ]['videofile'] ) {
			return 'fa-clock-o';
		} else { 
			return 'fa-question';
		}
	}

	clearItem( id ) { 
		let vd = this.state.viddetail;
		let x = vd[id];
		delete x.tmp_file;
		delete x.processfail;
		delete x.failmessage;
		delete x.doneedit;
		vd[id] = x;
		this.setState( { viddetail: vd } );
		saveSettings( 'viddetail', vd );
	}

	render() {
		if( this.state.tracks ) {
			var listTracks = this.state.tracks.map( item => {
				return (
					<div className="track_select" key={item['id']}
						style={ { backgroundColor: this.headColor( item['id'] ) } }
						onClick={( e ) => this.changeTrack( e )}
						> 
						{item['name']}
					</div>
				);
			});
		}
		var DisplayStatus = item => { return ( <div className="status"></div> ); };
		if( this.state && this.state.currentItem !== null && typeof this.state.details !== 'undefined') {
			var item = null;
			for( var i in this.state.details ) { 
				if( parseInt( this.state.details[i].id ) === parseInt( this.state.currentItem ) )  { 
					item = this.state.details[i];
					break;
				}
			}
			if( item !== null ) { 
				DisplayStatus = i => { return (
						<div className="status">
							<span className="statusdet">{ item['title']['rendered']}</span>
							<span className="statusdet">% Complete: { this.state.transStat.percent }%</span>
						</div>
					); 
				};
			}
		}

		if( this.state.details ) {
			var last = null;
			var listItems = this.state.details.map( item => {
				let speaker = '';
				for( let i = 0; i < item.speakers.length; i ++) {
					if( this.state.speakers[ item.speakers[i] ] ) { 
						if( speaker !== '' ) { speaker += ' and '; }
						speaker += this.state.speakers[ item.speakers[i] ]['title']['rendered'];
					}
				}
				if( speaker !== '' ) { speaker = ' by ' + speaker; }
					
				var data = this.getDateInfo( last, item );
				last = item;
				return (
					<div key={item['id'] + '_parent'}>
						{ data }
						<div className="session_item" key={item['id']}
							style={ { display: ( parseInt( this.state.curtrack ) === -1 || 
									  item.session_track.indexOf( parseInt( this.state.curtrack ) ) != -1 ) ? 'inline-block' : 'none' } }
							> 
							<div className="done_detailinfo">
								<i className={'fa ' + this.iconout(item['id'])} aria-hidden="true"></i>
							</div>
							
						
							{item['title']['rendered']}{speaker}
	
							<div className="expand_settings" onClick={( e ) => this.toggleDisplaySettings( item['id'] ) }>
								<i className="fa fa-expand" aria-hidden="true"></i>
							</div>
							<div className="video_edit"
								style={ { display: ( typeof this.state.viddetail[ item['id'] ] !== 'undefined' && 
												 this.state.viddetail[ item['id'] ]['tmp_file'] ) ? 'inline-block' : 'none' } }
								onClick={( e ) => this.openVideo( item['id'] ) }
								>
								Edit Video
							</div>
						</div>
						<div className="session_settings" style={ { display: ( this.state.showsettings === item['id'] ) ? 'block' : 'none' } }>
							<input type="checkbox" id="novideo" 
								onChange={( e ) => this.updateSessionSettings( e, item['id'] ) } 
								defaultChecked={ ( this.state.viddetail[ item['id'] ] && this.state.viddetail[ item['id'] ].novideo === 'on' ) ? true:false }  />
								<span className="checkbox_note">This presentation has no video</span>
							<div style={ { display: ( !this.state.viddetail[ item['id'] ] || !this.state.viddetail[ item['id'] ]['novideo'] ) ? 'block' : 'none' } }>
								<input type="checkbox" id="keynote" 
									onChange={( e ) => this.updateSessionSettings( e, item['id'] ) } 
									defaultChecked={ ( this.state.viddetail[ item['id'] ] && this.state.viddetail[ item['id'] ].keynote === 'on' ) ? true:false }  />
									<span className="checkbox_note">This is a keynote</span>
								
								<span>Video File</span>
								<FileSelect id="videofile" onChange={( e ) => this.updateSessionSettings( e, item['id'] ) }
								 	onBlur={(e) => this.handleLostFocus(e) }
									value={ this.state.viddetail[ item['id'] ] ? this.state.viddetail[ item['id'] ]['videofile'] : [] } 
									multiselect
								/>								
								<span>Slide URL</span>
								<input type="text" id="slides" 
									value={ this.state.viddetail[ item['id'] ] ? this.state.viddetail[ item['id'] ]['slides'] : '' } 
									onChange={( e ) => this.updateSessionSettings( e, item['id'] ) } 
									onBlur={(e) => this.handleLostFocus(e) } />
								<button onClick={(e) => this.clearItem( item['id'] )}>Clear Processed Video</button>
								<span className="error">
									{ this.state.viddetail[ item['id'] ] && this.state.viddetail[ item['id'] ]['failmessage'] ? 
										this.state.viddetail[ item['id'] ]['failmessage'] : '' }
								</span>
							</div>							
						</div>
					</div>
				);
			});
		}
		return (<div className="presentation_input"><br/>
					<DisplayStatus/>
					<h1>Presentations</h1>
					<div className="swirlwait" style={ { display: (this.state === null || this.state.details === null) ? 'block' : 'none' } }>
						Loading ...
					</div>
					<div className="list" style={ { display: (this.state !== null && this.state.details !== null) ? 'block' : 'none' } }>
						<div>
							<div className="track_select" key="-1" 
								style={ { backgroundColor: this.headColor( -1 ) } }
								onClick={( e ) => this.changeTrack( e )}
								> 
								All
							</div>
							{listTracks}
							<div className="track_select" key="-2" 
								style={ { backgroundColor: this.headColor( -2 ) } }
								onClick={( e ) => this.changeTrack( e )}
								> 
								Missing Info
							</div>
						</div>
						<div className="session_list">
							{listItems}
						</div>
					</div>
				</div>
				);
	}

}