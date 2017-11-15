class FileSelect extends React.Component {
	constructor( props ) { 
		super(props);
		let val = props.value;
		if( typeof props.value === 'undefined' || props.value === null ) { val = ''; }
		this.state = {
			imagefile: val,
			props: props
		};
	}

	getFile( e ) {
		var dialog = require('electron').remote.dialog; 

		var args = { };
		if( this.state.props.type === 'dir' ) {
			args['properties'] = ['openDirectory'];
		}

		var self = this;
		dialog.showOpenDialog( args, file => {
			if( typeof file === 'undefined' || file.length === 0 ) { 
				return;
			}
			console.log( file );
			self.setState( { imagefile: file[0] } );

			if( self.state.props.onChange ) { 
				self.state.props.onChange( { target: { id: self.state.props.id, value: file[0] } } );
			}
			if ( self.state.props.onBlur ) {
				self.state.props.onBlur( { target: { id: self.state.props.id, value: file[0] } } );
			}
		}); 
	}

	render() {
		return (<div className="fileselect_input">
			<input type="hidden" id={ this.props.id } value={ this.state.imagefile } />
			<input type="text" readOnly id={ this.props.id + '_view' } 
				value={ ( this.state.props.type === 'dir' ) ? 
							this.state.imagefile : 
							this.state.imagefile.substr( this.state.imagefile.lastIndexOf( '/' ) + 1 ) } />
			<input type="button" id="selectImage" value="Select File" onClick={ e => { this.getFile(e); } }/>

		</div>
		);
	}
}