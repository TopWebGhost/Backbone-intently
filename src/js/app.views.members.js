app.views.members = Backbone.View.extend({
	initialize: function (opts) {
		//this.template	= opts.template;
        _.extend(this, opts);

		this.model = new app.models.user({ username: opts.router.username });
		this.model.fetch_profile();
		this.model.fetch_relationship();

		this.listenTo(this.model.owned,			'status',				this.visionboards_status);
		this.listenTo(this.model.owned,			'status',				this.visionboards);
		this.listenTo(this.model.owned,			'fetched',				this.visionboards);

		this.model.owned.fetch();

		this.render();
		this.visionboards_status();

		return this;
	},
	events: {
		'click		.cancel'			: 'cancel_connect',
		'click		.pending'			: 'accept_connect',
		'click		.connect'			: 'init_connect'
	},
	init_connect: function () {
		this.model.connection_req('request');
	},
	accept_connect: function () {
		this.model.connection_req('accept');
	},
	cancel_connect: function () {
		this.model.connection_req('remove');
	},
	visionboards_status: function(status) {
		//unfetched / fetching / fetch / fetched
		var status = this.model.owned.status;
		this.$('.unfetched, .fetching, .fetch, .fetched').addClass('hidden');
		this.$('.' + status).removeClass('hidden');
	},
	$vb_grid: false,
	visionboards: function () {
		var self = this;
		if(this.model.owned.status != 'fetched') return;
		self.$('.members-visionboards').html('');
		if(this.model.owned.length === 0) {
			return self.$('.members-visionboards').html('<h4 class="text-center sans-serif small-caps margin-top-large animated">' + this.model.get('username') + ' does not have any vision boards.</h4>');
		}
		if (!this.$vb_grid) {
			this.$vb_grid = this.$('.members-visionboards').masonry({ itemSelector: '.card-visionboard', transitionDuration: '0.5s' });
		}
		this.model.owned.each(function (model) {
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
			self.$vb_grid.append(view.$el).masonry('appended', view.$el);
		});
		if (this.$vb_grid) this.$vb_grid.imagesLoaded('progress', function() { if (self.$vb_grid) self.$vb_grid.masonry('layout'); });
	},
	render: function () {
		var binding = {
			el			: this.el,
			model		: this.model,
			template	: this.template
		};
		var view = new Binding(binding);
		this.subviews.push(view);
		this.visionboards();
		return this;
	}
});
