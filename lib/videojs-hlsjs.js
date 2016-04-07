(function (window, videojs, Hls, document, undefined) {
  'use strict';

  /**
  * Initialize the plugin.
  * @param options (optional) {object} configuration for the plugin
  */
  var Component = videojs.getComponent('Component'),
      Tech = videojs.getTech('Tech'),
      Html5 = videojs.getComponent('Html5'),
      techOrderIndex = videojs.options.techOrder.indexOf('html5');

  var Hlsjs = videojs.extend(Html5, {
    _bindHls: function() {
      this.hls_ = new Hls(this.options_.hls);
      this.hls_.on(Hls.Events.MEDIA_ATTACHED, videojs.bind(this, this.onMediaAttached));
      this.hls_.on(Hls.Events.MANIFEST_LOADED, videojs.bind(this, this.onManifestLoaded));
      this.hls_.on(Hls.Events.MANIFEST_PARSED, videojs.bind(this, this.onManifestParsed));
      this.hls_.on(Hls.Events.LEVEL_LOADED, videojs.bind(this, this.onLevelLoaded));
      this.hls_.on(Hls.Events.LEVEL_SWITCH, videojs.bind(this, this.onLevelSwitched));
      this.hls_.on(Hls.Events.ERROR, videojs.bind(this, this.onError));
      this.el_.addEventListener('error', videojs.bind(this, this.onMediaError));
      this.hls_.attachMedia(this.el_);
      this.wasPaused_ = undefined;
    },

    createEl: function() {
      this.el_ = Html5.prototype.createEl.apply(this, arguments);

      this._bindHls();
      this.el_.tech = this;
      return this.el_;
    },

    onMediaAttached: function() {
      this.triggerReady();
      if (this.wasPaused_) {
        this.pause();
      }
    },

    onLevelSwitched: function(evt, data) {
      if ('onLevelSwitched' in this.options_ && typeof this.options_.onLevelSwitched === 'function') {
        this.options_.onLevelSwitched(this.hls_, data);
      }
    },

    onManifestLoaded: function(evt, data) {
      if ('onManifestLoaded' in this.options_ && typeof this.options_.onManifestLoaded === 'function') {
        this.options_.onManifestLoaded(this.hls_, data);
      }
    },

    onLevelLoaded: function(event, data) {
      this.duration = data.details.live ? function () {return Infinity;} : Html5.prototype.duration;
    },

    onManifestParsed: function() {
      if ('onManifestParsed' in this.options_ && typeof this.options_.onManifestParsed === 'function') {
        this.options_.onManifestParsed(this.hls_);
      }

      if (this.autoplay() && this.paused() && !this.wasPaused_) {
        this.play();
      }
    },

    setSrc: function(src) {
      this.hls_.destroy();
      this._bindHls();
      this.hls_.loadSource(src);
    },

    onMediaError: function(event) {
      var error = event.currentTarget.error;
      if (error && error.code === error.MEDIA_ERR_DECODE) {
        var data = {
          type: Hls.ErrorTypes.MEDIA_ERROR,
          fatal: true,
          details: "mediaErrorDecode"
        };

        this.onError(event, data);
      }
    },

    onError: function(event, data) {
      var abort = [Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
                   Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT,
                   Hls.ErrorDetails.MANIFEST_PARSING_ERROR];

      videojs.log.warn('HLSJS: An error occurred: "' + data.details + '"');
      if (abort.indexOf(data.details) >= 0) {
        this.hls_.destroy();
      } else {
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

        this.trigger('waiting');

        if (data.details === Hls.ErrorDetails.BUFFER_APPENDING_ERROR) {
          this.wasPaused_ = this.paused();
          this.hls_.swapAudioCodec();
          this.hls_.recoverMediaError();
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
  if (techOrderIndex > -1) {
    videojs.options.techOrder.splice(techOrderIndex, 0, 'Hlsjs');
  } else {
    videojs.options.techOrder.push('Hlsjs');
  }

})(window, videojs, Hls, document);
