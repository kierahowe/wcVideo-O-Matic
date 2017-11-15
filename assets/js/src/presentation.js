import $ from "jquery";

class Presentations extends React.Component {
	constructor( props ) { 
		super(props);
		
		this.state = { 
			details: null,
			settings: getSettings( 'settings' ),
			speakers: null,
			tracks: null,
			curtrack: -1,
			viddetail: getSettings( 'viddetail' ),
			showsettings: null, 
		};
		getPresentationSettings( this.state.settings, ( t, s, d ) => { 
			this.setState( { tracks: t, speakers: s, details: d } );
		} );
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

	hasAllInfo( id, type ) { 
		if( type === 0 && this.state.viddetail[ id ] && ( 
				this.state.viddetail[ id ]['doneedit'] 
			) ) { 
			return 'inline-block';
		} else if( type === 1 && this.state.viddetail[ id ] && ( 
				this.state.viddetail[ id ]['novideo'] || this.state.viddetail[ id ]['donefile'] 
			) ) { 
			return 'inline-block';
		} else { 
			return 'none';
		}
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
							<div className="done_detailinfo"
								style={ { display: this.hasAllInfo( item['id'], 0 ) } }
							>
								<i className="fa fa-thumbs-o-up" aria-hidden="true"></i>
							</div>

							<div className="done_detailinfo"
								style={ { display: this.hasAllInfo( item['id'], 1 ) } }
							>
								<i className="fa fa-check" aria-hidden="true"></i>
							</div>
							
							{item['title']['rendered']}{speaker}
	
							<div className="expand_settings" onClick={( e ) => this.toggleDisplaySettings( item['id'] ) }>
								<i className="fa fa-expand" aria-hidden="true"></i>
							</div>
							<div className="video_edit"
								style={ { display: ( typeof this.state.viddetail[ item['id'] ] !== 'undefined' && 
												 this.state.viddetail[ item['id'] ]['videofile'] ) ? 'inline-block' : 'none' } }
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
								<span>Video File</span>
								<FileSelect id="videofile" onChange={( e ) => this.updateSessionSettings( e, item['id'] ) }
								 	onBlur={(e) => this.handleLostFocus(e) }
									value={ this.state.viddetail[ item['id'] ] ? this.state.viddetail[ item['id'] ]['videofile'] : '' } 
								/>								
								<span>Slide URL</span>
								<input type="text" id="slides" 
									value={ this.state.viddetail[ item['id'] ] ? this.state.viddetail[ item['id'] ]['slides'] : '' } 
									onChange={( e ) => this.updateSessionSettings( e, item['id'] ) } 
									onBlur={(e) => this.handleLostFocus(e) } />
							</div>							
						</div>
					</div>
				);
			});
		}
		return (<div className="presentation_input"><br/>
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