/*! FrameMessenger - v0.1.0 (2014-03-02)
Copyright (c) 2014 Marco Cameriero - Licensed MIT */
(function (definition) {

	// CommonJS
	// The existence `require`, `exports`, *and* `object` in scope strongly
	// implies that this is a CommonJS environment, as opposed to a RequireJS
	// environment which would have `require` and `define`.  This must be
	// specific enough to eliminate the possibility that this is being run by
	// Adobe Brackets, which provides global `require` and `exports`, but not
	// `module`.
	if (typeof module === "object" && typeof exports === "object") {
		module.exports = definition();

	// RequireJS
	} else if (typeof define === "function" && define.amd) {
		define([], definition);

	// <script>
	} else {
		window.FrameMessenger = definition();
	}

})(function () {
"use strict";
/*
	`ie` is:
	- `false` for non-IE browsers
	- `true` for IE >= 9
	- 8 for IE8
	- 7 for IE7
*/
var ie = (function () {
	var ie = eval("/*@cc_on!@*/false");
	if (ie) {
		var elem = document.createElement('div');
		elem.innerHTML = '<!--[if IE 7]><div class="ie7"></div><![endif]--><!--[if IE 8]><div class="ie8"></div><![endif]-->';
		if (elem.firstChild && elem.firstChild.className)
			ie = parseInt(elem.firstChild.className.substring(2), 10);
	}
	return ie;
})();
//Simple implementation of the observable patter
var Observable = (function () {
	/*jshint +W098*/

	function Observable() {
		this._callbacks = [];
	}

	Observable.prototype.publish = function(data) {
		for (var i = 0; i < this._callbacks.length; i++)
			this._callbacks[i](data);
	};

	Observable.prototype.subscribe = function(callback) {
		this._callbacks.push(callback);
	};

	Observable.prototype.unsubscribe = function(callback) {
		this._callbacks = this._callbacks.filter(function (f) {
			return f !== callback;
		});
	};

	return Observable;

})();
//Message class.
//This is a wrapper around the actual data passed around frames
var Message = (function () {
	/*jshint +W098*/

	//Simple numeric id generator
	var idGenerator = (function () {
		var counter = 0;
		return function () {
			return counter++;
		};
	})();

	//Message constructor
	function Message(messenger, channel, data, id, replyTo) {
		this._messenger = messenger;
		this.channel = channel;
		this.data = data;
		this.id = typeof id === 'undefined' ? idGenerator() : id;
		if (typeof replyTo !== 'undefined')
			this.replyTo = replyTo;
	}

	//Creates a message from its JSON representation
	Message.fromJSON = function (messenger, json) {
		return new Message(messenger, json.channel, json.data, json.id, json.replyTo);
	};

	//Replies to this message with the given data
	Message.prototype.reply = function(data) {
		var replyMsg = new Message(this._messenger, this.channel, data, idGenerator(), this.id);
		this._messenger.send(replyMsg);
		return replyMsg;
	};

	//Registers a callback that will ba called when this message is replied to
	Message.prototype.replied = function(callback) {
		this._messenger._registerMessageReplyCallback(this, callback);
		return this;
	};

	//Transforms this message in a simple JSON object
	Message.prototype.toJSON = function() {
		return {
			channel: this.channel,
			data: this.data,
			id: this.id,
			replyTo: this.replyTo
		};
	};

	return Message;

})();
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
return FrameMessenger;

});