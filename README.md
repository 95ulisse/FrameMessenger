# FrameMessenger

> A simple library to pass messages around frames.

Have you ever had troubles with passing messages from one frame to the other? Waiting for a response before performing an action? Streaming continuous messages? Then this tiny library might be useful for you.

`FremeMessenger` gives you an abstraction to pass messages back and forth with a frame, so you can forget of that `postMessage` thing. However, if you want to know more, [here](https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage)'s what MDN says about this wonderful API.



## Sample usage

Imagine you have an HTML page (`index.html`):

```html
<!DOCTYPE html>
<html>
<head>
	<title>My index page</title>
	<!-- The FrameMessenger library -->
	<script type="text/javascript" src="FrameMessenger.js"></script>
</head>
<body>
	<!-- The frame -->
	<iframe id="frame" src="frame.html"></iframe>
</body>
</html>
```

And this is the code of the frame (`frame.html`):

```html
<!DOCTYPE html>
<html>
<head>
	<title>My frame</title>
	<!-- The FrameMessenger library -->	
	<script type="text/javascript" src="FrameMessenger.js"></script>
</head>
<body>
</body>
</html>
```

From the `index.html` page we can start listening for events:

```js
//Waits for the iframe to be fully loaded (jQuery)
$('#frame').load(function () {
	var messenger = new FrameMessenger(document.getElementById('frame').contentWindow);

	//Wait for just ONE 'init' message
	messenger.one('init', function (msg) {
		console.log('Frame sent init message: ' + msg.data);
	});
});
```

Here, `index.html` waits for just *one* `init` message from the frame. In the frame, this is what happens:

```js
var messenger = new FrameMessenger(window.parent);
messenger.send('init', 'I\'m ready to battle!');
```

And magically, when the page is loaded, we see in the console:

```
Frame sent init message: I'm ready to battle!
```



## A more complete example

With the same html pages we described before, imagine a more complete example:

**Index.html**

```js
var messenger = new FrameMessenger(document.getElementById('frame').contentWindow);

//Wait for just ONE 'init' message
messenger.one('init', function (msg) {
	console.log('INDEX: Frame sent init message: ' + msg.data);
	msg.reply('I\'m ready too!');
});

//Register to all the messages on the channel 'data'
messenger.stream('data', function (msg) {
	console.log('INDEX: New data received: ' + msg.data);
	//Reply to each message
	msg.reply(msg.data % 2 === 0 ? 'Even' : 'Odd');
});
```

**Frame.html**

```js
var messenger = new FrameMessenger(window.parent);

messenger.send('init', 'I\'m ready to battle!').replied(function (msg) {
	console.log('FRAME: Parent replied to the init message: ' + msg.data);
});

//This message will never be received from the parent page,
//because in 'index.html' we subscribe to the 'init' channel using 'one'
messenger.send('init', 'Second init message');

//Every second, sends a message to the parent frame with a number
var i = 0;
function sendData() {
	messenger.send('data', i).replied(function (msg) {
		console.log('FRAME: Reply to data ' + i + ': ' + msg.data);
	});
	i++;
}
setInterval(sendData, 1000);
```

When the `index.html` page is loaded, it waits for just *one* `init` message, and replies to that specific message, signaling the frame that the parent page is loaded too. In `frame.html`, we send immediately the `init` message to the parent, and register a callback that will execute when the parent replies to this *specific* message. Since in the `index` we registered for `init` using **`one`**, this means that `index` will receive *no more than one* `init` message.

Then, `index.html` registers for a stream of `data` messages: every time the `frame.html` page sends a message to the `data` channel, the callback fires, and the message gets replied. In a few words, `frame.html` sends each second a number to the parent frame, which replies back saying if that number is even or odd.

This is the console output of the example above:

```
INDEX: Frame sent init message: I'm ready to battle!
FRAME: Parent replied to the init message: I'm ready too!
INDEX: New data received: 0
FRAME: Reply to data 0: Even
INDEX: New data received: 1
FRAME: Reply to data 1: Odd
INDEX: New data received: 2
FRAME: Reply to data 2: Even
INDEX: New data received: 3
FRAME: Reply to data 3: Odd
... 
```



## Installation and compilation

If you just want the compiled library, go in the `out` directory and grab the version you want.

If you instead want to play a bit with the source, first of all, install [NodeJs](http://nodejs.org/), then clone the repo and issue from the root of the project:

```shell
npm install
```

If you have never used [Grunt](http://gruntjs.com/), then issue also:

```shell
npm install grunt-cli -g
```

To compile the libray, issue:

```shell
grunt
```

And the compiled library is saved in the `out` directory.

## License

`FrameMessenger` is released under the [MIT license](http://opensource.org/licenses/MIT). Copyright by Marco Cameriero.