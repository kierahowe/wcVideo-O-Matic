'use strict';

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _video = require('video.js');

var _video2 = _interopRequireDefault(_video);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.runType = 'renderer';

var remote = require('electron').remote;
var dataInput = remote.getCurrentWindow().dataInput;
var selectedVideo = null;
var cached = {};

addCss();

function addCss() {
	// Load in the CSS from the theme or the base
	var link = document.createElement("link");
	link.href = 'style.css';
	link.type = "text/css";
	link.rel = "stylesheet";
	link.media = "screen,print";
	document.getElementsByTagName("head")[0].appendChild(link);

	// Load in the CSS from the theme or the base
	var link = document.createElement("link");
	link.href = 'fontawesome/css/font-awesome.css';
	link.type = "text/css";
	link.rel = "stylesheet";
	link.media = "screen,print";
	document.getElementsByTagName("head")[0].appendChild(link);

	// Load in the CSS for the video player
	var link = document.createElement("link");
	link.href = 'node_modules/video.js/dist/video-js.css';
	link.type = "text/css";
	link.rel = "stylesheet";
	link.media = "screen,print";
	document.getElementsByTagName("head")[0].appendChild(link);
}

(0, _jquery2.default)(document).ready(function () {
	(0, _jquery2.default)('#settings').click(function (e) {
		setSelected(e.target);
		ReactDOM.render(React.createElement(SettingsInput, null), document.getElementById('mainarea'));
	});
	(0, _jquery2.default)('#presentations').click(function (e) {
		setSelected(e.target);
		ReactDOM.render(React.createElement(Presentations, null), document.getElementById('mainarea'));
	});
	(0, _jquery2.default)('#editor').click(function (e) {
		setSelected(e.target);
		ReactDOM.render(React.createElement(Editor, null), document.getElementById('mainarea'));
	});
	(0, _jquery2.default)('#process').click(function (e) {
		setSelected(e.target);
		ReactDOM.render(React.createElement(Process, null), document.getElementById('mainarea'));
	});
	(0, _jquery2.default)('#upload').click(function (e) {
		setSelected(e.target);
		ReactDOM.render(React.createElement(Upload, null), document.getElementById('mainarea'));
	});

	(0, _jquery2.default)('#credits').click(function (e) {
		setSelected(e.target);
		ReactDOM.render(React.createElement(Credits, null), document.getElementById('mainarea'));
	});

	(0, _jquery2.default)('#settings').click();
});

function setSelected(target) {
	(0, _jquery2.default)('.menu-item').each(function (i, item) {
		if (item.id === target.id || target.parentNode.id === item.id) {
			(0, _jquery2.default)(item).addClass('selected');
		} else {
			(0, _jquery2.default)(item).removeClass('selected');
		}
	});
}

function getSettings(key) {
	var fs = require('fs');

	if (fs.existsSync('settings.json')) {
		var contents = fs.readFileSync("settings.json");
		try {
			contents = JSON.parse(contents);
		} catch (e) {
			return {};
		}
		if (key === '') {
			return contents;
		} else {
			if (typeof contents[key] === 'undefined') {
				return {};
			} else {
				return contents[key];
			}
		}
	} else {
		fs.writeFile('settings.json', JSON.stringify({}), function () {});
		return {};
	}
}

function saveSettings(key, settings) {
	var fs = require('fs');

	var s = getSettings('');
	s[key] = settings;

	fs.writeFile('settings.json', JSON.stringify(s), function () {});
}

function getRemoteContent(settings, type, callback) {
	//setTimeout( function() { callback( { x: 'y', z: 'zz' });  }, 1000 );
	var url = settings.campURL + 'wp-json/wp/v2/' + type + '?per_page=100';
	if (cached[url]) {
		setTimeout(function (i) {
			callback(cached[url]);
		}, 20);
		return;
	}
	_jquery2.default.ajax(url, {}).done(function (result) {
		cached[url] = result;
		callback(result);
	}).fail(function () {
		alert('Failed to access site at ' + url);
	});
}

function getPresentationSettings(settings, callback) {
	getRemoteContent(settings, 'session_track', function (t) {
		var tracks = t;

		getRemoteContent(settings, 'speakers', function (u) {
			var s = {};
			for (var i = 0; i < u.length; i++) {
				s[u[i]['id']] = u[i];
			}

			var speakers = s;

			getRemoteContent(settings, 'sessions', function (d) {
				for (var _i = 0; _i < d.length; _i++) {
					var p = [];
					if (typeof d[_i]._links.speakers !== 'undefined' && d[_i]._links.speakers !== null) {
						for (var n = 0; n < d[_i]._links.speakers.length; n++) {
							var snum = d[_i]._links.speakers[n].href;
							snum = parseInt(snum.substring(snum.lastIndexOf('/') + 1));
							p.push(snum);
						}
					}
					d[_i].speakers = p;

					d[_i].title.rendered = decodeHTML(d[_i].title.rendered);
					d[_i].content.rendered = decodeHTML(d[_i].content.rendered);
				}
				d.sort(function (a, b) {
					if (a.meta._wcpt_session_time === b.meta._wcpt_session_time) {
						return 0;
					}
					return a.meta._wcpt_session_time - b.meta._wcpt_session_time;
				});

				callback(tracks, speakers, d);
			});
		});
	});
}

// The goal here is to eventually load the cats from the remote server at wordpress.tv, however, 
// right now we are just going to always load from the default_cats.json file
function getCategories() {
	var fs = require('fs');
	var cats = getSettings('cats');

	if (1 || typeof cats === 'undefined' || typeof cats.length === 'undefined' || cats.length === 0) {
		if (fs.existsSync('default_cats.json')) {
			cats = fs.readFileSync("default_cats.json");
			try {
				cats = JSON.parse(cats);
			} catch (e) {
				return [];
			}

			saveSettings('cats', cats);
		}
	}

	return cats;
}

