(function() {

  App.List = {
    // ----------
    render: function() {
      var self = this;

      this.liked = [];
      this.hated = [];
      this.other = [];
      this.seen = [];

      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf("movie:") !== 0)
          continue;

        var movie = JSON.parse(localStorage[key]);
        if (movie.interest === 'yes') {
          this.liked.push(movie);
        } else if (movie.interest === 'no') {
          this.hated.push(movie);
        } else if (movie.interest === 'seen') {
          this.seen.push(movie);
        } else {
          this.other.push(movie);
        }
      }

      if (this.liked.length || this.hated.length || this.other.length || this.seen.length) {
        $('.watched').show();

        this.display({
          $el: $('.liked').empty(),
          movies: this.liked
        });

        this.display({
          $el: $('.hated').empty(),
          movies: this.hated
        });

        this.display({
          $el: $('.other').empty(),
          movies: this.other
        });

        this.display({
          $el: $('.seen').empty(),
          movies: this.seen
        });
      } else {
        $('.none-watched').show();
      }
    },

    // ----------
    display: function(config) {
      var self = this;

      var movies = _.sortBy(config.movies, function(v, i) {
        return v.release_date;
      });

      _.each(movies, function(v, i) {
        var $el = App.template('movie', v).appendTo(config.$el);

        $el.find('.play-button').click(function() {
          location.href = '../play/#id=' + v.id;
        });

        $el.find('.yes-button').click(function() {
          v.interest = 'yes';
          App.saveMovie(v);
          self.render();
        });

        $el.find('.no-button').click(function() {
          v.interest = 'no';
          App.saveMovie(v);
          self.render();
        });

        $el.find('.seen-button').click(function() {
          v.interest = 'seen';
          App.saveMovie(v);
          self.render();
        });
      });
    }
  };

  // ----------
  App.moduleInits.push(function() {
    App.List.render();
  });

})();
