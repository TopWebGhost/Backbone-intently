
app.views.discover = Backbone.View.extend({
	active: 'intention',
	cols: 0,
	nintention_loaded: 0,
	nvisionboard_loaded: 0,
	nuser_loaded: 0,
	initialize: function (opts) {
		this.template = _.template(opts.template);
		if(opts.router.params.length > 0) {
			this.search_term = opts.router.params[0].replace(/-/g,'%20');
		}

		this.init();
		this.render();
		this.detect_autoload();

		return this;
	},
	events: {
		'click		.filter'				: 	'filter',
		'click		.btn-search-term'		:	'switch_view',
		'click      .search-setting'		:	'show_setting_menu'
	},
	on_remove: function() {
		if (this.$grid) {
			this.$grid.masonry('destroy');
			this.$grid = null;
		}
	},
	init: function () {
		this.cols = this.get_num_columns();
		this.stopListening();
		this.on_remove();

		delete this.search_results;

		this.search_results = app.collection.get_collection({ category: this.active, type: 'available', term: this.search_term, index_step: 20 });

		this.listenTo(app.user,														'change',		this.render);
		this.listenTo(this.search_results,											'add',			this.add);
		this.listenTo(this.search_results,											'status',		this.loading_status);
		this.listenTo(app, 															'scroll',		this.detect_autoload);
	},
	like_intention: function (e) {
		var intention_id	= $(e.currentTarget).data().intention;
		var intention		= this.search_results.get(intention_id);
		intention.like();

		$(e.currentTarget).addClass('blue');
		$('.dislike-intention.' + intention_id).removeClass('blue');
	},
	dislike_intention: function (e) {
		var intention_id	= $(e.currentTarget).data().intention;
		var intention		= this.search_results.get(intention_id);
		intention.dislike();
		$(e.currentTarget).addClass('blue');
		$('.like-intention.' + intention_id).removeClass('blue');
	},
	filter: function (e) {
		var type = $(e.target).data().field;
		if (type == undefined) return false;

		this.active = type;

		if (this.$grid) {
			this.$grid.masonry('destroy');
			this.$grid = null;
		}

		this.init();
		this.render();
	},
	detect_autoload: function () {
		var status = this.search_results.status;
		if (status == 'fetch') {
			if ($(window).height() + $('#base-container').scrollTop() >= $('#wrapper').height()) {
				this.search_results.load_more();
			}
		}
	},
	loading_status: function () {
		// unfetched / fetching / fetch / fetched
		var status = this.search_results.status;
		this.$('.unfetched, .fetching, .fetch, .fetched').addClass('hidden');
		this.$('.' + status).removeClass('hidden');
	},
	add: function (model) {
		var self				= this;
		if(self.active == 'visionboard') {
			//create vision board card
			var $newelem = new app.views.visionboardcard({
				model 		: model,
				template 	: $('.visionboardcard-tmp').html()
			});
			var binding = {
				el			: $newelem.$el,
				model		: model,
				template	: $('.visionboardcard-tmp').html()
			};
		}
		else if(self.active == 'intention') {
			//create intention card
			//NOTE: only available, non-premium intentions are returned by API search endpoint, so all should have add / share buttons
			model.set('_curate_mode', false);
			var $newelem = new app.views.intentioncard({
				model 		: model,
				template 	: $('.intentioncard-tmp').html()
			});
			var binding = {
				el			: $newelem.$el,
				model		: model,
				template	: $('.intentioncard-tmp').html()
			};
		}
		else if(self.active == 'user') {
			//create user card
			var $newelem = new app.views.usercard({
				model 		: model,
				template 	: $('.usercard-tmp').html()
			});
			var binding = {
				el			: $newelem.$el,
				model		: model,
				template	: $('.usercard-tmp').html()
			};
		}
		else {
			//invalid search result type
			return;
		}
		//bind the card
		var view = new Binding(binding);
		self.subviews.push(view);

		//add the card to masonry
		if (!this.$grid) this.$grid = this.$('.search-results').masonry({ itemSelector: '.card-' + this.active, transitionDuration: '0.5s' });
		this.$grid.append(view.$el).masonry('appended', view.$el);
		if (this.$grid) this.$grid.imagesLoaded('progress', function() { if (self.$grid) self.$grid.masonry('layout'); });
	},

	get_num_columns: function() {
		var fakeMasonryElement = $('.card-intention').eq(0).clone().appendTo('body').wrap('<div style="display: none"></div>');
		var widthPercentage = parseFloat(fakeMasonryElement.css('width'));
		fakeMasonryElement.remove();
		if(!widthPercentage) return 0;
		return Math.round(100 / widthPercentage);
	},
	switch_view: function(e) {
		$('.btn-search-term.active').removeClass('active');
		$(e.target).addClass('active');

		this.filter(e);
	},
	show_setting_menu: function(e) {

		console.log($('.discover-container .dropdownContain'));
		if($('#discover-menu').css('display') == 'none')
			$('#discover-menu').slideDown(100);
		else
			$('#discover-menu').slideUp(100);
	},
	render: function () {
		var self		= this;
		var obj			= app.user.toJSON();
		obj._active		= this.active;
		$(this.el).html(this.template({ obj: obj }));
		this.searchbar 		= new app.views.searchbar({ el: $('#searchbar'), search_term:this.search_term });

		$('.btn-search-term.active').removeClass('active');
		$('.btn-search-term-' + this.active).addClass('active');

		this.search_results.each(function (model) { self.add(model); });
		return this;
	},
});
