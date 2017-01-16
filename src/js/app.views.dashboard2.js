app.views.dashboard2 = Backbone.View.extend({
	view_type: 'cloud', // or 'all' (latest updates),

	initialize: function (opts) {
		this.opts = opts;
		var self		= this;
		self.subviews 	= [];
		self.$mychannel_grid = false;
		self.$subscribed_grid = false;
		self.template	= _.template(opts.template);
		self.listenTo(app, 'scroll', self.detect_autoload);
		this.listenTo(app,						'change:route',					this.update_page);
		this.listenTo(app.user.subscribed,		'all',							this.render);
		this.listenTo(app.user.owned,			'all',							this.render);

		self.render();
		return self;
	},
	subscribed_channel_render: function(model) {
		this.channel_render(model, 'subscribed');
	},
	mychannel_render: function(model) {
		this.channel_render(model, 'owned');
	},
	subscribed_channel_render_all: function() {
		var self = this;
		//console.log("models_subscribed:", app.user.subscribed.models);
		_.each(app.user.subscribed.models, function(model) {
			self.channel_render(model, 'subscribed');
		});
	},
	mychannel_render_all: function() {
		var self = this;
		//console.log("models_owned:", app.user.owned.models);
		_.each(app.user.owned.models, function(model) {
			self.channel_render(model, 'owned');
		});

		var createchannelcard_model = new Backbone.Model({
			id: 'intention.-1',
			_id: '-1',
			_is_channel_creation_card: true
		});
		var $newelem = new app.views.intentioncard({
			model 		: createchannelcard_model,
			template 	: $('.visionboardcard-tmp').html()
		});
		var binding = {
			el			: $newelem.$el,
			model		: createchannelcard_model,
			template	: $('.visionboardcard-tmp').html()
		};
		var view = new Binding(binding);
		self.subviews.push(view);
		//add to the grid
		self.$mychannel_grid.append($newelem.$el).masonry('appended', $newelem.$el);
	},
	channel_render: function (model, type) {
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
		var targetMasonryClassname;

		if(type == 'subscribed') {
			targetMasonryClassname = ".dash2-subscribed-cards";
			if(!self.$subscribed_grid) {
				self.$subscribed_grid = self.$(targetMasonryClassname).masonry({ itemSelector: '.card-visionboard', transitionDuration: '0.5s' });
			}

			self.$subscribed_grid.append(view.$el).masonry('appended', view.$el);
			if (self.$subscribed_grid) self.$subscribed_grid.imagesLoaded('progress', function() { if (self.$subscribed_grid) self.$subscribed_grid.masonry('layout'); });
		} else {
			targetMasonryClassname = ".dash2-mychannel-cards";
			if(!self.$mychannel_grid) {
				self.$mychannel_grid = self.$(targetMasonryClassname).masonry({ itemSelector: '.card-visionboard', transitionDuration: '0.5s' });
			}
			//self.$grid = self.$mychannel_grid;
			self.$mychannel_grid.append(view.$el).masonry('appended', view.$el);
			if (self.$mychannel_grid) self.$mychannel_grid.imagesLoaded('progress', function() { if (self.$mychannel_grid) self.$mychannel_grid.masonry('layout'); });
		}
	},

	update_page: function (page_data) {
		this.opts.router = page_data;
	},
	render: function () {
		var self = this;
		self.$grid = false;
		self.$mychannel_grid = false;
		self.$subscribed_grid = false;
		$(self.el).html(self.template());

		var content;

		if(app.user.subscribed.status == 'fetching') {
			content = '<p class="pl1">Fetching your Channel subscriptions...</p>';
		} else if(app.user.subscribed.length == 0){
			content = 'You are not subscribed to any Channels!';
		} else {
			content = '';
			self.subscribed_channel_render_all();
		}
		$('.dash2-subscribed-div').html(content);

		if(app.user.owned.status == 'fetching') {
			content = '<p class="pl1">Fetching your Channels...</p>';
		} else if(app.user.owned.length == 0) {

		} else {
			content = '';
			self.mychannel_render_all();
		}
		$('.dash2-mychannel-div').html(content);

		return self;
	}
});
