# Videojs hls.js Plugin

<img align="right" height="30" src="http://www.srgssr.ch/fileadmin/templates/images/SRGLogo.gif">

> An HLS plugin for video.jas based on hls.js

Videojs hls.js offers hls playback using [hls.js](https://github.com/dailymotion/hls.js). For more details on browser compatibility see th hls.js github page.

- [Getting Started](#getting-started)
- [Documentation](#documentation)
  - [Dependencies](#dependencies)
  - [CORS Considerations](#cors-considerations)
  - [Options](#options)
- [Original Author](#original-author)

## Getting Started

Download videojs-hlsjs and include it in your page along with video.js:

```html
<video id="video" preload="auto" class="video-js vjs-default-skin" controls>
    <source src="http://www.streambox.fr/playlists/x36xhzz/x36xhzz.m3u8" type="application/vnd.apple.mpegurl">
</video>
<script src="hlsjs.min.js"></script>
<script src="video.min.js"></script>
<script src="videojs-hlsjs.min.js"></script>
<script>
    var player = videojs('video', {
        // hlsjs tech should come before html5, if you want to give precedence to native HLS playback
        // use the favorNativeHLS option.
        techOrder: ["hlsjs", "html5", "flash"]
    });
</script>
```

There's also a [working example](index.html) of the plugin that you can check out.

## Documentation

### Dependencies
This project depends on:

- [video.js](https://github.com/videojs/video.js) 5.8.5+.
- [hls.js](https://github.com/dailymotion/hls.js) 0.6.10+.

### CORS Considerations

All HLS resources must be delivered with
[CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) allowing GET requests.

### Options

You may pass in an options object to the hls playback technology at player initialization.

#### hlsjs.favorNativeHLS
Type: `Boolean`

When the `favorNativeHLS` property is set to `true`, the plugin will prioritize native hls
over MSE. Note that in the case native streaming is available other options won't have any effect.

#### hlsjs.disableAutoLevel
Type: `Boolean`

When the `disableAutoLevel` property is set to `true`, the plugin will disable auto level switching.
If no level is specified in `hlsjs.startLevelByHeight` the plugin will start with the best quality when this property is set to true.
Useful for browsers that have trouble switching between different qualities.

#### hlsjs.startLevelByHeight
Type: `Number`

When the `startLevelByHeight` property is present, the plugin will start the video on the closest quality to the
specified height. If height metadata is not present in the HLS playlist this property will be ignored.

#### hlsjs.hls
Type `object`

An object containing hls.js configuration parameters, see in detail:
[Hls.js Fine Tuning](https://github.com/dailymotion/hls.js/blob/master/doc/API.md#fine-tuning).

**Exceptions:**

* `autoStartLoad` the loading is done through the `preload` attribute of the video tag.
* `startLevel` if you set any of the level options above this property will be ignored.

### Event listeners

This plugin offers the possibility to attach a callback to any hls.js runtime event, see the documetation
about the different events here: [Hls.js Runtime Events](https://github.com/dailymotion/hls.js/blob/master/doc/API.md#runtime-events). Simply precede the name of the event in camel case by `on`, see an example:

```js
var player = videojs('video', {
    hlsjs: {
        /**
         * Will be called on Hls.Events.MEDIA_ATTACHED.
         *
         * @param {Hls} hls      The hls instance from hls.js
         * @param {Object} data  The data from this HLS runtime event
         */
        onMediaAttached: function(hls, data) {
            // do stuff...
        }
    }
});
```

## Original Author

This project was orginally forked from: [videojs-hlsjs](https://github.com/benjipott/videojs-hlsjs), credits to the
original author.