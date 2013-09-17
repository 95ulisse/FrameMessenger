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