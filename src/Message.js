/*jshint -W098*/

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