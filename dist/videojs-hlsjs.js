/*! videojs-hlsjs - v0.0.3 - 2016-02-22
* Copyright (c) 2016 benjipott; Licensed Apache-2.0 */
/*! videojs-hls - v0.0.0 - 2015-9-24
 * Copyright (c) 2015 benjipott
 * Licensed under the Apache-2.0 license. */
(function (window, videojs, Hls, document, undefined) {
  'use strict';

  /**
  * Initialize the plugin.
  * @param options (optional) {object} configuration for the plugin
  */
  var Component = videojs.getComponent('Component'),
      Tech = videojs.getTech('Tech'),
      Html5 = videojs.getComponent('Html5');

  var Hlsjs = videojs.extend(Html5, {
    createEl: function() {
      this.hls_ = new Hls(this.options_.hls);
      this.el_ = Html5.prototype.createEl.apply(this, arguments);

      this.hls_.on(Hls.Events.MEDIA_ATTACHED, videojs.bind(this, this.onMediaAttached));
      this.hls_.on(Hls.Events.MANIFEST_PARSED, videojs.bind(this, this.onManifestParsed));
      this.hls_.on(Hls.Events.LEVEL_LOADED, videojs.bind(this, this.onLevelLoaded));
      this.hls_.on(Hls.Events.LEVEL_SWITCH, videojs.bind(this, this.onLevelSwitched));
      this.hls_.on(Hls.Events.ERROR, videojs.bind(this, this.onError));
      this.hls_.attachMedia(this.el_);

      this.el_.tech = this;
      return this.el_;
    },

    onMediaAttached: function() {
      this.triggerReady();
    },

    onLevelSwitched: function(evt, data) {
      if ('onLevelSwitched' in this.options_ && typeof this.options_.onLevelSwitched === 'function') {
        this.options_.onLevelSwitched(this.hls_, data);
      }
    },

    onLevelLoaded: function(event, data) {
      this.duration = data.details.live ? function () {return Infinity;} : Html5.prototype.duration;
    },

    onManifestParsed: function() {
      if ('onManifestParsed' in this.options_ && typeof this.options_.onManifestParsed === 'function') {
        this.options_.onManifestParsed(this.hls_);
      }

      if (this.autoplay() && this.paused()) {
        this.play();
      }
    },

    setSrc: function(src) {
      this.hls_.loadSource(src);
    },

    onError: function(event, data) {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            videojs.log.warn('HLSJS: Network error encountered: "' + data.details + '", trying to recover...');
            this.hls_.startLoad();
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            videojs.log.warn('HLSJS: Media error encountered: "' + data.details + '", trying to recover...');
            this.hls_.swapAudioCodec();
            this.hls_.recoverMediaError();
            break;
          default:
            videojs.log.error('HLSJS: Fatal error encountered: "' + data.details + '", aborting playback.');
            this.hls_.destroy();
            break;
        }
      }

      if (data.details === Hls.ErrorDetails.BUFFER_APPENDING_ERROR) {
        this.hls_.swapAudioCodec();
        this.hls_.recoverMediaError();
        if (this.paused()) {
          this.pause();
        }
      }

      videojs.log.warn('HLSJS: An error occurred: "' + data.details + '"');
    },

    dispose: function() {
      this.hls_.destroy();
      return Html5.prototype.dispose.apply(this);
    }
  });

  Hlsjs.isSupported = function() {
    return Hls.isSupported();
  };

  Hlsjs.canPlaySource = function(source) {
    return !(videojs.options.hlsjs.favorNativeHLS && Html5.canPlaySource(source)) &&
      (source.type && /^application\/(?:x-|vnd\.apple\.)mpegurl/i.test(source.type)) &&
      Hls.isSupported();
  };

  videojs.options.hlsjs = {
    /**
     * Whether to favor native HLS playback or not.
     * @type {boolean}
     * @default true
     */
    favorNativeHLS: true
  };

  Component.registerComponent('Hlsjs', Hlsjs);
  Tech.registerTech('Hlsjs', Hlsjs);
  videojs.options.techOrder.push('Hlsjs');

})(window, videojs, Hls, document);
