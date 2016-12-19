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
<video id="video" class="video-js vjs-default-skin" controls>
    <source src="http://www.streambox.fr/playlists/x36xhzz/x36xhzz.m3u8" type="application/vnd.apple.mpegurl">
</video>
<script src="video.js"></script>
<script src="videojs-hlsjs.js"></script>
<script>
    var player = videojs('video');
</script>
```

There's also a [working example](index.html) of the plugin that you can check out.

## Documentation

### Dependencies
This project depends on:

- [video.js](https://github.com/videojs/video.js) 5+.
- [hls.js](https://github.com/dailymotion/hls.js) 0.5+.

### CORS Considerations

All HLS resources must be delivered with
[CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) permitting GET requests.

### Options

You may pass in an options object to the hls source handler at player initialization.
This plugin offers the possibility to attach a callback to any hls.js event, see the documetation
about th different events here: [Hls.js Runtime Events](https://github.com/dailymotion/hls.js/blob/master/API.md#runtime-events).
You can pass in options just like you would for other parts of video.js:

#### hlsjs.favorNativeHLS
Type: `Boolean`

When the `favorNativeHLS` property is set to `true`, the plugin will prioritize native hls
over MSE. In the case native streaming is available other options won't have any effect.

#### hlsjs.disableAutoLevel
Type: `Boolean`

When the `disableAutoLevel` property is set to `true`, the plugin will disable auto level switching.
Useful for browsers that have trouble switching between different qualities.

#### hlsjs.setLevelByHeight
Type: `Number`

When the `setLevelByHeight` property is present, the plugin will start the video on the closest quality to the
specified height. If height metadata is not present in the HLS playlist this property will be ignored.

#### hlsjs.hls
Type `object`

An object containing hls.js configuration parameters, see in detail:
[Hls.js Fine Tuning](https://github.com/dailymotion/hls.js/blob/master/API.md#fine-tuning).

#### hlsjs.onHlsMediaAttaching
Type `function`

Callback fired before MediaSource is attaching to media element.

#### hlsjs.onHlsMediaAttaching
Type `function`

Callback fired before MediaSource has been succesfully attached to media element.


#### hlsjs.onHlsMediaAttached
Type `function`

Callback fired when MediaSource has been succesfully attached to media element.

#### hlsjs.onHlsMediaDetaching
Type `function`

Callback fired before detaching MediaSource from media element.


#### hlsjs.onHlsMediaDetached
Type `function`

Callback fired when MediaSource has been detached from media element.


#### hlsjs.onHlsBufferReset
Type `function`

Callback fired when the buffer is going to be resetted.


#### hlsjs.onHlsBufferCodecs
Type `function`

Callback fired when we know about the codecs that we need buffers for to push into.


#### hlsjs.onHlsBufferAppending
Type `function`

Callback fired when we append a segment to the buffer.


#### hlsjs.onHlsBufferAppended
Type `function`

Callback fired when we are done with appending a media segment to the buffer.

#### hlsjs.onHlsBufferEos
Type `function`

Callback fired when the stream is finished and we want to notify the media buffer that there will be no more data.

#### hlsjs.onHlsBufferFlushing
Type `function`

Callback fired when the media buffer should be flushed.

#### hlsjs.onHlsBufferFlushed
Type `function`

Callback fired when the media has been flushed.

#### hlsjs.onHlsManifestLoading
Type `function`

Callback fired to signal that a manifest loading starts.

#### hlsjs.onHlsManifestLoaded
Type `function`

Callback fired after manifest has been loaded.

#### hlsjs.onHlsManifestParsed
Type `function`

Callback fired after manifest has been parsed.

#### hlsjs.onHlsLevelLoading
Type `function`

Callback fired when a level playlist loading starts.

#### hlsjs.onHlsLevelLoaded
Type `function`

Callback fired when a level playlist loading finishes.

#### hlsjs.onHlsLevelUpdated
Type `function`

Callback fired when a level's details have been updated based on previous details, after it has been loaded.

#### hlsjs.onHlsLevelPtsUpdated
Type `function`

Callback fired when a level's PTS information has been updated after parsing a fragment.

#### hlsjs.onHlsLevelSwitch
Type `function`

Callback fired when a fragment loading starts.

#### hlsjs.onHlsFragLoading
Type `function`

Callback fired when a fragment loading starts - data: { frag : fragment object}.

#### hlsjs.onHlsFragLoadProgress
Type `function`

Callback fired when a fragment loading is progressing .

#### hlsjs.onHlsFragLoadEmergencyAborted
Type `function`

Callback fired when a fragment load is aborting due to an emergency switch down.

#### hlsjs.onHlsFragLoaded
Type `function`

Callback fired when a fragment loading is completed.

#### hlsjs.onHlsFragParsingInitSegment
Type `function`

Callback fired when Init Segment has been extracted from fragment.

#### hlsjs.onHlsFragParsingUserdata
Type `function`

Callback fired when parsing sei text is completed.

#### hlsjs.onHlsFragParsingMetadata
Type `function`

Callback fired when parsing id3 is completed.

#### hlsjs.onHlsFragParsingData
Type `function`

Callback fired when data have been extracted from fragment.

#### hlsjs.onHlsFragParsed
Type `function`

Callback fired when fragment parsing is completed.

#### hlsjs.onHlsFragBuffered
Type `function`

Callback fired when fragment remuxed MP4 boxes have all been appended into SourceBuffer.

#### hlsjs.onHlsFragChanged
Type `function`

Callback fired when fragment matching with current media position is changing.

#### hlsjs.onHlsFpsDrop
Type `function`

Callback fired when a FPS drop event occurs.

#### hlsjs.onHlsFpsDropLevelCapping
Type `function`

Callback fired when FPS drop triggers auto level capping.

#### hlsjs.onHlsError
Type `function`

Callback fired when an Error occurs.

#### hlsjs.onHlsDestroying
Type `function`

Callback fired when hls.js instance starts destroying. Different from MEDIA_DETACHED as one could 
want to detach and reattach a media to the instance of hls.js to handle mid-rolls for example.

#### hlsjs.onHlsKeyLoading
Type `function`

Callback fired when a decrypt key loading starts.

#### hlsjs.onHlsKeyLoaded
Type `function`

Callback fired when a decrypt key loading is completed.

## Original Author

This project was forked from: [videojs-hlsjs](https://github.com/benjipott/videojs-hlsjs), credits to the
original author.