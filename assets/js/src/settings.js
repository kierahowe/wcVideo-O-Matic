class SettingsInput extends React.Component {
	constructor( props ) { 
		super(props);
		
		var set = getSettings( 'settings' );
		if ( typeof set.cats === 'undefined' ) { set.cats = []; }
		var ids = {};
		for( var i = 0; i < set.cats.length; i ++ ){ 
			ids[ set.cats[i] ] = true;
		}

		this.state = {
			settings: set,
			cats: getCategories(),
			idChecked: ids
		}

	}

	handleChange( e ) {
		var x = this.state.settings;
		x[e.target.id] = e.target.value;
		this.setState( { settings: x } );
	}

	handleLostFocus( e ) { 
		var x = this.state.settings;

		if( e.target.id === 'campURL' ) { 
			var val = this.state.settings.campURL;
			if( val.substring( 0, 7 ) !== 'http://' && val.substring( 0, 8 ) !== 'https://' ) { 
				val = 'http://' + val;
			}
			if( val.substring( val.length - 1, val.length ) !== '/' ) { 
				val = val + '/';
			}

			if( val !== this.state.settings.campURL ) { 
				x[e.target.id] = val;
				this.setState( { settings: x } );
			}
		} else {
			x[e.target.id] = e.target.value;
			this.setState( { settings: x } );
		}

		saveSettings( 'settings', this.state.settings );
	}

	handleCatChange( e ) { 
		var id = e.target.value;
		var x = this.state.idChecked;
		x[id] = e.target.checked;
		this.setState( { idChecked: x } );

		var y = this.state.settings;
		y.cats = [];
		for( var key in x ) { 
			if( x[key] ) { 
				y.cats.push( key );
			}
		}

		this.setState( { settings: y } );
		saveSettings( 'settings', this.state.settings );
	}


	listCats( cats ) { 
		if( typeof cats === 'undefined' ) { return ''; }
		var out = cats.map( item => {
			return (
				<li id={'category-' + item[0]}>
					<label className="selectit">
						<input type="checkbox" id={'chk_' + item[0]} value={item[0]} checked={ typeof this.state.idChecked[item[0]] !== 'undefined' && this.state.idChecked[item[0]] }
							onChange={( e ) => this.handleCatChange( e )} />
						{item[1]}
					</label>
					<ul>
						{ this.listCats(item[2]) }
					</ul>
				</li>
			);
		});
		return out;
	}

	render() {
		return (<div className="settings_input"><br/>
				<h1>Settings</h1>
				<table>
					<tbody>
						<tr>
							<td>Camp URL</td>
							<td><input type="text" id="campURL" value={this.state.settings.campURL} 
								onBlur={(e) => this.handleLostFocus(e) } 
								onChange={( e ) => this.handleChange( e )}/></td>
						</tr>
						<tr>
							<td>Your Name</td>
							<td><input type="text" id="upload_by" value={this.state.settings.upload_by} 
								onBlur={(e) => this.handleLostFocus(e) } 
								onChange={( e ) => this.handleChange( e )}/></td>
						</tr>
						<tr>
							<td>Your Email</td>
							<td><input type="text" id="email_addr" value={this.state.settings.email_addr} 
								onBlur={(e) => this.handleLostFocus(e) } 
								onChange={( e ) => this.handleChange( e )}/></td>
						</tr>
						<tr>
							<td>Language</td>
							<td><input type="text" id="language" value={this.state.settings.language} 
								onBlur={(e) => this.handleLostFocus(e) } 
								onChange={( e ) => this.handleChange( e )}/></td>
						</tr>
						<tr>
							<td>Category</td>
							<td>
								<div className="cats">
									<ul className="cats-checkboxes">
										{ this.listCats( this.state.cats ) } 
									</ul>
								</div>
							</td>
						</tr>

						<tr>
							<td>Producer WordPress.org Username</td>
							<td><input type="text" id="username" value={this.state.settings.username} 
								onBlur={(e) => this.handleLostFocus(e) } 
								onChange={( e ) => this.handleChange( e )}/></td>
						</tr>
						<tr>
							<td>Event</td>
							<td><input type="text" id="event" value={this.state.settings.event} 
								onBlur={(e) => this.handleLostFocus(e) } 
								onChange={( e ) => this.handleChange( e )}/></td>
						</tr>
						<tr>
							<td>Output Directory</td>
							<td>
								<FileSelect id="outdir" type="dir" value={this.state.settings.outdir} 
									onChange={(e) => this.handleLostFocus(e) } />
							</td>
						</tr>
						<tr>
							<td>Temp/Scratch Directory</td>
							<td>
								<FileSelect id="tmpdir" type="dir" value={this.state.settings.tmpdir} 
									onChange={(e) => this.handleLostFocus(e) } />
							</td>
						</tr>
						<tr>
							<td>Credits</td>
							<td><textarea id="credits" rows="6" cols="40" value={this.state.settings.credits}
								onBlur={(e) => this.handleLostFocus(e) } 
								onChange={( e ) => this.handleChange( e )}/>
							</td>
						</tr>
						<tr>
							<td>Background Image</td>
							<td>
								<FileSelect id="imagefile" value={this.state.settings.imagefile} 
									onChange={(e) => this.handleLostFocus(e) } />
							</td>
						</tr>
						<tr>
							<td>Font</td>
							<td>
								<FileSelect id="fontfile" value={this.state.settings.fontfile} 
									onChange={(e) => this.handleLostFocus(e) } />
							</td>
						</tr>
						<tr>
							<td>Font Size</td>
							<td>
								<input type="number" id="fontsize" value={this.state.settings.fontsize} 
									onBlur={(e) => this.handleLostFocus(e) } 
									onChange={( e ) => this.handleChange( e )}/>
							</td>
						</tr>
						<tr>
							<td>Font Color</td>
							<td>
								<input type="color" id="fontcolor" value={this.state.settings.fontcolor} 
									onBlur={(e) => this.handleLostFocus(e) } 
									onChange={( e ) => this.handleChange( e )}/>
							</td>
						</tr>
						<tr>
							<td>Text Y Position (0-720)</td>
							<td>
								<input type="number" id="text_y" value={this.state.settings.text_y} 
									onBlur={(e) => this.handleLostFocus(e) } 
									onChange={( e ) => this.handleChange( e )}/>
							</td>
						</tr>

					</tbody>
				</table>
			</div>
		);
	}
}




