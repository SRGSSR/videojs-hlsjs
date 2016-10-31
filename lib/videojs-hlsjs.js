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
    _initHls: function() {
      this.hls_ = new Hls(this.options_.hls);
      this._bindExternalCallbacks();
      this.hls_.on(Hls.Events.MEDIA_ATTACHED, videojs.bind(this, this.onMediaAttached));
      this.hls_.on(Hls.Events.MANIFEST_PARSED, videojs.bind(this, this.onManifestParsed));
      this.hls_.on(Hls.Events.ERROR, videojs.bind(this, this.onError));
      this.el_.addEventListener('error', videojs.bind(this, this.onMediaError));

      this.wasPaused_ = undefined;
      this.startPosition_ = undefined;
      this.endPosition_ = undefined;

      this.hls_.attachMedia(this.el_);
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

    buffered: function() {
      var buffer = Html5.prototype.buffered.call(this);
      if (this.startPosition_ && buffer) {
          var startPosition = this.startPosition_, bufferWrapper = {
            length: buffer.length,
            _buffer: buffer,
            _startPosition: startPosition,

            start : function(range) {
              return this._buffer.start(range) - this._startPosition;
            },
            end: function(range) {
              return this._buffer.end(range) - this._startPosition;
            }
          };
          return bufferWrapper;
      } else {
        return buffer;
      }
    },

    _currentFragmentTimeRange: function() {
      var range;
      if (this.hls_ && this.hls_.currentLevel >= 0) {
        var details = this.hls_.levels[this.hls_.currentLevel].details,
            fragments = details.fragments, isLive = details.isLive,
            firstFragment = fragments[((!isLive) ? 0 : 1)],
            lastFragment = fragments[((!isLive) ? fragments.length-1 : fragments.length-3)];

        range =  {
          start: firstFragment.start,
          end: lastFragment.start + lastFragment.duration
        };
      }

      return (range) ? range : {start: 0, end: this._getNativeDuration()};
    },

    _getNativeDuration: function() {
      var duration = Html5.prototype.duration.apply(this);

      if (this.endPosition_) {
        duration = this.endPosition_ - (this.startPosition_ ? this.startPosition_ : 0);
      }

      return duration;
    },

    duration: function() {
      var timeRange = this._currentFragmentTimeRange();
      return timeRange.end - timeRange.start;
    },

    setCurrentTime: function(seconds) {
      var time = seconds;
      if (this.endPosition_ && this.endPosition_ <= seconds) {
        time = this.endPosition_;
      } else {
        var timeRange = this._currentFragmentTimeRange();

        time = timeRange.start + time;
        time = (timeRange.end < time) ? timeRange.end : time;

        time = time + (this.startPosition_ ? this.startPosition_ : 0);
      }

      Html5.prototype.setCurrentTime.call(this, time);
    },

    currentTime: function() {
      var time = Html5.prototype.currentTime.apply(this),
          timeRange = this._currentFragmentTimeRange(),
          // time is not in range we are dealing with and hls live stream
          seconds = (time < timeRange.start) ? time : time - timeRange.start;

      seconds = seconds - (this.startPosition_? this.startPosition_ : 0);
      if (this.endPosition_) {
        if (this.endPosition_ > time) {
          this.endPositionReached_ = false;
        } else if (!this.endPositionReached_) {
          this.pause();
          this.endPositionReached_ = true;
          this.trigger('ended');
        }
      }

      return seconds < 0 ? 0 : seconds;
    },

    ended: function() {
      return this.endPositionReached_ || Html5.prototype.ended.call(this);
    },

    seekable: function() {
      var timeRange = Html5.prototype.seekable.apply(this);
      if (timeRange.length > 0) {
        return {
          start: function() { return 0; },
          end: function() { return this.duration(); }.bind(this),
          length: 1
        };
      } else {
        return timeRange;
      }
    },

    onManifestParsed: function() {
      this.hls_.startLoad(this.startPosition_);
      if (this.autoplay() && this.paused() && !this.wasPaused_) {
        this.play();
      }
    },

    _parseParams: function(paramsStr) {
      var params = {};

      if (paramsStr && paramsStr.length > 0) {
        var uriParams = paramsStr.split('&'), i;
        for (i = 0; i < uriParams.length; i++) {
          var pair = uriParams[i].split('=');
          params[pair.shift()] = decodeURIComponent(pair.join('='));
        }
      }

      return params;
    },

    _toUrlParams: function(params) {
      var query = [], key;

      for (key in params) {
        if (params.hasOwnProperty(key)) {
          query.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
      }

      return query.join('&');
    },

    _toNumber: function(str) {
      var n = Number(str);
      return (n && !isNaN(n)) ? n : undefined;
    },

    _setPositionFromSource: function(src) {
      var paramsIndex = src.indexOf('?'),
          paramsStr = (paramsIndex>0) ? src.slice(paramsIndex+1) : '',
          base = (paramsIndex>0) ? src.slice(0, paramsIndex) : src,
          params = this._parseParams(paramsStr);

      if (params.start) {
        this.startPosition_ = this._toNumber(params.start);
        delete params.start;
      }

      if (params.end) {
        this.endPosition_ = this._toNumber(params.end);
        delete params.end;
      }

      return base + ((paramsStr.length > 0) ? ('?' + this._toUrlParams(params) ) : '');
    },

    setSrc: function(src) {
      if (this.hls_) {
        this.hls_.destroy();
      }

      this._initHls();
      this.hls_.loadSource(this._setPositionFromSource(src));
    },

    onMediaError: function(event) {
      var error = event.currentTarget.error;
      if (error && error.code === error.MEDIA_ERR_DECODE) {
        var data = {
          type: Hls.ErrorTypes.MEDIA_ERROR,
          fatal: true,
          details: 'mediaErrorDecode'
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
      if (this.hls_) {
        this.hls_.destroy();
      }
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
    favorNativeHLS: true,
    hls: {
      autoStartLoad: false
    }
  };

  Component.registerComponent('Hlsjs', Hlsjs);
  Tech.registerTech('Hlsjs', Hlsjs);
  if (techOrderIndex > -1) {
    videojs.options.techOrder.splice(techOrderIndex, 0, 'Hlsjs');
  } else {
    videojs.options.techOrder.push('Hlsjs');
  }

})(window, videojs, Hls, document);
