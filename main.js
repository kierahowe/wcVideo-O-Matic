
global.CURRENTVERSION = '0.1.0';

var app = require('electron').app; // Module to control application life.
var BrowserWindow = require('electron').BrowserWindow;  // Module to create native browser window.

/*  When ready */
app.on('ready', function() {  
	openNewWindow ('index.html', { devTools: true });   //devTools: true 
} );


function openNewWindow (url, position, data) { 
	// Loads new window
	// 

	console.log ("new window load:", position);

	if (typeof position === 'undefined') { 
		data = url[2];
		position = url[1];
		url = url[0];
	}


	if (url.substring(0, 7) != "file://" && 
	  url.substring(0, 7) != "http://" && 
	  url.substring(0, 8) != "https://") { 
		url = 'file://' + __dirname + '/' + url;
	}

	var atomScreen = require('electron').screen;
	var displist = atomScreen.getAllDisplays();
	// Create the browser window.

	var pridisp = null;
	if (displist.length > 1) { 
		for (var i = 0; i < displist.length; i ++) { 
		  pridisp = displist[i];
		}
	} else { 
		pridisp = displist[0];
	}


	if (position.width == null) { position.width = pridisp.size.width *.8; }
	if (position.height == null) { position.height = pridisp.size.height *.8; }

	var args = { width: position.width, height: position.height};

	mainWindow = new BrowserWindow(args);
	mainWindow.once('ready-to-show', function () {  
		mainWindow.show();
	});

	if (position.devTools) { 
		mainWindow.openDevTools();
	}

	var bounds = {width: position.width, height: position.height};
	var flg = 0;
	if (position.x != null && typeof position.x != 'undefined' ) { bounds.x = position.x; flg = 1; }
	if (position.y != null && typeof position.y != 'undefined' ) { bounds.y = position.y; flg = 1; }

	if (position.center) { 
		bounds.x = pridisp.size.width / 2 - position.width / 2;
		bounds.y = pridisp.size.height / 2 - position.height / 2;
		flg = 1;
	}

	if (position.dock == 'right') { 
		bounds.height = pridisp.size.height
		bounds.y = 0;
		bounds.x = pridisp.size.width - args.width; 
		flg = 1;
	}

	if (flg == 1) {
		mainWindow.setBounds (bounds);
	}
	if (position.max == true) { 
		mainWindow.maximize();
	}

	if (position.alwaysOnTop) { 
		mainWindow.setAlwaysOnTop(position.alwaysOnTop);
	}

	mainWindow.dataInput = data;

	mainWindow.loadURL(url);
	mainWindow.on('closed', closeWindow);

	return 1;
}

function closeWindow () {
	
}

