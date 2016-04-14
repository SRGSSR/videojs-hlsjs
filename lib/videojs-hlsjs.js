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

    createEl: function() {
      this.el_ = Html5.prototype.createEl.apply(this, arguments);

      this._initHls();
      this.el_.tech = this;
      return this.el_;
    },

    _initHls: function() {
      this.hls_ = new Hls(this.options_.hls);
      this.hls_.on(Hls.Events.MEDIA_ATTACHED, videojs.bind(this, this.onMediaAttached));
      this.hls_.on(Hls.Events.MANIFEST_PARSED, videojs.bind(this, this.onManifestParsed));
      this.hls_.on(Hls.Events.LEVEL_LOADED, videojs.bind(this, this.onLevelLoaded));
      this.hls_.on(Hls.Events.ERROR, videojs.bind(this, this.onError));
      this.el_.addEventListener('error', videojs.bind(this, this.onMediaError));
      this._bindExternalCallbacks();
      this.hls_.attachMedia(this.el_);
      this.wasPaused_ = undefined;
    },

    _getOptionsCallbackForEvent: function(evt) {
      var capitalize = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }, callback = this.options_['on' + capitalize(evt)];

      if (callback && typeof callback === 'function') {
        return callback;
      }
    },

    _bindEvtCallback: function(evt) {
      var callback = this._getOptionsCallbackForEvent(evt);

      if (callback) {
        this.hls_.on(evt, videojs.bind(this, function(evt, data) {
          var fn = this._getOptionsCallbackForEvent(evt);
          fn(this.hls_, data);
        }));
      }
    },

    _bindExternalCallbacks: function() {
      var key;

      for(key in Hls.Events) {
        if (Object.prototype.hasOwnProperty.call(Hls.Events, key)) {
          this._bindEvtCallback(Hls.Events[key]);
        }
      }
    },

    onMediaAttached: function() {
      this.triggerReady();
      if (this.wasPaused_) {
        this.pause();
      }
    },

    onLevelLoaded: function(event, data) {
      this.duration = data.details.live ? function () {return Infinity;} : Html5.prototype.duration;
    },

    onManifestParsed: function() {
      if (this.autoplay() && this.paused() && !this.wasPaused_) {
        this.play();
      }
    },

    setSrc: function(src) {
      this.hls_.destroy();
      this._initHls();
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
        } else if (data.details === Hls.ErrorDetails.BUFFER_APPENDING_ERROR) {
          this.wasPaused_ = this.paused();
          this.hls_.swapAudioCodec();
          this.hls_.recoverMediaError();
        }

        this.trigger('waiting');
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
