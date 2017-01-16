app.views.dashboard = Backbone.View.extend({
	view_type: 'cloud', // or 'all' (latest updates)
	initialize: function (opts) {
		var self		= this;
		self.subviews 	= [];
		self.template	= _.template(opts.template);
		self.listenTo(app, 'scroll', self.detect_autoload);
		self.render();
		self.load_vbs();
		return self;
	},
	events: {
		'click		.cloud-btn': 			'show_cloud',
		'click		.all-btn':				'show_all'
	},
	load_vbs: function() {
		var self = this;
		if (self.vb) {
			self.stopListening(this.vb);
		}

		if (self.view_type == 'all') {
			self.vb	= app.collection.get_collection({ category: 'visionboard', type: 'latestupdates', index_step: 25 });
		} else {
			self.vb	= app.collection.get_collection({ category: 'visionboard', type: 'available', index_step: 25 });
		}

		self.listenTo(self.vb,		'add',			self.visionboard_render);
		self.listenTo(self.vb,		'status',		self.render_status);

		if (self.vb.size() > 0) {
			self.vb.each(function (m) { self.visionboard_render(m); });
		}
		self.render_status();
	},
	detect_autoload: function () {
		if ((this.view_type == 'cloud' || this.view_type == 'all') && $(window).height() + $('#base-container').scrollTop() >= $('#wrapper').height()) {
			if (this.vb) this.vb.load_more();
		}
	},
	render_status: function () {
		// unfetched / fetching / fetch / fetched
		var status = this.vb.status;
		this.$('.unfetched, .fetching, .fetch, .fetched').addClass('hidden');
		this.$('.' + status).removeClass('hidden');
	},
	show_cloud: function() {
		if (this.view_type != 'cloud') {
			this.view_type = 'cloud';
			this.remove_grid();
			this.render();
			this.load_vbs();
		}
	},
	show_all: function() {
		if (this.view_type != 'all') {
			this.view_type = 'all';
			this.remove_grid();
			this.render();
			this.load_vbs();
		}
	},
	remove_grid: function() {
		if (this.$grid) {
			this.$grid.masonry( 'remove', this.$('.card-visionboard') ).masonry('layout'); // remove all
			this.$grid.masonry('destroy');
			this.$grid = null;
			this.$('.trending-visionboards').html('');
		}
	},
	$grid: false,
	visionboard_render: function (model) {
		var self = this;
		//create the card and bind it
		var $newelem = new app.views.visionboardcard({
			model 		: model,
			template 	: $('.visionboardcard-tmp').html()
		});
		var binding = {
			el			: $newelem.$el,
			model		: model,
			template	: $('.visionboardcard-tmp').html()
		};
		var view = new Binding(binding);
		self.subviews.push(view);
		//add it to masonry
		if (!self.$grid) self.$grid = self.$('.trending-visionboards').masonry({ itemSelector: '.card-visionboard', transitionDuration: '0.5s' });
		self.$grid.append(view.$el).masonry('appended', view.$el);
		if (self.$grid) self.$grid.imagesLoaded('progress', function() { if (self.$grid) self.$grid.masonry('layout'); });
	},
	render: function () {
		var self = this;
		$(self.el).html(self.template());
		if (self.view_type == 'all') {
			self.$('.all-btn').addClass('underlined');
			// set the template for cloud
			var tmp			= _.template($('.dashboard-all-tmp').html());
			self.$('.dashboard-content').html(tmp());
		} else { // cloud
			self.$('.cloud-btn').addClass('underlined');
			// set the template for cloud
			var tmp			= _.template($('.dashboard-cloud-tmp').html());
			self.$('.dashboard-content').html(tmp());
		}
		//check for extension
		app.plugins.extension();
		return self;
	}
});