function decodeHTML(instr) {
	var entities = {
		'amp': '&',
		'apos': '’',
		'lt': '<',
		'gt': '>',
		'quot': '"',
		'nbsp': '\xa0',
		'#8212': '-',
		'#8211': '-',
		'#8217': '’',
		'#8230': '...',
		'#8216': '‘',
		'#8218': '‚',
		'#8220': '“',
		'#8221': '”',
		'#8222': '„',
		'#8224': '†',
		'#8225': '‡',
		'#8226': '•',
		'#8240': '‰',
		'#8364': '€',
		'#8482': '™'
	};
	var entityPattern = /&([^;]+);/ig;

	return instr.replace(entityPattern, function (match, entity) {
		entity = entity.toLowerCase();
		if (entities.hasOwnProperty(entity)) {
			return entities[entity];
		}
		if (entity[0] === '#') {
			return String.fromCharCode(parseInt(entity.substring(1), 16));
		}
		// return original string if there is no matching entity (no replace)
		return match;
	});
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SettingsInput = function (_React$Component) {
	_inherits(SettingsInput, _React$Component);

	function SettingsInput(props) {
		_classCallCheck(this, SettingsInput);

		var _this = _possibleConstructorReturn(this, (SettingsInput.__proto__ || Object.getPrototypeOf(SettingsInput)).call(this, props));

		var set = getSettings('settings');
		if (typeof set.cats === 'undefined') {
			set.cats = [];
		}
		var ids = {};
		for (var i = 0; i < set.cats.length; i++) {
			ids[set.cats[i]] = true;
		}

		_this.state = {
			settings: set,
			cats: getCategories(),
			idChecked: ids
		};

		return _this;
	}

	_createClass(SettingsInput, [{
		key: 'handleChange',
		value: function handleChange(e) {
			var x = this.state.settings;
			x[e.target.id] = e.target.value;
			this.setState({ settings: x });
		}
	}, {
		key: 'handleLostFocus',
		value: function handleLostFocus(e) {
			var x = this.state.settings;

			if (e.target.id === 'campURL') {
				var val = this.state.settings.campURL;
				if (val.substring(0, 7) !== 'http://' && val.substring(0, 8) !== 'https://') {
					val = 'http://' + val;
				}
				if (val.substring(val.length - 1, val.length) !== '/') {
					val = val + '/';
				}

				if (val !== this.state.settings.campURL) {
					x[e.target.id] = val;
					this.setState({ settings: x });
				}
			} else {
				x[e.target.id] = e.target.value;
				this.setState({ settings: x });
			}

			saveSettings('settings', this.state.settings);
		}
	}, {
		key: 'handleCatChange',
		value: function handleCatChange(e) {
			var id = e.target.value;
			var x = this.state.idChecked;
			x[id] = e.target.checked;
			this.setState({ idChecked: x });

			var y = this.state.settings;
			y.cats = [];
			for (var key in x) {
				if (x[key]) {
					y.cats.push(key);
				}
			}

			this.setState({ settings: y });
			saveSettings('settings', this.state.settings);
		}
	}, {
		key: 'listCats',
		value: function listCats(cats) {
			var _this2 = this;

			if (typeof cats === 'undefined') {
				return '';
			}
			var out = cats.map(function (item) {
				return React.createElement(
					'li',
					{ id: 'category-' + item[0] },
					React.createElement(
						'label',
						{ className: 'selectit' },
						React.createElement('input', { type: 'checkbox', id: 'chk_' + item[0], value: item[0], checked: typeof _this2.state.idChecked[item[0]] !== 'undefined' && _this2.state.idChecked[item[0]],
							onChange: function onChange(e) {
								return _this2.handleCatChange(e);
							} }),
						item[1]
					),
					React.createElement(
						'ul',
						null,
						_this2.listCats(item[2])
					)
				);
			});
			return out;
		}
	}, {
		key: 'render',
		value: function render() {
			var _this3 = this;

			return React.createElement(
				'div',
				{ className: 'settings_input' },
				React.createElement('br', null),
				React.createElement(
					'h1',
					null,
					'Settings'
				),
				React.createElement(
					'table',
					null,
					React.createElement(
						'tbody',
						null,
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Camp URL'
							),
							React.createElement(
								'td',
								null,
								React.createElement('input', { type: 'text', id: 'campURL', value: this.state.settings.campURL,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Language'
							),
							React.createElement(
								'td',
								null,
								React.createElement('input', { type: 'text', id: 'language', value: this.state.settings.language,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Category'
							),
							React.createElement(
								'td',
								null,
								React.createElement(
									'div',
									{ className: 'cats' },
									React.createElement(
										'ul',
										{ className: 'cats-checkboxes' },
										this.listCats(this.state.cats)
									)
								)
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Producer WordPress.org Username'
							),
							React.createElement(
								'td',
								null,
								React.createElement('input', { type: 'text', id: 'username', value: this.state.settings.username,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Event'
							),
							React.createElement(
								'td',
								null,
								React.createElement('input', { type: 'text', id: 'event', value: this.state.settings.event,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Output Directory'
							),
							React.createElement(
								'td',
								null,
								React.createElement(FileSelect, { id: 'outdir', type: 'dir', value: this.state.settings.outdir,
									onChange: function onChange(e) {
										return _this3.handleLostFocus(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Temp/Scratch Directory'
							),
							React.createElement(
								'td',
								null,
								React.createElement(FileSelect, { id: 'tmpdir', type: 'dir', value: this.state.settings.tmpdir,
									onChange: function onChange(e) {
										return _this3.handleLostFocus(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Credits'
							),
							React.createElement(
								'td',
								null,
								React.createElement('textarea', { id: 'credits', rows: '6', cols: '40', value: this.state.settings.credits,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Background Image'
							),
							React.createElement(
								'td',
								null,
								React.createElement(FileSelect, { id: 'imagefile', value: this.state.settings.imagefile,
									onChange: function onChange(e) {
										return _this3.handleLostFocus(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Font'
							),
							React.createElement(
								'td',
								null,
								React.createElement(FileSelect, { id: 'fontfile', value: this.state.settings.fontfile,
									onChange: function onChange(e) {
										return _this3.handleLostFocus(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Font Size'
							),
							React.createElement(
								'td',
								null,
								React.createElement('input', { type: 'number', id: 'fontsize', value: this.state.settings.fontsize,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Font Color'
							),
							React.createElement(
								'td',
								null,
								React.createElement('input', { type: 'color', id: 'fontcolor', value: this.state.settings.fontcolor,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						),
						React.createElement(
							'tr',
							null,
							React.createElement(
								'td',
								null,
								'Text Y Position (0-720)'
							),
							React.createElement(
								'td',
								null,
								React.createElement('input', { type: 'number', id: 'text_y', value: this.state.settings.text_y,
									onBlur: function onBlur(e) {
										return _this3.handleLostFocus(e);
									},
									onChange: function onChange(e) {
										return _this3.handleChange(e);
									} })
							)
						)
					)
				)
			);
		}
	}]);

	return SettingsInput;
}(React.Component);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Presentations = function (_React$Component) {
	_inherits(Presentations, _React$Component);

	function Presentations(props) {
		_classCallCheck(this, Presentations);

		var _this = _possibleConstructorReturn(this, (Presentations.__proto__ || Object.getPrototypeOf(Presentations)).call(this, props));

		_this.tc = require('electron').remote.require('./transcode_tmp');
		var stat = _this.tc.getDetails();

		_this.state = {
			details: null,
			settings: getSettings('settings'),
			speakers: null,
			tracks: null,
			curtrack: -1,
			viddetail: getSettings('viddetail'),
			showsettings: null,
			transStat: {},
			currentItem: stat.curid !== null ? stat.curid : null
		};

		getPresentationSettings(_this.state.settings, function (t, s, d) {
			_this.setState({ tracks: t, speakers: s, details: d });
		});

		_this.inter = setInterval(function (e) {
			_this.checkProcess();
		}, 200);
		_this.currentOutname = '';
		return _this;
	}

	_createClass(Presentations, [{
		key: 'checkProcess',
		value: function checkProcess() {
			if (this.state.currentItem !== null) {
				var stat = this.tc.getDetails();

				if (stat.complete === true) {
					var vd = this.state.viddetail;
					if (stat.success) {
						vd[this.state.currentItem].tmp_file = stat.fname;
						vd[this.state.currentItem].processfail = false;
						vd[this.state.currentItem].failmessage = null;
					} else {
						vd[this.state.currentItem].processfail = true;
						vd[this.state.currentItem].failmessage = stat.status;
					}
					console.log('done item ', vd[this.state.currentItem], stat);
					this.setState({ viddetail: vd, currentItem: null });
					saveSettings('viddetail', vd);
				}
				this.setState({ transStat: stat });

				return;
			}

			for (var vid in this.state.viddetail) {
				if (typeof this.state.viddetail[vid].videofile !== 'undefined' && this.state.viddetail[vid].videofile !== '' && !this.state.viddetail[vid].processfail && typeof this.state.viddetail[vid].tmp_file === 'undefined' && !this.state.viddetail[vid].novideo) {

					this.currentOutname = '';
					if (typeof this.state.settings.tmpdir === 'undefined' || this.state.settings.tmpdir === null || this.state.settings.tmpdir === '') {
						this.currentOutname = '.';
					} else {
						this.currentOutname = JSON.parse(this.state.settings.tmpdir)[0];
					}
					this.currentOutname += '/' + this.state.viddetail[vid].videofile.replace(/[^a-zA-Z0-9\_]/g, '_') + '.mp4';
					this.setState({ currentItem: parseInt(vid) });

					this.tc.transcode(this.state.viddetail[vid].videofile, this.currentOutname, vid);
					break;
				}
			}
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			clearInterval(this.inter);
		}
	}, {
		key: 'changeTrack',
		value: function changeTrack(e) {
			var id = e.target.getAttribute('data-reactid').split('$')[1];
			this.setState({ curtrack: id });
		}
	}, {
		key: 'headColor',
		value: function headColor(id) {
			if (this.state === null) {
				return 'transparent';
			}
			if (parseInt(this.state.curtrack) === id) {
				return 'grey';
			}
			return 'transparent';
		}
	}, {
		key: 'getDateInfo',
		value: function getDateInfo(last, item) {
			var data = '';
			var d = new Date();
			var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

			if (this.state.curtrack != -1) {
				return '';
			}
			if (last === null || last.meta._wcpt_session_time !== item.meta._wcpt_session_time) {
				var date = new Date((item.meta._wcpt_session_time + d.getTimezoneOffset() * 60) * 1000);
				if (last === null) {
					data = React.createElement(
						'div',
						null,
						days[date.getDay()]
					);
				} else {
					var lastdate = new Date((last.meta._wcpt_session_time + d.getTimezoneOffset() * 60) * 1000);
					if (lastdate.getDay() !== date.getDay()) {
						data = React.createElement(
							'div',
							null,
							days[date.getDay()]
						);
					}
				}
				data = React.createElement(
					'div',
					{ className: 'datefield' },
					data,
					React.createElement(
						'div',
						{ className: 'timefield' },
						date.getHours(),
						':',
						(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
					)
				);
			}

			return data;
		}
	}, {
		key: 'toggleDisplaySettings',
		value: function toggleDisplaySettings(id) {
			if (this.state.showsettings === id) {
				id = null;
			}
			this.setState({ showsettings: id });
		}
	}, {
		key: 'updateSessionSettings',
		value: function updateSessionSettings(e, id) {
			var x = this.state.viddetail;
			if (typeof x[id] === 'undefined') {
				x[id] = {};
			}
			var val = e.target.value;
			if (e.target.type === 'checkbox') {
				if (e.target.checked) {
					val = 'on';
				} else {
					val = '';
				}
			}
			x[id][e.target.id] = val;
			this.setState({ viddetail: x });

			if (e.target.type === 'checkbox') {
				this.handleLostFocus();
			}
		}
	}, {
		key: 'openVideo',
		value: function openVideo(id) {
			selectedVideo = id;
			(0, _jquery2.default)('#editor').click();
		}
	}, {
		key: 'handleLostFocus',
		value: function handleLostFocus(e) {
			saveSettings('viddetail', this.state.viddetail);
		}
	}, {
		key: 'iconout',
		value: function iconout(id) {
			if (typeof this.state.viddetail[id] === 'undefined' || this.state.viddetail[id] === null) {
				return '';
			}

			if (parseInt(this.state.currentItem) === parseInt(id)) {
				return 'fa-spinner fa-spin';
			} else if (this.state.viddetail[id]['novideo'] || this.state.viddetail[id]['doneupload']) {
				return 'fa-check';
			} else if (this.state.viddetail[id]['doneprocess']) {
				return 'fa-cloud-upload';
			} else if (this.state.viddetail[id]['doneedit']) {
				return 'fa-thumbs-o-up';
			} else if (this.state.viddetail[id]['tmp_file']) {
				return 'fa-pencil';
			} else if (this.state.viddetail[id]['processfail']) {
				return 'fa-times';
			} else if (this.state.viddetail[id]['videofile']) {
				return 'fa-clock-o';
			} else {
				return 'fa-question';
			}
		}
	}, {
		key: 'clearItem',
		value: function clearItem(id) {
			var vd = this.state.viddetail;
			var x = vd[id];
			delete x.tmp_file;
			delete x.processfail;
			delete x.failmessage;
			delete x.doneedit;
			vd[id] = x;
			this.setState({ viddetail: vd });
			saveSettings('viddetail', vd);
		}
	}, {
		key: 'clearItemProcessed',
		value: function clearItemProcessed(id) {
			console.log('clear', id);
			var vd = this.state.viddetail;
			var x = vd[id];
			delete x.doneupload;
			delete x.doneprocess;
			vd[id] = x;
			this.setState({ viddetail: vd });
			saveSettings('viddetail', vd);
		}
	}, {
		key: 'clearItemUpload',
		value: function clearItemUpload(id) {
			console.log('clear', id);
			var vd = this.state.viddetail;
			var x = vd[id];
			delete x.doneupload;
			delete x.failedupload;
			delete x.returnout;
			vd[id] = x;
			this.setState({ viddetail: vd });
			saveSettings('viddetail', vd);
		}
	}, {
		key: 'render',
		value: function render() {
			var _this2 = this;

			if (this.state.tracks) {
				var listTracks = this.state.tracks.map(function (item) {
					return React.createElement(
						'div',
						{ className: 'track_select', key: item['id'],
							style: { backgroundColor: _this2.headColor(item['id']) },
							onClick: function onClick(e) {
								return _this2.changeTrack(e);
							}
						},
						item['name']
					);
				});
			}
			var DisplayStatus = function DisplayStatus(item) {
				return React.createElement('div', { className: 'status' });
			};
			if (this.state && this.state.currentItem !== null && typeof this.state.details !== 'undefined') {
				var item = null;
				for (var i in this.state.details) {
					if (parseInt(this.state.details[i].id) === parseInt(this.state.currentItem)) {
						item = this.state.details[i];
						break;
					}
				}
				if (item !== null) {
					DisplayStatus = function DisplayStatus(i) {
						return React.createElement(
							'div',
							{ className: 'status' },
							React.createElement(
								'span',
								{ className: 'statusdet' },
								item['title']['rendered']
							),
							React.createElement(
								'span',
								{ className: 'statusdet' },
								'% Complete: ',
								_this2.state.transStat.percent,
								'%'
							)
						);
					};
				}
			}

			if (this.state.details) {
				var last = null;
				var listItems = this.state.details.map(function (item) {
					var speaker = '';
					for (var _i = 0; _i < item.speakers.length; _i++) {
						if (_this2.state.speakers[item.speakers[_i]]) {
							if (speaker !== '') {
								speaker += ' and ';
							}
							speaker += _this2.state.speakers[item.speakers[_i]]['title']['rendered'];
						}
					}
					if (speaker !== '') {
						speaker = ' by ' + speaker;
					}

					var data = _this2.getDateInfo(last, item);
					last = item;
					return React.createElement(
						'div',
						{ key: item['id'] + '_parent' },
						data,
						React.createElement(
							'div',
							{ className: 'session_item', key: item['id'],
								style: { display: parseInt(_this2.state.curtrack) === -1 || item.session_track.indexOf(parseInt(_this2.state.curtrack)) != -1 ? 'inline-block' : 'none' }
							},
							React.createElement(
								'div',
								{ className: 'done_detailinfo' },
								React.createElement('i', { className: 'fa ' + _this2.iconout(item['id']), 'aria-hidden': 'true' })
							),
							item['title']['rendered'],
							speaker,
							' \u2019',
							React.createElement(
								'div',
								{ className: 'expand_settings', onClick: function onClick(e) {
										return _this2.toggleDisplaySettings(item['id']);
									} },
								React.createElement('i', { className: 'fa fa-expand', 'aria-hidden': 'true' })
							),
							React.createElement(
								'div',
								{ className: 'video_edit',
									style: { display: typeof _this2.state.viddetail[item['id']] !== 'undefined' && _this2.state.viddetail[item['id']]['tmp_file'] ? 'inline-block' : 'none' },
									onClick: function onClick(e) {
										return _this2.openVideo(item['id']);
									}
								},
								'Edit Video'
							)
						),
						React.createElement(
							'div',
							{ className: 'session_settings', style: { display: _this2.state.showsettings === item['id'] ? 'block' : 'none' } },
							React.createElement('input', { type: 'checkbox', id: 'novideo',
								onChange: function onChange(e) {
									return _this2.updateSessionSettings(e, item['id']);
								},
								defaultChecked: _this2.state.viddetail[item['id']] && _this2.state.viddetail[item['id']].novideo === 'on' ? true : false }),
							React.createElement(
								'span',
								{ className: 'checkbox_note' },
								'This presentation has no video'
							),
							React.createElement(
								'div',
								{ style: { display: !_this2.state.viddetail[item['id']] || !_this2.state.viddetail[item['id']]['novideo'] ? 'block' : 'none' } },
								React.createElement('input', { type: 'checkbox', id: 'keynote',
									onChange: function onChange(e) {
										return _this2.updateSessionSettings(e, item['id']);
									},
									defaultChecked: _this2.state.viddetail[item['id']] && _this2.state.viddetail[item['id']].keynote === 'on' ? true : false }),
								React.createElement(
									'span',
									{ className: 'checkbox_note' },
									'This is a keynote'
								),
								React.createElement(
									'span',
									null,
									'Video File'
								),
								React.createElement(FileSelect, { id: 'videofile', onChange: function onChange(e) {
										return _this2.updateSessionSettings(e, item['id']);
									},
									onBlur: function onBlur(e) {
										return _this2.handleLostFocus(e);
									},
									value: _this2.state.viddetail[item['id']] ? _this2.state.viddetail[item['id']]['videofile'] : [],
									multiselect: true
								}),
								React.createElement(
									'span',
									null,
									'Slide URL'
								),
								React.createElement('input', { type: 'text', id: 'slides',
									value: _this2.state.viddetail[item['id']] ? _this2.state.viddetail[item['id']]['slides'] : '',
									onChange: function onChange(e) {
										return _this2.updateSessionSettings(e, item['id']);
									},
									onBlur: function onBlur(e) {
										return _this2.handleLostFocus(e);
									} }),
								React.createElement(
									'button',
									{ onClick: function onClick(e) {
											return _this2.clearItem(item['id']);
										} },
									'Clear Processed Video'
								),
								React.createElement(
									'button',
									{ onClick: function onClick(e) {
											return _this2.clearItemProcessed(item['id']);
										} },
									'Clear Processed'
								),
								React.createElement(
									'button',
									{ onClick: function onClick(e) {
											return _this2.clearItemUpload(item['id']);
										} },
									'Clear Upload'
								),
								React.createElement(
									'span',
									{ className: 'error' },
									_this2.state.viddetail[item['id']] && _this2.state.viddetail[item['id']]['failmessage'] ? _this2.state.viddetail[item['id']]['failmessage'] : ''
								)
							)
						)
					);
				});
			}
			return React.createElement(
				'div',
				{ className: 'presentation_input' },
				React.createElement('br', null),
				React.createElement(DisplayStatus, null),
				React.createElement(
					'h1',
					null,
					'Presentations'
				),
				React.createElement(
					'div',
					{ className: 'swirlwait', style: { display: this.state === null || this.state.details === null ? 'block' : 'none' } },
					'Loading ...'
				),
				React.createElement(
					'div',
					{ className: 'list', style: { display: this.state !== null && this.state.details !== null ? 'block' : 'none' } },
					React.createElement(
						'div',
						null,
						React.createElement(
							'div',
							{ className: 'track_select', key: '-1',
								style: { backgroundColor: this.headColor(-1) },
								onClick: function onClick(e) {
									return _this2.changeTrack(e);
								}
							},
							'All'
						),
						listTracks,
						React.createElement(
							'div',
							{ className: 'track_select', key: '-2',
								style: { backgroundColor: this.headColor(-2) },
								onClick: function onClick(e) {
									return _this2.changeTrack(e);
								}
							},
							'Missing Info'
						)
					),
					React.createElement(
						'div',
						{ className: 'session_list' },
						listItems
					)
				)
			);
		}
	}]);

	return Presentations;
}(React.Component);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _video = require('video.js');

var _video2 = _interopRequireDefault(_video);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Editor = function (_React$Component) {
	_inherits(Editor, _React$Component);

	function Editor(props) {
		_classCallCheck(this, Editor);

		var _this = _possibleConstructorReturn(this, (Editor.__proto__ || Object.getPrototypeOf(Editor)).call(this, props));

		var viddet = getSettings('viddetail');
		if (typeof viddet[selectedVideo] === 'undefined') {
			// failed this should really never happen
			viddet[selectedVideo] = {};
		}
		if (typeof viddet[selectedVideo]['video_start'] === 'undefined') {
			// failed this should really never happen
			viddet[selectedVideo]['video_start'] = '0';
		}
		if (typeof viddet[selectedVideo]['video_end'] === 'undefined') {
			// failed this should really never happen
			viddet[selectedVideo]['video_end'] = null;
		}
		_this.player = null;

		_this.state = {
			settings: getSettings('settings'),
			viddetail: viddet,
			selectedVideo: selectedVideo
		};
		return _this;
	}

	_createClass(Editor, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			document.getElementById('video-js').innerHTML = '<video width="640" id="videoplayer" class="video-js vjs-default-skin" controls>' + '<source src="' + this.state.viddetail[this.state.selectedVideo]['tmp_file'] + '"></source>' + //' ' + this.state.viddetail[this.state.selectedVideo]['videofile'] +'"></source>' + 
			//				'<source src="file:///Users/kiera/Documents/Development/wcvideoomatic/out.mp4"></source>' + //' ' + this.state.viddetail[this.state.selectedVideo]['videofile'] +'"></source>' + 
			'</video>';
			//<video width="640" id="vjs" ref={ node => this.vjsNode = node } className="video-js"></video>
			var self = this;

			this.player = (0, _video2.default)('videoplayer', {
				//				src: this.state.viddetail[this.state.selectedVideo]['videofile']
			}, function onPlayerReady() {
				var _this2 = this;

				var htm = '<button class="vjs-mark-start vjs-control" type="button" aria-live="polite" title="Mark Start" aria-disabled="false"><span aria-hidden="true" class="vjs-icon-placeholder"></span><span class="vjs-control-text">Mark Start</span></button>';
				htm += '<button class="vjs-mark-end vjs-control" type="button" aria-live="polite" title="Mark Start" aria-disabled="false"><span aria-hidden="true" class="vjs-icon-placeholder"></span><span class="vjs-control-text">Mark Start</span></button>';
				(0, _jquery2.default)('.vjs-play-control').after(htm);

				(0, _jquery2.default)('.vjs-mark-end').click(function (e) {
					self.setTimers('end', _this2.currentTime());
				});
				(0, _jquery2.default)('.vjs-mark-start').click(function (e) {
					self.setTimers('start', _this2.currentTime());
				});
			});

			this.player.one('loadedmetadata', function () {
				console.log(self.state.viddetail, selectedVideo, this.duration());
				if (self.state.viddetail[selectedVideo]['video_end'] === null) {
					self.setTimers('end', this.duration());
				}
			});
		}
	}, {
		key: 'setTimers',
		value: function setTimers(item, val) {
			var x = this.state.viddetail;
			x[this.state.selectedVideo]['video_' + item] = val;
			this.setState({ viddetail: x });
			this.handleLostFocus();
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			if (this.player) {
				this.player.dispose();
			}
		}
	}, {
		key: 'updateSettings',
		value: function updateSettings(e, id) {
			var x = this.state.viddetail;
			if (typeof x[id] === 'undefined') {
				x[id] = {};
			}
			var val = e.target.value;
			if (e.target.type === 'checkbox') {
				if (e.target.checked) {
					val = 'on';
				} else {
					val = '';
				}
			}
			x[id][e.target.id] = val;
			this.setState({ viddetail: x });

			if (e.target.type === 'checkbox') {
				this.handleLostFocus();
			}
		}
	}, {
		key: 'handleLostFocus',
		value: function handleLostFocus(e) {
			saveSettings('viddetail', this.state.viddetail);
		}
	}, {
		key: 'render',
		value: function render() {
			var _this3 = this;

			var videoJsOptions = {
				autoplay: true,
				controls: true,
				sources: [{
					src: this.state.viddetail[this.state.selectedVideo]['videofile'],
					type: 'video/mp4'
				}]
			};

			return React.createElement(
				'div',
				{ className: 'editor_input' },
				React.createElement('br', null),
				React.createElement(
					'h1',
					null,
					'Editor'
				),
				React.createElement(
					'div',
					{ style: { display: this.state.selectedVideo !== null ? 'none' : 'block' } },
					'Please select a video to edit'
				),
				React.createElement('div', { id: 'video-js', style: { display: this.state.selectedVideo !== null ? 'block' : 'none' } }),
				React.createElement(
					'div',
					{ className: 'vid_start_div' },
					'Video Start: ',
					React.createElement('input', { type: 'text', id: 'video_start',
						onChange: function onChange(e) {
							return _this3.updateSettings(e, _this3.state.selectedVideo);
						},
						onBlur: function onBlur(e) {
							return _this3.handleLostFocus(e);
						},
						value: this.state.viddetail[this.state.selectedVideo] ? this.state.viddetail[this.state.selectedVideo]['video_start'] : '' })
				),
				React.createElement(
					'div',
					{ className: 'vid_end_div' },
					'Video End: ',
					React.createElement('input', { type: 'text', id: 'video_end',
						onChange: function onChange(e) {
							return _this3.updateSettings(e, _this3.state.selectedVideo);
						},
						onBlur: function onBlur(e) {
							return _this3.handleLostFocus(e);
						},
						value: this.state.viddetail[this.state.selectedVideo] ? this.state.viddetail[this.state.selectedVideo]['video_end'] : '' })
				),
				React.createElement(
					'div',
					null,
					React.createElement('input', { type: 'checkbox', id: 'doneedit',
						onChange: function onChange(e) {
							return _this3.updateSettings(e, _this3.state.selectedVideo);
						},
						defaultChecked: this.state.viddetail[this.state.selectedVideo] && this.state.viddetail[this.state.selectedVideo].doneedit === 'on' ? true : false }),
					React.createElement(
						'span',
						{ className: 'checkbox_note' },
						'I am done editing this video'
					)
				)
			);
		}
	}]);

	return Editor;
}(React.Component);

// <video id="videoplayer" width="640" height="480" controls>
// 						 	<source src={this.state.viddetail[this.state.selectedVideo]['videofile']}/>
// 							Your browser does not support the video tag.
// 						</video>
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Process = function (_React$Component) {
	_inherits(Process, _React$Component);

	function Process(props) {
		_classCallCheck(this, Process);

		var _this = _possibleConstructorReturn(this, (Process.__proto__ || Object.getPrototypeOf(Process)).call(this, props));

		_this.doneitems = {};
		_this.endit = 0;

		_this.p = require('electron').remote.require('./process');
		var stat = _this.p.getDetails();

		_this.state = {
			settings: getSettings('settings'),
			viddetail: getSettings('viddetail'),
			progress: {},
			currentid: stat.curid !== null ? stat.curid : null,
			interval: null
		};
		getPresentationSettings(_this.state.settings, function (t, s, d) {
			_this.setState({ tracks: t, speakers: s, details: d });
		});

		if (stat.curid !== null) {
			var inter = setInterval(function (e) {
				_this.checkProcess();
			}, 200);
			_this.setState({ interval: inter });
		}
		return _this;
	}

	_createClass(Process, [{
		key: 'componentDidMount',
		value: function componentDidMount() {}
	}, {
		key: 'endProcess',
		value: function endProcess() {
			if (this.state.interval !== null) {
				this.endit = 1;
			}
		}
	}, {
		key: 'killProcess',
		value: function killProcess() {
			this.endProcess();
			// todo:  call out and kill the running process
		}
	}, {
		key: 'checkProcess',
		value: function checkProcess() {
			if (this.state.currentid !== null) {
				var val = this.p.getDetails();
				var s = this.state.progress;
				s[this.state.currentid].percent = val.percent;
				s[this.state.currentid].state = val.status;
				this.setState({ progress: s });
				if (val.complete) {
					if (val.success === true) {
						var vid = this.state.viddetail;
						vid[this.state.currentid]['doneprocess'] = true;
						vid[this.state.currentid]['donefile'] = val.outfile;
						saveSettings('viddetail', vid);
						this.setState({ viddetail: vid });
					}
					this.doneitems[this.state.currentid] = 1;
					this.setState({ currentid: null });
					if (this.endit === 1) {
						clearInterval(this.state.interval);
						this.setState({ interval: null });
					}
				}
			}
			if (this.endit !== 1 && this.state.currentid === null) {
				this.beginVideoProcess();
			}
		}
	}, {
		key: 'getDetailFromID',
		value: function getDetailFromID(id) {
			var viddetail = '';
			for (var i in this.state.details) {
				if (parseInt(this.state.details[i].id) === parseInt(id)) {
					viddetail = this.state.details[i];
					break;
				}
			}

			var speaker = '';
			var outfile = '';
			if (viddetail !== '') {
				if (viddetail.speakers) {
					for (var _i = 0; _i < viddetail.speakers.length; _i++) {
						if (this.state.speakers[viddetail.speakers[_i]]) {
							if (speaker !== '') {
								speaker += ' and ';
							}
							speaker += this.state.speakers[viddetail.speakers[_i]]['title']['rendered'];
						}
					}
				}

				outfile = viddetail.title.rendered;
				outfile = outfile.replace(/[^a-zA-Z0-9\_]/g, '_');
			}
			return { 'viddetail': viddetail, 'speaker': speaker, 'outfile': outfile };
		}
	}, {
		key: 'startProcess',
		value: function startProcess(e) {
			var _this2 = this;

			if (this.state.interval === null) {
				var inter = setInterval(function (e) {
					_this2.checkProcess();
				}, 200);
				this.setState({ interval: inter });
				this.doneitems = {};
			}
		}
	}, {
		key: 'beginVideoProcess',
		value: function beginVideoProcess() {
			var id = '';
			this.endit = 0;
			for (var key in this.state.viddetail) {
				console.log(key, this.state.viddetail[key], !this.state.viddetail[key]['donefile'], this.state.viddetail[key]['doneedit'] === 'on', !this.doneitems[key]);
				if (this.state.viddetail[key] && !this.state.viddetail[key]['doneprocess'] && this.state.viddetail[key]['doneedit'] && !this.doneitems[key]) {
					id = key;
					break;
				}
			}
			if (id === '') {
				this.endProcess();
				if (this.doneitems.length === 0) {
					alert('There are no videos to process');
				} else {
					alert('All videos have been processed');
				}
				return;
			}

			this.setState({ currentid: id });
			var s = this.state.progress;
			s[id] = { percent: 0, state: 'Starting to process' };
			this.setState({ progress: s });

			var details = this.getDetailFromID(id);
			if (details['viddetail'] === '') {
				alert('There are no details for the video');
				return;
			}

			this.p.startProcess({
				'id': id,
				'outputfile': JSON.parse(this.state.settings.outdir)[0] + '/' + details['outfile'] + '.mp4',
				'imagefile': JSON.parse(this.state.settings.imagefile),
				'speaker': details['speaker'],
				'title': details['viddetail'].title.rendered,
				'description': details['viddetail'].content.rendered,
				'mainvideo': this.state.viddetail[id]['tmp_file'],
				'credits': this.state.settings.credits,
				'slides': this.state.viddetail[id]['slides'],
				'tmpdir': JSON.parse(this.state.settings.tmpdir),
				'start': this.state.viddetail[id]['video_start'],
				'end': this.state.viddetail[id]['video_end'],
				'fontfile': JSON.parse(this.state.settings['fontfile']),
				'fontsize': this.state.settings['fontsize'],
				'text_y': this.state.settings['text_y'],
				'fontcolor': this.state.settings['fontcolor']
			});
		}
	}, {
		key: 'render',
		value: function render() {
			var _this3 = this;

			var listReady = Object.keys(this.state.viddetail).map(function (i) {
				var item = _this3.state.viddetail[i];
				if (!_this3.state.details || _this3.state.viddetail[i]['doneedit'] !== 'on' || _this3.state.viddetail[i]['doneprocess']) {
					return;
				}

				var detail = _this3.getDetailFromID(i);
				return React.createElement(
					'div',
					{ className: 'pvideo_select', key: i
					},
					detail['viddetail'].title ? detail['viddetail'].title.rendered : '',
					detail['speaker'] !== '' ? ' By ' + detail['speaker'] : '',
					React.createElement(
						'div',
						{ className: 'process_detail', style: { display: typeof _this3.state.progress[i] !== 'undefined' ? 'block' : 'none' } },
						React.createElement(
							'div',
							{ className: 'percent' },
							React.createElement(
								'div',
								{ className: 'percentblock', style: { width: _this3.state.progress[i] ? _this3.state.progress[i].percent : 0 } },
								React.createElement(
									'span',
									{ style: { display: (_this3.state.progress[i] ? _this3.state.progress[i].percent : 0) >= 50 ? 'inline-block' : 'none' } },
									_this3.state.progress[i] ? _this3.state.progress[i].percent : 0,
									'%'
								),
								'\xA0'
							),
							React.createElement(
								'span',
								{ style: { display: (_this3.state.progress[i] ? _this3.state.progress[i].percent : 0) < 50 ? 'inline-block' : 'none' } },
								_this3.state.progress[i] ? _this3.state.progress[i].percent : 0,
								'%'
							)
						),
						React.createElement(
							'div',
							{ className: 'status' },
							_this3.state.progress[i] ? _this3.state.progress[i].state : ''
						)
					)
				);
			});

			return React.createElement(
				'div',
				{ className: 'process_input' },
				React.createElement('br', null),
				React.createElement(
					'div',
					{ className: 'process_controls' },
					React.createElement('i', { className: this.state.interval === null ? 'fa fa-play' : 'fa fa-refresh fa-spin', 'aria-hidden': 'true',
						title: 'Start Processing',
						onClick: function onClick(e) {
							return _this3.startProcess(e);
						}
					}),
					React.createElement('i', { className: 'fa fa-stop', 'aria-hidden': 'true',
						title: 'Stop Processing after this item',
						onClick: function onClick(e) {
							return _this3.endProcess(e);
						}
					}),
					React.createElement('i', { className: 'fa fa-window-close-o', 'aria-hidden': 'true',
						title: 'Stop Processing right now',
						onClick: function onClick(e) {
							_this3.killProcess(e);
						}
					})
				),
				React.createElement(
					'h1',
					null,
					'Process'
				),
				React.createElement(
					'div',
					{ className: 'swirlwait', style: { display: this.state === null || this.state.details === null ? 'block' : 'none' } },
					'Loading ...'
				),
				React.createElement(
					'div',
					{ className: 'list', style: { display: this.state !== null && this.state.details !== null ? 'block' : 'none' } },
					listReady
				)
			);
		}
	}]);

	return Process;
}(React.Component);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Credits = function (_React$Component) {
	_inherits(Credits, _React$Component);

	function Credits(props) {
		_classCallCheck(this, Credits);

		var _this = _possibleConstructorReturn(this, (Credits.__proto__ || Object.getPrototypeOf(Credits)).call(this, props));

		_this.state = {};
		return _this;
	}

	_createClass(Credits, [{
		key: "render",
		value: function render() {
			return React.createElement(
				"div",
				{ className: "credits_input" },
				React.createElement("br", null),
				React.createElement(
					"h1",
					null,
					"Credits"
				),
				React.createElement("img", { src: "http://www.kierahowe.com/resume/img/dragon-fly.gif" }),
				React.createElement(
					"h2",
					null,
					"Kiera Howe"
				),
				React.createElement(
					"h3",
					null,
					"Twitter: @xxowe"
				),
				React.createElement(
					"h3",
					null,
					React.createElement(
						"a",
						{ href: "http://www.kierahowe.com" },
						"http://www.kierahowe.com"
					)
				),
				React.createElement(
					"div",
					null,
					"Kiera is a software developer who specializes in WordPress development. You can see Kiera at WordCamps, but she usually has to leave her dragon at home.",
					React.createElement("br", null),
					React.createElement("br", null),
					"Feel free to reach out if you think you have something you want built.",
					React.createElement("br", null),
					React.createElement("br", null),
					React.createElement(
						"form",
						{ action: "https://www.paypal.com/cgi-bin/webscr", method: "post", target: "_top" },
						React.createElement("input", { type: "hidden", name: "cmd", value: "_s-xclick" }),
						React.createElement("input", { type: "hidden", name: "encrypted", value: "-----BEGIN PKCS7-----MIIHsQYJKoZIhvcNAQcEoIIHojCCB54CAQExggEwMIIBLAIBADCBlDCBjjELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEGA1UECxQKbGl2ZV9jZXJ0czERMA8GA1UEAxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb20CAQAwDQYJKoZIhvcNAQEBBQAEgYC2dcQvjb57ufTKkPTAuB6KCvRBHp9PMJzU3EgbfUy0KsBnfD3sFbhpNBBxbVBxgSC+RoH7hNacuqOpfoLNTa9H++914RgViNgcNMBJzZlgUE4tPlmgTkQwYGlBTxlOtJv84BA/+SEVWVJV3d/gSAomgOmYg/z8hUlzBp6aAI/0ujELMAkGBSsOAwIaBQAwggEtBgkqhkiG9w0BBwEwFAYIKoZIhvcNAwcECI8/wXfJSdlSgIIBCBc3Z96DQ+vx89lHx2J97MUaK26X7Piak40Us3pR4qfARtWY5yks7GAOlPGqTApeGSuyKLRCB+H5zMGDMd9sluVrW9M6Fpn3/E1bgEE/VWfs6TG5v7mVpz5Vrvy3LPYdP/77bXj3g6g/ILzSiO6xiyzOT43PS4MNtxuDBtt7BbC/M0OSyKbUO6HQY8InIm6Ap/3DkjQz6wSV+PcccdloOBjZarH6bHcJohn15QZFvai99/vQpCfDhcbRWGVFZYrG9oKCiAb1vpNw21zrcEXBoJ438amGcnxgAcNfS3x8eIU8GGT/wEI+/61Xotq7Je2lCr5PHYpb6foClbkkfGhSyF5uI6bbpWIxxqCCA4cwggODMIIC7KADAgECAgEAMA0GCSqGSIb3DQEBBQUAMIGOMQswCQYDVQQGEwJVUzELMAkGA1UECBMCQ0ExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxFDASBgNVBAoTC1BheVBhbCBJbmMuMRMwEQYDVQQLFApsaXZlX2NlcnRzMREwDwYDVQQDFAhsaXZlX2FwaTEcMBoGCSqGSIb3DQEJARYNcmVAcGF5cGFsLmNvbTAeFw0wNDAyMTMxMDEzMTVaFw0zNTAyMTMxMDEzMTVaMIGOMQswCQYDVQQGEwJVUzELMAkGA1UECBMCQ0ExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxFDASBgNVBAoTC1BheVBhbCBJbmMuMRMwEQYDVQQLFApsaXZlX2NlcnRzMREwDwYDVQQDFAhsaXZlX2FwaTEcMBoGCSqGSIb3DQEJARYNcmVAcGF5cGFsLmNvbTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAwUdO3fxEzEtcnI7ZKZL412XvZPugoni7i7D7prCe0AtaHTc97CYgm7NsAtJyxNLixmhLV8pyIEaiHXWAh8fPKW+R017+EmXrr9EaquPmsVvTywAAE1PMNOKqo2kl4Gxiz9zZqIajOm1fZGWcGS0f5JQ2kBqNbvbg2/Za+GJ/qwUCAwEAAaOB7jCB6zAdBgNVHQ4EFgQUlp98u8ZvF71ZP1LXChvsENZklGswgbsGA1UdIwSBszCBsIAUlp98u8ZvF71ZP1LXChvsENZklGuhgZSkgZEwgY4xCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEWMBQGA1UEBxMNTW91bnRhaW4gVmlldzEUMBIGA1UEChMLUGF5UGFsIEluYy4xEzARBgNVBAsUCmxpdmVfY2VydHMxETAPBgNVBAMUCGxpdmVfYXBpMRwwGgYJKoZIhvcNAQkBFg1yZUBwYXlwYWwuY29tggEAMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEFBQADgYEAgV86VpqAWuXvX6Oro4qJ1tYVIT5DgWpE692Ag422H7yRIr/9j/iKG4Thia/Oflx4TdL+IFJBAyPK9v6zZNZtBgPBynXb048hsP16l2vi0k5Q2JKiPDsEfBhGI+HnxLXEaUWAcVfCsQFvd2A1sxRr67ip5y2wwBelUecP3AjJ+YcxggGaMIIBlgIBATCBlDCBjjELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEGA1UECxQKbGl2ZV9jZXJ0czERMA8GA1UEAxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb20CAQAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJAzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE3MTEwOTAxMzUwOVowIwYJKoZIhvcNAQkEMRYEFGHGhjye7zuZlVSgnkfsfusxBZb8MA0GCSqGSIb3DQEBAQUABIGALdvfOQQUp2OxFfqNPuaYdBQDpRNASW8CcNfDjaSghbV1Kxc5l5Q/XV3F3fTh6ayHK+Z9rCjJFHBNCKgUHBlyYAWEbpaR1aJlcorZ+SeEHxkA7Ud7JhEkwSkG6Mmwg/q+wiKeI5/sIvk1k6DwaquRwBosZpaBjaHN/jednx1TTaE=-----END PKCS7-----" }),
						React.createElement("input", { type: "image", src: "http://www.kierahowe.com/kiera-videopress.gif", border: "0", name: "submit", alt: "PayPal - The safer, easier way to pay online!" }),
						React.createElement("img", { alt: "", border: "0", src: "https://www.paypalobjects.com/en_US/i/scr/pixel.gif", width: "1", height: "1" })
					)
				)
			);
		}
	}]);

	return Credits;
}(React.Component);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FileSelect = function (_React$Component) {
	_inherits(FileSelect, _React$Component);

	function FileSelect(props) {
		_classCallCheck(this, FileSelect);

		var _this = _possibleConstructorReturn(this, (FileSelect.__proto__ || Object.getPrototypeOf(FileSelect)).call(this, props));

		var val = props.value;
		if (typeof props.value === 'undefined' || props.value === null) {
			val = '[]';
		}

		var v;
		try {
			v = JSON.parse(val);
		} catch (e) {
			v = null;
		}
		if (v === null) {
			val = JSON.stringify([val]);
		}

		_this.state = {
			imagefile: val,
			props: props
		};
		return _this;
	}

	_createClass(FileSelect, [{
		key: 'getFile',
		value: function getFile(e) {
			var dialog = require('electron').remote.dialog;

			var args = { properties: [] };
			if (this.state.props.type === 'dir') {
				args['properties'].push('openDirectory', 'createDirectory');
			} else {
				args['properties'].push('openFile');
			}

			if (this.state.props.multiselect) {
				args['properties'].push('multiSelections');
			}

			var self = this;
			dialog.showOpenDialog(args, function (file) {
				if (typeof file === 'undefined' || file.length === 0) {
					return;
				}
				console.log('files', file);
				self.setState({ imagefile: JSON.stringify(file) });

				if (self.state.props.onChange) {
					self.state.props.onChange({ target: { id: self.state.props.id, value: JSON.stringify(file) } });
				}
				if (self.state.props.onBlur) {
					self.state.props.onBlur({ target: { id: self.state.props.id, value: JSON.stringify(file) } });
				}
			});
		}
	}, {
		key: 'showfiles',
		value: function showfiles() {
			var files = JSON.parse(this.state.imagefile);
			if (this.state.props.type === 'dir') {
				return files[0];
			} else {
				var val = '';
				for (var t = 0; t < files.length; t++) {
					if (_typeof(files[t]) === undefined || files[t].length === 0) {
						continue;
					}
					if (val !== '') {
						val += ',';
					}
					val += files[t].substr(files[t].lastIndexOf('/') + 1);
				}
				return val;
			}
		}
	}, {
		key: 'render',
		value: function render() {
			var _this2 = this;

			return React.createElement(
				'div',
				{ className: 'fileselect_input' },
				React.createElement('input', { type: 'hidden', id: this.props.id, value: this.state.imagefile }),
				React.createElement('input', { type: 'text', readOnly: true, id: this.props.id + '_view',
					value: this.showfiles() }),
				React.createElement('input', { type: 'button', id: 'selectImage', value: 'Select File', onClick: function onClick(e) {
						_this2.getFile(e);
					} })
			);
		}
	}]);

	return FileSelect;
}(React.Component);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Upload = function (_React$Component) {
	_inherits(Upload, _React$Component);

	function Upload(props) {
		_classCallCheck(this, Upload);

		var _this = _possibleConstructorReturn(this, (Upload.__proto__ || Object.getPrototypeOf(Upload)).call(this, props));

		_this.doneitems = {};
		_this.endit = 0;

		_this.state = {
			settings: getSettings('settings'),
			viddetail: getSettings('viddetail'),
			progress: {},
			currentid: null,
			interval: null
		};
		getPresentationSettings(_this.state.settings, function (t, s, d) {
			_this.setState({ tracks: t, speakers: s, details: d });
		});
		return _this;
	}

	_createClass(Upload, [{
		key: 'componentDidMount',
		value: function componentDidMount() {}
	}, {
		key: 'endProcess',
		value: function endProcess() {
			if (this.state.interval !== null) {
				this.endit = 1;
			}
		}
	}, {
		key: 'killProcess',
		value: function killProcess() {
			this.endProcess();
			// todo:  call out and kill the running process
		}
	}, {
		key: 'checkProcess',
		value: function checkProcess() {
			var p = require('electron').remote.require('./upload');
			if (this.state.currentid !== null) {
				var val = p.getDetails();
				var s = this.state.progress;
				s[this.state.currentid].percent = val.percent;
				s[this.state.currentid].state = val.status;
				this.setState({ progress: s });
				if (val.complete) {
					var vid = this.state.viddetail;
					if (val.success === true) {
						vid[this.state.currentid]['doneupload'] = true;
					} else {
						vid[this.state.currentid]['failedupload'] = true;
					}
					vid[this.state.currentid]['returnout'] = val.detail;

					saveSettings('viddetail', vid);
					this.setState({ viddetail: vid });

					this.doneitems[this.state.currentid] = 1;
					this.setState({ currentid: null });
				}
			}

			if (this.endit !== 1 && this.state.currentid === null) {
				this.beginVideoUpload();
			}

			if (this.endit === 1) {
				clearInterval(this.state.interval);
				this.setState({ interval: null });
			}
		}
	}, {
		key: 'getDetailFromID',
		value: function getDetailFromID(id) {
			var viddetail = '';
			for (var i in this.state.details) {
				if (parseInt(this.state.details[i].id) === parseInt(id)) {
					viddetail = this.state.details[i];
					break;
				}
			}

			var speaker = '';
			var outfile = '';
			if (viddetail !== '') {
				if (viddetail.speakers) {
					for (var _i = 0; _i < viddetail.speakers.length; _i++) {
						if (this.state.speakers[viddetail.speakers[_i]]) {
							if (speaker !== '') {
								speaker += ' and ';
							}
							speaker += this.state.speakers[viddetail.speakers[_i]]['title']['rendered'];
						}
					}
				}

				outfile = viddetail.title.rendered;
				outfile = outfile.replace(/[^a-zA-Z0-9\_]/g, '_');
			}
			return { 'viddetail': viddetail, 'speaker': speaker, 'outfile': outfile };
		}
	}, {
		key: 'startProcess',
		value: function startProcess(e) {
			var _this2 = this;

			if (this.state.interval === null) {
				var inter = setInterval(function (e) {
					_this2.checkProcess();
				}, 200);
				this.setState({ interval: inter });
				this.doneitems = {};
			}
		}
	}, {
		key: 'beginVideoUpload',
		value: function beginVideoUpload() {
			var id = '';
			this.endit = 0;
			for (var key in this.state.viddetail) {
				if (this.state.viddetail[key] && this.state.viddetail[key]['donefile'] && this.state.viddetail[key]['doneprocess'] && !this.doneitems[key] && !this.state.viddetail[key]['doneupload']) {
					id = key;
					break;
				}
			}

			if (id === '') {
				this.endProcess();
				if (Object.keys(this.doneitems).length === 0) {
					alert('There are no videos to upload');
				} else {
					alert('All videos have been uploaded');
				}
				return;
			}

			this.setState({ currentid: id });
			var s = this.state.progress;
			s[id] = { percent: 0, state: 'Starting to process' };
			this.setState({ progress: s });

			var details = this.getDetailFromID(id);
			if (details['viddetail'] === '') {
				alert('There are no details for the video');
				return;
			}

			var p = require('electron').remote.require('./upload');
			p.startProcess({
				'id': id,
				'outputfile': this.state.viddetail[id]['donefile'],
				'speaker': details['speaker'],
				'title': details['viddetail'].title.rendered,
				'description': details['viddetail'].content.rendered,
				'slides': this.state.viddetail[id]['slides']
			});
		}
	}, {
		key: 'render',
		value: function render() {
			var _this3 = this;

			var listReady = Object.keys(this.state.viddetail).map(function (i) {
				var item = _this3.state.viddetail[i];
				if (!_this3.state.details || !_this3.state.viddetail[i]['doneprocess'] || _this3.state.viddetail[i]['doneupload']) {
					return;
				}

				var detail = _this3.getDetailFromID(i);
				return React.createElement(
					'div',
					{ className: 'pvideo_select', key: i
					},
					detail['viddetail'].title ? detail['viddetail'].title.rendered : '',
					detail['speaker'] !== '' ? ' By ' + detail['speaker'] : '',
					React.createElement(
						'div',
						{ className: 'process_detail', style: { display: typeof _this3.state.progress[i] !== 'undefined' ? 'block' : 'none' } },
						React.createElement(
							'div',
							{ className: 'percent' },
							React.createElement(
								'div',
								{ className: 'percentblock', style: { width: _this3.state.progress[i] ? _this3.state.progress[i].percent : 0 } },
								React.createElement(
									'span',
									{ style: { display: (_this3.state.progress[i] ? _this3.state.progress[i].percent : 0) >= 50 ? 'inline-block' : 'none' } },
									_this3.state.progress[i] ? _this3.state.progress[i].percent : 0,
									'%'
								),
								'\xA0'
							),
							React.createElement(
								'span',
								{ style: { display: (_this3.state.progress[i] ? _this3.state.progress[i].percent : 0) < 50 ? 'inline-block' : 'none' } },
								_this3.state.progress[i] ? _this3.state.progress[i].percent : 0,
								'%'
							)
						),
						React.createElement(
							'div',
							{ className: 'status' },
							_this3.state.progress[i] ? _this3.state.progress[i].state : ''
						)
					)
				);
			});

			return React.createElement(
				'div',
				{ className: 'process_input' },
				React.createElement('br', null),
				React.createElement(
					'div',
					{ className: 'process_controls' },
					React.createElement('i', { className: this.state.interval === null ? 'fa fa-play' : 'fa fa-refresh fa-spin', 'aria-hidden': 'true',
						title: 'Start Processing',
						onClick: function onClick(e) {
							return _this3.startProcess(e);
						}
					}),
					React.createElement('i', { className: 'fa fa-stop', 'aria-hidden': 'true',
						title: 'Stop Processing after this item',
						onClick: function onClick(e) {
							return _this3.endProcess(e);
						}
					}),
					React.createElement('i', { className: 'fa fa-window-close-o', 'aria-hidden': 'true',
						title: 'Stop Processing right now',
						onClick: function onClick(e) {
							_this3.killProcess(e);
						}
					})
				),
				React.createElement(
					'h1',
					null,
					'Upload'
				),
				React.createElement(
					'div',
					{ className: 'swirlwait', style: { display: this.state === null || this.state.details === null ? 'block' : 'none' } },
					'Loading ...'
				),
				React.createElement(
					'div',
					{ className: 'list', style: { display: this.state !== null && this.state.details !== null ? 'block' : 'none' } },
					listReady
				)
			);
		}
	}]);

	return Upload;
}(React.Component);
