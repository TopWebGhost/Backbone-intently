app.views['404'] = Backbone.View.extend({
	initialize: function(opts) {
		var self = this;
		self.message = '404 - The page you requested could not be found. Either it does not exist or you do not have access to it.';
		if(opts.router.params.length > 0) {
			self.message = opts.router.params[0].replace(/-/g, ' ');
		}
		self.template = _.template(opts.template);
		self.render();
		return self;
	},
	events: {
		'click		.back-btn'		: 'go_back'
	},
	go_back: function(event) {
		app.config.navigate_back();
	},
	render: function() {
		var self = this;
		var model = { message: self.message };
		$(self.el).html(self.template({ model: model }));
		return self;
	}
});
