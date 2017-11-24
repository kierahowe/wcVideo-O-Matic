class FileSelect extends React.Component {
	constructor( props ) { 
		super(props);
		let val = props.value;
		if( typeof props.value === 'undefined' || props.value === null ) { val = '[]'; }
		
		var v;
		try {
        	v = JSON.parse(val);
		} catch (e) {
			v = null;
		}
		if( v === null ) { 
			val = JSON.stringify( [ val ] );
		}

		this.state = {
			imagefile: val,
			props: props
		};
	}

	getFile( e ) {
		var dialog = require('electron').remote.dialog; 

		var args = { properties: [] };
		if( this.state.props.type === 'dir' ) {
			args['properties'].push( 'openDirectory', 'createDirectory' );
		} else { 
			args['properties'].push( 'openFile' );
		}

		if( this.state.props.multiselect ) {
			args['properties'].push( 'multiSelections' );
		}
		
		var self = this;
		dialog.showOpenDialog( args, file => {
			if( typeof file === 'undefined' || file.length === 0 ) { 
				return;
			}
			console.log( 'files', file );
			self.setState( { imagefile: JSON.stringify( file ) } );

			if( self.state.props.onChange ) { 
				self.state.props.onChange( { target: { id: self.state.props.id, value: JSON.stringify( file ) } } );
			}
			if ( self.state.props.onBlur ) {
				self.state.props.onBlur( { target: { id: self.state.props.id, value: JSON.stringify( file ) } } );
			}
		}); 
	}
	showfiles() { 
		var files = JSON.parse( this.state.imagefile );
		if ( this.state.props.type === 'dir' ) {  
			return files[0]
		} else { 
			var val = '';
			for( var t = 0; t < files.length; t++ ) { 
				if( typeof files[t] === undefined || files[t].length === 0 ) { continue; }
				if( val !== '' ) { val += ','; }
				val += files[t].substr( files[t].lastIndexOf( '/' ) + 1 );
			}
			return val;
		}
	}

	render() {
		return (<div className="fileselect_input">
			<input type="hidden" id={ this.props.id } value={ this.state.imagefile } />
			<input type="text" readOnly id={ this.props.id + '_view' } 
				value={this.showfiles()} />
			<input type="button" id="selectImage" value="Select File" onClick={ e => { this.getFile(e); } }/>

		</div>
		);
	}
}