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
    createEl : function() {
      this.hls_ = new Hls();
      this.el_ = Html5.prototype.createEl.apply(this, arguments);

      this.hls_.on(Hls.Events.MEDIA_ATTACHED, videojs.bind(this, this.onMediaAttached));
      this.hls_.on(Hls.Events.MANIFEST_PARSED, videojs.bind(this, this.onManifestParsed));
      this.hls_.on(Hls.Events.LEVEL_LOADED, videojs.bind(this, this.onLevelLoaded));
      this.hls_.on(Hls.Events.ERROR, videojs.bind(this, this.onError));
      this.hls_.attachMedia(this.el_);
      this.src(this.options_.source.src);

      this.el_.tech = this;
      return this.el_;
    },
    onMediaAttached: function() {
      this.triggerReady();
    },
    onLevelLoaded: function(event, data) {
      this.duration = data.details.live ? function () {return Infinity;} : Html5.prototype.duration;
    },
    onManifestParsed: function() {
      if (this.player().options().autoplay) {
        this.player().play();
      }
    },
    setSrc: function(src) {
      this.hls_.loadSource(src);
    },
    onError: function(event, data) {
      if (data.type) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            videojs.log.warn('HLSJS: Network error encountered: "' + data.details + '", trying to recover...');
            this.hls_.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            videojs.log.warn('HLSJS: Media error encountered: "' + data.details + '", trying to recover...');
            this.hls_.swapAudioCodec();
            this.hls_.recoverMediaError();
            this.player().play();
            break;
          default:
            videojs.log.error('HLSJS: Fatal error encountered: "' + data.details + '", aborting playback.');
            this.hls_.destroy();
            break;
          }
        }
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
      if (Html5.canPlaySource(source)) {
        return false;
      } else {
        return Hls.isSupported();
      }
    };

    Component.registerComponent('Hlsjs', Hlsjs);
    Tech.registerTech('Hlsjs', Hlsjs);
    videojs.options.techOrder.push('Hlsjs');

}) (window, videojs, Hls, document);