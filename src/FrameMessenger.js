/*global Message:false, Observable:false, ie:false */
/*jshint -W098, -W068*/

//Main FrameMessenger class
var FrameMessenger = (function () {
	/*jshint +W098*/

	var postMessageOnlyStrings = typeof ie === 'number' && ie <= 8;
	function sendMessage(window, message) {
		var origin = location.protocol + '//' + location.host;
		message = message.toJSON();
		if (postMessageOnlyStrings)
			message = JSON.stringify(message);
		window.postMessage(message, origin);
	}

	//FrameMessenger constructor
	function FrameMessenger(window) {
		var self = this;
		self.window = window;

		//Simple messaging aggregation using observables
		self._channels = (function () {
			var cache = {},
				currentWindow = eval.call(null, 'this');
			function getChannel(name) {
				return cache[name] || (cache[name] = new Observable());
			}
			currentWindow.addEventListener('message', function (e) {
				e = e.originalEvent || e;
				if (e.origin !== location.protocol + '//' + location.host)
					return;
				var data = e.data;
				if (typeof data === 'string')
					data = JSON.parse(data);
				getChannel(data.channel).publish(Message.fromJSON(self, data));
			}, false);
			return getChannel;
		})();
	}

	//Subscribes to a stream of messages
	FrameMessenger.prototype.stream = function (channel, callback) {
		this._channels(channel).subscribe((function (msg) {
			callback.call(this, msg);
		}).bind(this));
	};

	//Waits for a single message
	FrameMessenger.prototype.one = function (channel, callback) {
		var h = (function (msg) {
			this._channels(channel).unsubscribe(h);
			callback.call(this, msg);
		}).bind(this);
		this._channels(channel).subscribe(h);
	};

	//Sends a message to the target frame.
	//This function has two arguments: channel and data,
	//but is internally used with a single parameter, a Message.
	FrameMessenger.prototype.send = function (channel, data) {
		var msg = typeof channel === 'object' ? channel : new Message(this, channel, data);
		sendMessage(this.window, msg);
		return msg;
	};

	//Internal method to register the replied callback on messages
	FrameMessenger.prototype._registerMessageReplyCallback = function(msg, callback) {
		var msgId = msg.id,
			h = (function (msg) {
				if (msg.replyTo === msgId) {
					this._channels(msg.channel).unsubscribe(h);
					callback.call(this, msg);
				}
			}).bind(this);
		this._channels(msg.channel).subscribe(h);
	};

	return FrameMessenger;

})();