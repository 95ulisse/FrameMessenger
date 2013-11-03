/*jshint -W098, -W061*/

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