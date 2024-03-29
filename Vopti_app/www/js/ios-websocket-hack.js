(function () {
	// Store a reference of the native WebSocket class.
	var NativeWebSocket = window.WebSocket;


	// Override native WebSocket.
	window.WebSocket = FakeWebSocket;


	// Fake WebSocket class that ill override the native one.
	function FakeWebSocket() {
		var self = this,
			url = arguments[0],
			protocols = arguments[1],
			listeners = {};


		// Create a native WebSocket instance.
		if (protocols) {
			this.ws = new NativeWebSocket(url, protocols);
		} else {
			this.ws = new NativeWebSocket(url);
		}


		// WebSocket is an EventTarget as per W3C spec.

		this.addEventListener = function (type, newListener) {
			var listenersType,
				i, listener;

			if (!type || !newListener) {
				return;
			}

			listenersType = listeners[type];
			if (listenersType === undefined) {
				listeners[type] = listenersType = [];
			}

			for (i = 0; !!(listener = listenersType[i]); i++) {
				if (listener === newListener) {
					return;
				}
			}

			listenersType.push(newListener);
		};

		this.removeEventListener = function (type, oldListener) {
			var listenersType,
				i, listener;

			if (!type || !oldListener) {
				return;
			}

			listenersType = listeners[type];
			if (listenersType === undefined) {
				return;
			}

			for (i = 0; !!(listener = listenersType[i]); i++) {
				if (listener === oldListener) {
					listenersType.splice(i, 1);
					break;
				}
			}

			if (listenersType.length === 0) {
				delete listeners[type];
			}
		};

		this.dispatchEvent = function (event) {
			var self = this,
				type,
				listenersType,
				dummyListener,
				stopImmediatePropagation = false,
				i, listener;

			if (!(event instanceof Event)) {
				throw new Error('first argument must be an instance of Event');
			}

			type = event.type;

			listenersType = (listeners[type] || []);

			dummyListener = this['on' + type];
			if (typeof dummyListener === 'function') {
				listenersType.push(dummyListener);
			}

			event.target = this;

			for (i = 0; !!(listener = listenersType[i]); i++) {
				if (stopImmediatePropagation) {
					break;
				}

				fire(listener, event);
			}

			return !event.defaultPrevented;

			function fire(listener, event) {
				// Avoid iOS WebSocket bug by running the listener within a setTimeout.
				setTimeout(function () {
					listener.call(self, event);
				});
			}
		};


		// Set the native WebSocket events.

		this.ws.onopen = function (event) {
			setTimeout(function () {
				self.dispatchEvent(event);
			});
		};

		this.ws.onerror = function (event) {
			setTimeout(function () {
				self.dispatchEvent(event);
			});
		};

		this.ws.onclose = function (event) {
			setTimeout(function () {
				self.dispatchEvent(event);
			});
		};

		this.ws.onmessage = function (event) {
			setTimeout(function () {
				self.dispatchEvent(event);
			});
		};
	}


	// Expose W3C WebSocket attributes and setters.

	Object.defineProperties(FakeWebSocket.prototype, {
		url: {
			get: function () {
				return this.ws.url;
			}
		},
		readyState: {
			get: function () {
				return this.ws.readyState;
			}
		},
		protocol: {
			get: function () {
				return this.ws.protocol;
			}
		},
		extensions: {
			get: function () {
				return this.ws.extensions;
			}
		},
		bufferedAmount: {
			get: function () {
				return this.ws.bufferedAmount;
			}
		},
		CONNECTING: {
			get: function () {
				return this.ws.CONNECTING;
			}
		},
		OPEN: {
			get: function () {
				return this.ws.OPEN;
			}
		},
		CLOSING: {
			get: function () {
				return this.ws.CLOSING;
			}
		},
		CLOSED: {
			get: function () {
				return this.ws.CLOSED;
			}
		},
		binaryType: {
			get: function () {
				return this.ws.binaryType;
			},
			set: function (type) {
				this.ws.binaryType = type;
			}
		}
	});


	// Expose W3C WebSocket methods.

	FakeWebSocket.prototype.send = function (data) {
		var self = this;

		// Avoid iOS WebSocket crash.
		setTimeout(function () {
			self.ws.send(data);
		});
	};

	FakeWebSocket.prototype.close = function (code, reason) {
		if (!code && !reason) {
			this.ws.close();
		} else if (code && !reason) {
			this.ws.close(code);
		} else {
			this.ws.close(code, reason);
		}
	};
})();