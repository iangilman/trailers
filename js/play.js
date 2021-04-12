(function() {

  var isMobile = /mobile/i.test(navigator.userAgent);
  // isMobile = true;

  App.Play = {
    // ----------
    init: function() {
      var self = this;

      this.stateMap = {
        unstarted: -1,
        ended: 0,
        playing: 1,
        paused: 2,
        buffering: 3,
        cued: 5
      };

      this.tmdbPage = 1;
      this.movies = [];

      if (/^#id=/i.test(location.hash)) {
        var id = location.hash.replace(/^#id=/i, '');
        if (id) {
          if (window.history) {
            history.replaceState({}, '', '.');
          } else {
            location.hash = '';
          }

          var movieData = localStorage.getItem('movie:' + id);
          var movie;
          try {
            movie = JSON.parse(movieData);
          } catch (e) {
          }

          if (movie) {
            this.movies.push(movie);
          }
        }
      }

      this._incomingFeeds = [
        'http://feeds.filmjabber.com/Movies-Coming-Soon-FilmJabber?format=xml',
        'http://www.fandango.com/rss/comingsoonmovies.rss',
        'http://feeds.filmjabber.com/Movie-sourcecomCurrentMovies?format=xml',
        'http://www.fandango.com/rss/top10boxoffice.rss',
        'http://www.fandango.com/rss/newmovies.rss',
        'http://dvd.netflix.com/NewReleasesRSS',
        'http://feeds.filmjabber.com/Movie-sourcecomDvdReleaseDates?format=xml',
        'http://feeds.filmjabber.com/UpcomingDVD?format=xml',
        'http://dvd.netflix.com/Top100RSS'
      ];

      this.loadMoviesRss();

      this.spinner = new Spinner({
        color: '#888'
      }).spin($('.main-content')[0]);

      if (isMobile) {
        $('.cover').hide();
        $('.play-mode').addClass('mobile');
      } else {
        $(window).mousemove(function() {
          $('.hover').show();
          clearTimeout(self.hoverTimeout);
          self.hoverTimeout = setTimeout(function() {
            $('.hover').fadeOut();
          }, 3000);
        });
      }

      $('.rewind-button').click(function() {
        self.rewind();
      });

      $('.skip-button').click(function() {
        self.skip();
      });

      $('.yes-button').click(function() {
        self.yesVote();
      });

      $('.no-button').click(function() {
        self.noVote();
      });

      $('.pause-button').click(function() {
        self.togglePause();
      });

      $(window).keyup(function(event) {
        if (!self.player) {
          return;
        }

        if (event.which === 32) {
          self.togglePause();
        } else if (event.which === 39) { // Right arrow
          self.skip();
        } else if (event.which === 37) { // Left arrow
          self.rewind();
        } else if (event.which === 38) { // Up arrow
          self.yesVote();
        } else if (event.which === 40) { // Down arrow
          self.noVote();
        } else if (event.which === 73) { // i
          self.player.stopVideo();
          self.startInterstitial('after');
        } else if (event.which === 74) { // j
          if (self.mode !== 'interstitial') {
            self.player.seekTo(Math.max(0, self.player.getCurrentTime() - 5), true);
          }
        }
         // console.log(event.which);
      });
    },

    // ----------
    togglePause: function() {
      var paused;
      if (this.mode === 'interstitial') {
        paused = this.paused = !this.paused;
      } else {
        if (this.player.getPlayerState() === this.stateMap.paused) {
          this.player.playVideo();
          paused = false;
        } else {
          this.player.pauseVideo();
          paused = true;
        }
      }

      if (paused) {
        this.animateAction('fa-pause');
        $('.pause-button')
          .removeClass('fa-pause')
          .addClass('fa-play');
      } else {
        this.animateAction('fa-play');
        $('.pause-button')
          .removeClass('fa-play')
          .addClass('fa-pause');
      }
    },

    // ----------
    skip: function() {
      this.rememberMovie();
      this.endInterstitial();
      this.animateAction('fa-forward');
      this.next();
    },

    // ----------
    rewind: function() {
      this.endInterstitial();
      this.player.seekTo(0, true);
      this.animateAction('fa-backward');
    },

    // ----------
    yesVote: function() {
      this.movie.interest = 'yes';
      this.rememberMovie();
      this.animateAction('fa-thumbs-o-up');
      if (this.mode === 'interstitial' && this.subMode === 'after') {
        this.next();
      }
    },

    // ----------
    noVote: function() {
      this.movie.interest = 'no';
      this.rememberMovie();
      this.endInterstitial();
      this.animateAction('fa-thumbs-o-down');
      this.next();
    },

    // ----------
    animateAction: function(icon) {
      var $icon = $('<div>')
        .addClass('icon-animation fa fa-border fa-3x ' + icon)
        .appendTo('.main-content')
        .velocity({
          scale: 5,
          opacity: 0
        }, {
          complete: function() {
            $icon.remove();
          }
        });
    },

    // ----------
    next: function() {
      var self = this;

      if (this.movies.length < 10) {
        this.loadMoviesRss();
      }

      var movie = this.movies.shift();

      if (!movie) {
        return;
      }

      this.loadingNext = true;
      $.when(App.getYouTube(movie.title), App.getTmdb({ type: 'movie', id: movie.id }))
        .done(function(youtube, tmdb) {
          self.loadingNext = false;
          youtube = (youtube && youtube.length ? youtube[0] : null);
          tmdb = (tmdb && tmdb.length ? tmdb[0] : null);
          if (youtube && youtube.items && youtube.items[0] && youtube.items[0].id && youtube.items[0].id.videoId) {
            youtube = youtube.items[0];

            if (youtube.snippet && youtube.snippet.title) {
              var youtubeTitle = self._cleanMatchString(youtube.snippet.title);
              var movieTitle = self._cleanMatchString(movie.title);
              movie.youtubeTitleMatch = (youtubeTitle.indexOf(movieTitle) !== -1);
              // console.log(youtube.snippet.title, youtubeTitle, movieTitle, movie.youtubeTitleMatch);
            } else {
              movie.youtubeTitleMatch = false;
            }

            if (tmdb) {
              movie.genres = tmdb.genres;
              movie.imdb_id = tmdb.imdb_id;
              movie.tagline = tmdb.tagline || tmdb.overview;
            }

            movie.videoId = youtube.id.videoId;
            self.movie = movie;

            if (isMobile) {
              self.spinner.stop();
              self.play(self.movie.videoId);
            } else {
              self.startInterstitial('before');
            }
          } else {
            self.next();
          }
        })
        .fail(function() {
          self.loadingNext = false;
          console.error('[Play.next] failed to get ' + movie.title);
          self.next();
        });
    },

    // ----------
    _cleanMatchString: function(string) {
      return string.toLowerCase()
        .replace(/\bthe\b/g, '')
        .replace(/[^a-z\d]/g, '');
    },

    // ----------
    play: function(id) {
      if (isMobile && !this.playerCreated) {
        this.createPlayer(id);
        return;
      }

      if (!this.player) {
        this.firstId = id;
        return;
      }

      this.player.loadVideoById(id);
      $('.play-mode .info').text(this.movie.title +
        ' (' + (this.movie.youtubeTitleMatch ? '+' : '-') + ')' +
        ', rating: ' + this.movie.vote_average + ' (' + this.movie.vote_count + ' votes)' +
        ', popularity: ' +
        Math.round(this.movie.popularity) + ', remaining: ' + this.movies.length);
    },

    // ----------
    startInterstitial: function(subMode) {
      var self = this;

      if (this.mode === 'interstitial' && this.subMode === subMode) {
        return;
      }

      if (this.player) {
        this.player.pauseVideo();
      }

      this.spinner.stop();

      var count = (subMode === 'before' ? 6 : 10);
      $('.interstitial-mode').show();
      $('.count').text(count);
      $('.backdrop').css({
        'background-image': 'url(https://image.tmdb.org/t/p/w1280' + this.movie.backdrop_path + ')'
      });

      $('.poster').css({
        'background-image': 'url(https://image.tmdb.org/t/p/w780' + this.movie.poster_path + ')'
      });

      $('.title').text(this.movie.title);
      $('.tagline').text(this.movie.tagline || '');

      var text = '';
      if (this.movie.genres && this.movie.genres.length) {
        text = 'Genres: ' + _.pluck(this.movie.genres, 'name').join(', ');
      }

      $('.genres').text(text);
      $('.release-date').text('Release Date: ' + this.movie.release_date);

      this.mode = 'interstitial';
      this.subMode = subMode;
      this.paused = false;

      clearInterval(this.interstitialInterval);
      this.interstitialInterval = setInterval(function() {
        if (count === 0) {
          clearInterval(self.interstitialInterval);
          if (subMode === 'before') {
            self.endInterstitial();
            self.play(self.movie.videoId);
          } else {
            self.next();
          }

          return;
        }

        if (!self.paused) {
          count--;
          $('.count').text(count);
        }
      }, 1000);
    },

    // ----------
    endInterstitial: function() {
      if (this.mode !== 'interstitial') {
        return;
      }

      clearInterval(this.interstitialInterval);
      $('.interstitial-mode').hide();
      $('.backdrop').attr('src', '');
      this.mode = 'play';
    },

    // ----------
    rememberMovie: function() {
      if (!this.movie) {
        return;
      }

      App.saveMovie(this.movie);
    },

    // ----------
    loadMovies: function() {
      var self = this;

      var page = this.tmdbPage;
      this.tmdbPage++;

      var startDate = this.getDate(-7);
      var endDate = this.getDate(5);
      // console.log(startDate, endDate);

      App.getTmdb({
        type: 'discover',
        startDate: startDate,
        endDate: endDate,
        page: page
      }).done(function(data) {
        _.each(data.results, function(v, i) {
          // console.log(v.title, v.vote_average + '(' + v.vote_count + ')', v.release_date);
          if (!App.loadMovie(v.id) && !_.findWhere(self.movies, { id: v.id })) {
            self.movies.push(v);
          }
        });

        if (!self.movie && !self.loadingNext) {
          self.next();
        }
      });
    },

    // ----------
    // http://www.filmjabber.com/rss-movie-feeds/
    // http://www.fandango.com/rss/moviefeed
    loadMoviesRss: function() {
      var self = this;

      var url = this._incomingFeeds.shift();
      if (!url) {
        this.loadMovies();
        return;
      }

      var expected = 0;
      var completed = 0;

      var completion = function() {
        completed++;
        if (completed === expected) {
          if (!self.movie && !self.loadingNext) {
            self.next();
          }
        }
      };

      console.log('loading feed', url);
      
      $.ajax({
        url: '../proxy.php?url=' + encodeURIComponent(url),
        success: function(data) {
          var $data = $(data);
          var $title = $data.find('item title');
          $title.each(function(i, v) {
            var title = $(v).text()
              .replace(/\(.*\)/g, '')
              .replace(/^\d+\./, '')
              .replace(/\$.*$/, '');

            title = $.trim(title);

            if (/Search for other movies/i.test(title)) {
              return;
            }
            
            console.log('loading movie info', url, title);

            expected++;
            App.getTmdb({
              type: 'search',
              query: title
            }).done(function(data2) {
              // console.log(title, data2.results && data2.results.length > 0);
              if (data2 && data2.results && data2.results.length) {
                var id = data2.results[0].id;
                if (!App.loadMovie(id) && !_.findWhere(self.movies, { id: id })) {
                  self.movies.push(data2.results[0]);
                }
              }

              completion();
            }).fail(function() {
              console.warn('Unable to load', title);
              completion();
            });
          });
        },
        error: function(xhr, textStatus, errorThrown) {
          console.error('[App.getTmdb]', textStatus, errorThrown);
          self.loadMoviesRss();
        }
      });
    },

    // ----------
    getDate: function(addMonths) {
      var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      month += addMonths;
      if (month < 1) {
        month += 12;
        year -= 1;
      } else if (month > 12) {
        month -= 12;
        year += 1;
      }

      month = '' + month;
      if(month.length === 1) {
        month = '0' + month;
      }

      return year + '-' + month + '-01';
    },

    // ----------
    _printMovies: function() {
      _.each(this.movies, function(v, i) {
        console.log(v.title, v.popularity, v.vote_average, v.vote_count, v.release_date);
      });
    },

    // ----------
    onYouTubeIframeAPIReady: function() {
      if (!isMobile) {
        this.createPlayer();
      }
    },

    // ----------
    createPlayer: function(id) {
      var self = this;

      this.playerCreated = true;

      var player = new YT.Player('youtube-player', {
        videoId: id,
        playerVars: {
          // 'autoplay': 1,
          'controls': isMobile ? 1 : 0
        },
        events: {
          'onReady': function() {
            self.player = player;

            if (location.hash === '#mute') {
              self.player.mute();
            }

            if (self.firstId) {
              self.play(self.firstId);
            }
          },
          'onStateChange': function(event) {
            var state = event.data;
            // console.log(state);
            if (state === self.stateMap.ended) {
              self.rememberMovie();
              if (isMobile) {
                self.next();
              } else {
                self.startInterstitial('after');
              }
            }

            clearTimeout(self.bufferingTimeout);
            if (state === self.stateMap.buffering) {
              self.bufferingTimeout = setTimeout(function() {
                $('.buffering-message').show();
              }, 5000);
            } else {
              $('.buffering-message').hide();
            }
          }
        }
      });
    }
  };

  // ----------
  App.moduleInits.push(function() {
    App.Play.init();
  });

  // ----------
  window.onYouTubeIframeAPIReady = function() {
    App.Play.onYouTubeIframeAPIReady();
  };

})();
