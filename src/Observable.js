/*jshint -W098*/

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