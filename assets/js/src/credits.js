class Credits extends React.Component {
	constructor( props ) { 
		super(props);
		this.state = {

		}
	}

	render() {
		return (<div className="credits_input"><br/>
				<h1>Credits</h1>

				<img src="http://www.kierahowe.com/resume/img/dragon-fly.gif"/>
				<h2>Kiera Howe</h2>
				<h3>Twitter: @xxowe</h3>
				<h3><a href="http://www.kierahowe.com">http://www.kierahowe.com</a></h3>
				<div>
					Kiera is a software developer who specializes in WordPress development.  
					You can see Kiera at WordCamps, but she usually has to leave her dragon at home<br/><br/>
					Feel free to reach out if you think you have something you want built.<br/><br/>
					<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
						<input type="hidden" name="cmd" value="_s-xclick"/>
						<input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----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-----END PKCS7-----"/>
						<input type="image" src="http://www.kierahowe.com/kiera-videopress.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"/>
						<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1"/>
					</form>
				</div>
			</div>
			);
	}
}