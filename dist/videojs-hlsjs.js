/*! videojs-hlsjs - v1.2.1 - 2017-01-25*/
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
    initHls_: function() {
      this.hls_ = new Hls(this.options_.hls);

      this.bindExternalCallbacks_();

      this.hls_.on(Hls.Events.MEDIA_ATTACHED, videojs.bind(this, this.onMediaAttached_));
      this.hls_.on(Hls.Events.MANIFEST_PARSED, videojs.bind(this, this.onManifestParsed_));
      this.hls_.on(Hls.Events.LEVEL_SWITCH, videojs.bind(this, this.onLevelSwitch_));
      this.hls_.on(Hls.Events.ERROR, videojs.bind(this, this.onError_));

      this.el_.addEventListener('error', videojs.bind(this, this.onMediaError_));

      this.forceLevel_ = undefined;
      this.lastLevel_ = undefined;
      this.starttime_ = -1;
      this.levels_ = [];

      this.hls_.attachMedia(this.el_);
    },

    bindExternalCallbacks_: function() {
      var resolveCallbackFromOptions = function(evt, options, hls) {
        var capitalize = function(str) {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }, createCallback = function(callback, hls) {
          return function(evt, data) {
            callback(hls, data);
          };
        }, callback = options['on' + capitalize(evt)];

        if (callback && typeof callback === 'function') {
          return createCallback(callback, hls);
        }
      }, key;

      for(key in Hls.Events) {
        if (Object.prototype.hasOwnProperty.call(Hls.Events, key)) {
          var evt = Hls.Events[key],
              callback = resolveCallbackFromOptions(evt, this.options_, this.hls_);

          if (callback) {
            this.hls_.on(evt, videojs.bind(this, callback));
          }
        }
      }
    },

    onMediaAttached_: function() {
      this.triggerReady();
    },

    currentFragmentTimeRange_: function() {
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
      return (range) ? range : {start: 0, end: Html5.prototype.duration.apply(this)};
    },

    duration: function() {
      var timeRange = this.currentFragmentTimeRange_();
      return timeRange.end - timeRange.start;
    },

    currentTime: function() {
      if (this.hls_.currentLevel !== this.lastLevel_) {
        this.trigger('levelswitched');
      }

      this.lastLevel_ = this.hls_.currentLevel;
      return Html5.prototype.currentTime.apply(this);
    },

    seekable: function() {
      var timeRange = this.currentFragmentTimeRange_();
      return {
        start: function() { return timeRange.start; },
        end: function() { return timeRange.end; },
        length: 1
      };
    },

    onManifestParsed_: function() {
      var hasAutoLevel = !this.options_.disableAutoLevel, startLevel, autoLevel;

      this.parseLevels_();

      if (this.levels_.length > 0) {
        if (this.options_.setLevelByHeight) {
          startLevel = this.getLevelByHeight_(this.options_.setLevelByHeight);
          autoLevel = false;
        } else if (this.options_.startLevelByHeight) {
          startLevel = this.getLevelByHeight_(this.options_.startLevelByHeight);
          autoLevel = hasAutoLevel;
        } 

        if (!hasAutoLevel && (!startLevel || startLevel.index === -1)) {
          startLevel = this.levels_[this.levels_.length-1];
          autoLevel = false;
        }
      } else if (!hasAutoLevel) {
        startLevel = {index: this.hls_.levels.length-1};
        autoLevel = false;
      }

      if (startLevel) {
        if (!autoLevel) {
          this.setLevel(startLevel);
        }
        this.hls_.startLevel = startLevel.index;
      }

      if (this.autoplay() && this.paused()) {
        this.play();
      }

      this.hls_.startLoad(this.starttime());
      this.trigger('levelsloaded');
    },

    onLevelSwitch_: function() {
      if (this.forceLevel_) {
        if (this.hls_.loadLevel !== this.forceLevel_.index) {
          this.hls_.loadLevel = this.forceLevel_.index;
        }
      }
    },

    getLevelByHeight_: function (h) {
      var i, result;
      for (i = 0; i < this.levels_.length; i++) {
        var cLevel = this.levels_[i],
            cDiff = Math.abs(h - cLevel.height),
            pLevel = result,
            pDiff = (pLevel !== undefined) ? Math.abs(h - pLevel.height) : undefined;

        if (pDiff === undefined || (pDiff > cDiff)) {
          result = this.levels_[i];
        }
      }
      return result;
    },

    parseLevels_: function() {
      this.levels_ = [];
      this.forceLevel_ = undefined;

      if (this.hls_.levels) {
        var i;

        if (!this.options_.disableAutoLevel) {
          this.levels_.push({
            label: 'auto',
            index: -1,
            height: -1
          });
          this.forceLevel_ = this.levels_[0];
        }

        for (i = 0; i < this.hls_.levels.length; i++) {
          var level = this.hls_.levels[i];
          if (level.height) {
            this.levels_.push({
                label: level.height + 'p',
                index: i,
                height: level.height
            });
          }
        }

        if (this.levels_.length <= 1) {
          this.levels_ = [];
          this.forceLevel_ = undefined;
        }
      }
    },

    setSrc: function(src) {
      if (this.hls_) {
        this.hls_.destroy();
      }

      if (this.forceLevel_) {
        this.options_.setLevelByHeight = this.forceLevel_.height;
      }

      this.initHls_();
      this.hls_.loadSource(src);
    },

    onMediaError_: function(event) {
      var error = event.currentTarget.error;
      if (error && error.code === error.MEDIA_ERR_DECODE) {
        var data = {
          type: Hls.ErrorTypes.MEDIA_ERROR,
          fatal: true,
          details: 'mediaErrorDecode'
        };

        this.onError_(event, data);
      }
    },

    onError_: function(event, data) {
      var abort = [Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
                   Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT,
                   Hls.ErrorDetails.MANIFEST_PARSING_ERROR];

      if (abort.indexOf(data.details) >= 0) {
        videojs.log.error('HLSJS: Fatal error: "' + data.details + '", aborting playback.');
        this.hls_.destroy();
        this.error = function() {
          return {code: 3};
        };
        this.trigger('error');
      } else {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              videojs.log.warn('HLSJS: Network error: "' + data.details + '", trying to recover...');
              this.hls_.startLoad();
              this.trigger('waiting');
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              var startLoad = function() {
                this.hls_.startLoad();
                this.hls_.off(startLoad);
              }.bind(this);

              videojs.log.warn('HLSJS: Media error: "' + data.details + '", trying to recover...');
              this.hls_.swapAudioCodec();
              this.hls_.recoverMediaError();
              this.hls_.on(Hls.Events.MEDIA_ATTACHED, startLoad);

              this.trigger('waiting');
              break;
            default:
              videojs.log.error('HLSJS: Fatal error: "' + data.details + '", aborting playback.');
              this.hls_.destroy();
              this.error = function() {
                return {code: 3};
              };
              this.trigger('error');
              break;
          }
        }
      }
    },

    currentLevel: function() {
      var hasAutoLevel = !this.options_.disableAutoLevel;
      return (this.forceLevel_.index === -1) ?
                this.levels_[(hasAutoLevel) ? this.hls_.currentLevel+1  : this.hls_.currentLevel] :
                this.forceLevel_;
    },

    isAutoLevel: function() {
      return this.forceLevel_.index === -1;
    },

    setLevel: function(level) {
      this.forceLevel_ = level;
      this.hls_.currentLevel = level.index;
      this.hls_.loadLevel = level.index;
    },

    supportsStarttime: function() {
      return true;
    },

    starttime: function(starttime) {
      if (starttime) {
        this.starttime_ = starttime;
      } else {
        return this.starttime_;
      }
    },

    getLevels: function() {
      return this.levels_;
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

})(window, window.videojs, window.Hls, document);
