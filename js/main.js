(function () {
  window.App = {
    moduleInits: [],

    // ----------
    init: function () {
      _.each(this.moduleInits, function (v, i) {
        v();
      });
    },

    // ----------
    loadMovie: function (id) {
      var data = localStorage.getItem('movie:' + id);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('[App.loadMovie]', e);
        }
      }

      return null;
    },

    // ----------
    saveMovie: function (movie) {
      localStorage.setItem('movie:' + movie.id, JSON.stringify(movie));
    },

    // ----------
    getYouTube: function (title) {
      var url =
        'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' +
        encodeURIComponent(title) +
        '+trailer&type=video&key=AIzaSyAk2oDaN7Ffxw4SXjPKETlk-0YjbLSTYVU';

      return $.ajax({
        url: url,
        error: function (xhr, textStatus, errorThrown) {
          console.error('[App.getYouTube]', textStatus, errorThrown);
        }
      });
    },

    // ----------
    getTmdb: function (config) {
      var url = 'https://api.themoviedb.org/3/';

      if (config.type === 'movie') {
        url += 'movie/' + config.id;
      } else if (config.type === 'tv') {
        url += 'tv/' + config.id;
      } else if (config.type === 'discover') {
        url +=
          'discover/movie?primary_release_date.gte=' +
          config.startDate +
          '&primary_release_date.lte=' +
          config.endDate +
          '&vote_count.gte=8&sort_by=vote_average.desc&include_adult=false&page=' +
          config.page;
      } else if (config.type === 'search') {
        url += 'search/movie?query=' + encodeURIComponent(config.query);
      } else if (config.type === 'trending') {
        url += 'trending/' + config.kind + '/week?page=' + config.page;
      }

      return $.ajax({
        url: '../proxy.php?url=' + encodeURIComponent(url),
        error: function (xhr, textStatus, errorThrown) {
          console.error('[App.getTmdb]', textStatus, errorThrown);
        }
      });
    },

    // ----------
    getRss: function (config) {
      //TODO
    },

    // ----------
    template: function (name, config) {
      var rawTemplate = $('#' + name + '-template').text();
      var template = _.template(rawTemplate);
      var html = template(config);
      var $container = $('<div>').addClass(name).html(html);

      return $container;
    }
  };

  // ----------
  $(document).ready(function () {
    App.init();
  });
})();
