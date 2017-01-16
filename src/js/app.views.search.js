app.views.search = Backbone.View.extend({
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
		this.render_preview();
		this.detect_autoload();

		return this;
	},
	events: {
		'click		.filter'				: 	'filter',
		'click		.search-viewall-btn' 	:	'view_all',
		'click      .search-back-btn'		:	'back_to_preview'
	},
	on_remove: function() {
		if (this.$grid) {
			this.$grid.masonry('destroy');
			this.$grid = null;
		}
		if (this.$grid_preview_intention) {
			this.$grid_preview_intention.masonry('destroy');
			this.$grid_preview_intention = null;
		}
		if (this.$grid_preview_visionboard) {
			this.$grid_preview_visionboard.masonry('destroy');
			this.$grid_preview_visionboard = null;
		}
		if (this.$grid_preview_user) {
			this.$grid_preview_user.masonry('destroy');
			this.$grid_preview_user = null;
		}
	},
	init: function () {
		this.cols = this.get_num_columns();
		this.stopListening();
		this.on_remove();

		delete this.search_results;
		delete this.search_results_preview_intention;
		delete this.search_results_preview_visionboard;
		delete this.search_results_preview_user;

		this.search_results = app.collection.get_collection({ category: this.active, type: 'available', term: this.search_term, index_step: 20 });
		this.search_results_preview_intention = app.collection.get_collection({ category: "intention", type: 'available', term: this.search_term, index_step: this.cols });
		this.search_results_preview_visionboard = app.collection.get_collection({ category: "visionboard", type: 'available', term: this.search_term, index_step: this.cols });
		this.search_results_preview_user = app.collection.get_collection({ category: "user", type: 'available', term: this.search_term, index_step: this.cols });

		this.nintention_loaded = 0;
		this.nvisionboard_loaded = 0;
		this.nuser_loaded = 0;


		this.listenTo(app.user,														'change',		this.render);
		this.listenTo(this.search_results,											'add',			this.add);
		this.listenTo(this.search_results_preview_intention,						'add',			this.add_preview_intention);
		this.listenTo(this.search_results_preview_visionboard,						'add',			this.add_preview_visionboard);
		this.listenTo(this.search_results_preview_user,								'add',			this.add_preview_user);
		this.listenTo(this.search_results,											'status',		this.loading_status);
		this.listenTo(app, 															'scroll',		this.detect_autoload);
		this.listenTo(app, 															'resize',		this.init_layout);
	},
	init_layout : function () {
		if(this.cols == this.get_num_columns())
			return;

		if($(".search-results-preview").hasClass("hidden"))
			return;

		this.init();
		this.render_preview();
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

		this.$('.blue').removeClass('blue');
		$(e.target).addClass('blue');

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
	add_preview: function (model, type) {
		var active = type;
		var self				= this;
		var targetClass=".search-results-preview-";
		//console.log(type);
		if(active == 'visionboard') {
			self.nvisionboard_loaded ++;

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
		else if(active == 'intention') {
			self.nintention_loaded ++;
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
		else if(active == 'user') {
			self.nuser_loaded ++;
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

		targetClass += active;
		//console.log("target: " + targetClass);
		//bind the card
		var view = new Binding(binding);
		self.subviews.push(view);

		//add the card to masonry
		$(".search-preview-loading").addClass("hidden");
		if(active == "intention") {
			if (!this.$grid_preview_intention){this.$grid_preview_intention = this.$(targetClass).masonry({ itemSelector: '.card-' + active, transitionDuration: '0.5s' })};
			this.$grid_preview_intention.append(view.$el).masonry('appended', view.$el);

			if(self.nintention_loaded == 1){
				$(".search-preview-intention-loading").addClass("hidden");
				$(".search-preview-intention-msg").addClass("hidden");
				$(".search-viewall-intention-btn").removeClass("hidden");
			}
			if (this.$grid_preview_intention) this.$grid_preview_intention.imagesLoaded('progress', function() { if (self.$grid_preview_intention) self.$grid_preview_intention.masonry('layout'); });
		}

		if(active == "visionboard") {
			if (!this.$grid_preview_visionboard){this.$grid_preview_visionboard = this.$(targetClass).masonry({ itemSelector: '.card-' + active, transitionDuration: '0.5s' })};
			this.$grid_preview_visionboard.append(view.$el).masonry('appended', view.$el);

			if(self.nvisionboard_loaded == 1){
				$(".search-preview-visionboard-loading").addClass("hidden");
				$(".search-preview-visionboard-msg").addClass("hidden");
				$(".search-viewall-visionboard-btn").removeClass("hidden");
			}
			if (this.$grid_preview_visionboard) this.$grid_preview_visionboard.imagesLoaded('progress', function() { if (self.$grid_preview_visionboard) self.$grid_preview_visionboard.masonry('layout'); });
		}

		if(active == "user") {
			if (!this.$grid_preview_user){this.$grid_preview_user = this.$(targetClass).masonry({ itemSelector: '.card-' + active, transitionDuration: '0.5s' })};
			this.$grid_preview_user.append(view.$el).masonry('appended', view.$el);

			if(self.nuser_loaded == 1){
				$(".search-preview-user-loading").addClass("hidden");
				$(".search-preview-user-msg").addClass("hidden");
				$(".search-viewall-user-btn").removeClass("hidden");
			}
			if (this.$grid_preview_user) this.$grid_preview_user.imagesLoaded('progress', function() { if (self.$grid_preview_user) self.$grid_preview_user.masonry('layout'); });
		}

		if(self.nintention_loaded == 0){
			$(".search-preview-intention-msg").removeClass("hidden");
		}
		if(self.nvisionboard_loaded == 0){
			$(".search-preview-visionboard-msg").removeClass("hidden");
		}
		if(self.nuser_loaded == 0){
			$(".search-preview-user-msg").removeClass("hidden");
		}
	},
	add_preview_intention : function (model) {
		this.add_preview(model, "intention");
	},
	add_preview_visionboard : function (model) {
		this.add_preview(model, "visionboard");
	},
	add_preview_user : function (model) {
		this.add_preview(model, "user");
	},
	view_all : function (e) {
		var type = $(e.target).data().field;
		this.filter(e);

		$(".search-results-preview").addClass("hidden");
		$(".search-results-div").removeClass("hidden");
		$(".loading-search").removeClass("hidden");
		if(type == "intention") {
			$("#title-for-intention").removeClass("hidden");
			$("#title-for-visionboard").addClass("hidden");
			$("#title-for-user").addClass("hidden");
		}
		if(type == "visionboard") {
			$("#title-for-intention").addClass("hidden");
			$("#title-for-visionboard").removeClass("hidden");
			$("#title-for-user").addClass("hidden");
		}
		if(type == "user") {
			$("#title-for-intention").addClass("hidden");
			$("#title-for-visionboard").addClass("hidden");
			$("#title-for-user").removeClass("hidden");
		}
	},
	back_to_preview : function (e) {
		if (this.$grid_preview_intention) {
			this.$grid_preview_intention.masonry('destroy');
			this.$grid_preview_intention = null;
		}

		if (this.$grid_preview_visionboard) {
			this.$grid_preview_visionboard.masonry('destroy');
			this.$grid_preview_visionboard = null;
		}

		if (this.$grid_preview_user) {
			this.$grid_preview_user.masonry('destroy');
			this.$grid_preview_user = null;
		}

		if (this.$grid) {
			this.$grid.masonry('destroy');
			this.$grid = null;
		}
		//console.log("----------------back------------------");
		this.init();
		this.render_preview();
	},
	get_num_columns: function() {
		var fakeMasonryElement = $('.card-intention').eq(0).clone().appendTo('body').wrap('<div style="display: none"></div>');
		var widthPercentage = parseFloat(fakeMasonryElement.css('width'));
		fakeMasonryElement.remove();
		if(!widthPercentage) return 0;
		return Math.round(100 / widthPercentage);
	},
	render: function () {
		var self		= this;
		var obj			= app.user.toJSON();
		obj._active		= this.active;
		$(this.el).html(this.template({ obj: obj }));

		this.search_results.each(function (model) { self.add(model); });
		return this;
	},
	render_preview: function () {
		var self		= this;
		var obj			= app.user.toJSON();
		var activeArray = ["intention", "visionboard", "user"];
		obj._active		= this.active;
		$(this.el).html(this.template({ obj: obj }));

		$(".search-results-div").addClass("hidden");
		$(".search-results-preview").removeClass("hidden");
		$(".loading-search").addClass("hidden");
		$(".search-preview-loading").removeClass("hidden");
		$(".search-preview-msg").addClass("hidden");

		$(".search-viewall-btn").addClass("hidden");


		this.search_results.each(function (model) { self.add(model); });
		this.search_results_preview_intention.each(function (model) {  self.add_preview(model, "intention"); });
		this.search_results_preview_visionboard.each(function (model) { self.add_preview(model, "visionboard"); });
		this.search_results_preview_user.each(function (model) { self.add_preview(model, "user"); });

		//console.log("Render Search", this.active);
		return this;
	}
});
