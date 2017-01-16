app.views.searchbar = Backbone.View.extend({
	autocomplete_hidden			: true,
	max_trending_tags			: 20,
	trending_tags 				: [],
	trending_tags_last_fetched	: 0,
	trending_tags_refresh_age	: 1000 * 60 * 5, //five minutes
	trending_template			: _.template($('.autocomplete-tmp').html()),
	autocomplete_user_results	: [],
	autocomplete_board_results	: [],
	autocomplete_last_value		: '',
	autocomplete_timer			: null,
	autocomplete_cooldown		: 700,
	autocomplete_board_template	: _.template($('.autocomplete-tmp').html()), //use same one for now
	autocomplete_user_template	: _.template($('.autocomplete-tmp').html()), //use same one for now
	initialize: function(opts) {
		var self = this;
		this.opts = opts;
		//hide when non-search bar element is clicked
		self.listenTo(app, 'click', function(e) {
			if(e.target != self.$('#search')[0]) {
				//hide autocomplete
				self.autocomplete_hidden = true;
				self.$('#autocomplete-overlay').hide();
				self.clear();
			}
		});
		self.render();
	},
	search_val: '',
	events: {
		'click	#autocomplete-overlay'	: 'on_autocomplete_click',
		'click	#search-btn'			: 'perform_search',
		'focus 	#search'				: 'on_focus',
		'keyup 	#search'				: 'on_keyup'
	},
	hide: function() {
		$('#searchbar').addClass('hidden');
	},
	show: function() {
		$('#searchbar').removeClass('hidden');
	},
	set_search_value: function(value) {
		var self = this;
		self.search_val = value.replace(/-/g,' ');
		$('#search').val(self.search_val);
	},
	on_autocomplete_click: function(e) {
		var self = this;
		//do not let this get to app
		e.stopPropagation();
	},
	on_focus: function(e) {
		var self = this;
		//see if there is text input
		if(self.$('#search').val().length > 0) {
			//get autocomplete
			self.fetch_autocomplete();
		}
		else {
			//get trending tags
			self.fetch_trending_tags();
		}
		//show autocomplete if hidden
		if(self.autocomplete_hidden) {
			self.autocomplete_hidden = false;
			self.$('#autocomplete-overlay').show();
		}
	},
	on_keyup: function(e) {
		console.log('key up');
		var self = this;
		//check for enter
		if (e.keyCode == 13) {
			self.perform_search();
		} else if (self.$('#search').val().length > 0) {
			//clear any existing timer
			if(self.autocomplete_timer) {
				clearTimeout(self.autocomplete_timer);
			}
			//get the autocomplete results after timeout reached
			self.autocomplete_timer = setTimeout(function() {
				self.autocomplete_timer = null;
				//ensure search is still non-empty
				if(self.$('#search').val().length > 0) {
					self.fetch_autocomplete();
				} else {
					self.fetch_trending_tags();
				}
			}, self.autocomplete_cooldown);
		} else {
			//get trending tags
			self.fetch_trending_tags();
		}
	},
	perform_search: function() {
		var self = this;
		//ensure there is something to search for
		if(self.$('#search').val().length > 0) {
			app.router.navigate('#/discover/' + self.$('#search').val().replace(/ /g,'-'), true);
		}
	},
	render: function() {
		var self = this;
		$('#search').val(self.opts.search_term);
	},
	clear: function() {
		self.$('.trending-tag-left').html('');
		self.$('.trending-tag-right').html('');
		self.$('.autocomplete-boards').html('');
		self.$('.autocomplete-users').html('');
		self.$('#autocomplete-title').html('');
	},
	render_loading: function() {
		var self = this;
		self.$('#autocomplete-title').html('Loading...');
	},
	fetch_trending_tags: function() {
		var self = this;
		self.clear();
		//see if the trending tags are expired
		if(new Date().getTime() > self.trending_tags_last_fetched + self.trending_tags_refresh_age) {
			//load the trending tags
			self.render_loading();
			app.plugins.fetch({ endpoint: 'tags/trending/0/' + self.max_trending_tags, _type: 'GET' }, function(err, resp) {
				if (resp && resp.success) {
					self.trending_tags = resp.data;
					self.trending_tags_last_fetched = new Date().getTime();
				}
				else {
					//something went wrong
					self.trending_tags = [];
				}
				self.render_trending_tags();
			});
		}
		else {
			//trending tags are not stale yet, simply re-render
			self.render_trending_tags();
		}
	},
	render_trending_tags: function() {
		var self = this;
		self.clear();
		if(self.trending_tags.length > 0) {
			self.$('#autocomplete-title').html('Trending Tags');
			//render the new
			var half = Math.ceil(self.trending_tags.length / 2);
			for (var i = 0; i < self.trending_tags.length; i++) {
				if (i < half) {
					self.$('.trending-tag-left').append(self.trending_template(self.trending_tags[i]));
				} else {
					self.$('.trending-tag-right').append(self.trending_template(self.trending_tags[i]));
				}
			}
		}
		else {
			self.$('#autocomplete-title').html('No Trending Tags Found');
		}
	},
	fetch_autocomplete: function() {
		var self = this;
		self.clear();
		//check term has changed
		var search_term = self.$('#search').val();
		if(search_term != self.autocomplete_last_value) {
			console.log("Autocomplete for", search_term);
			//save the last value
			self.autocomplete_last_value = search_term;
			//load autocomplete
			self.render_loading();
			var board_autocomplete_loaded = false;
			var user_autocomplete_loaded = false;
			app.plugins.fetch({ endpoint: 'channels/autocomplete/' + search_term, _type: 'GET' }, function(err, resp) {
				board_autocomplete_loaded = true;
				if (resp && resp.success) {
					self.autocomplete_board_results = resp.data;
				}
				else {
					//something went wrong
					self.autocomplete_board_results = [];
				}
				//render if all loaded
				if(user_autocomplete_loaded) {
					self.render_autocomplete();
				}
			});
			app.plugins.fetch({ endpoint: 'users/autocomplete/' + search_term, _type: 'GET' }, function(err, resp) {
				user_autocomplete_loaded = true;
				if (resp && resp.success) {
					self.autocomplete_user_results = resp.data;
				}
				else {
					//something went wrong
					self.autocomplete_user_results = [];
				}
				//render if all loaded
				if(board_autocomplete_loaded) {
					self.render_autocomplete();
				}
			});
		} else {
			//autocomplete value has not changed, simply re-render
			self.render_autocomplete();
		}
	},
	render_autocomplete: function() {
		var self = this;
		self.clear();
		if(self.autocomplete_board_results.length + self.autocomplete_user_results.length > 0) {
			//render the board results
			for (var i = 0; i < self.autocomplete_board_results.length; i++) {
				self.$('.autocomplete-boards').append(self.autocomplete_board_template(self.autocomplete_board_results[i]));
			}
			//render the user results
			for (var i = 0; i < self.autocomplete_user_results.length; i++) {
				self.$('.autocomplete-users').append(self.autocomplete_user_template(self.autocomplete_user_results[i]));
			}
		}
		else {
			self.$('#autocomplete-title').html('No Search Suggestions');
		}
	}
});
