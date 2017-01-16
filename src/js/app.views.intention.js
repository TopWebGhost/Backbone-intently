app.views.intention = Backbone.View.extend({
	initialize: function(opts) {
		var self = this;
		self.opts = opts;
		if(opts.template) self.template = opts.template;

		//go to 404 if id not specified
		if(opts.router.params.length === 0 || !parseInt(opts.router.params[0])) {
			return app.navigate.route('#/404', true);
		}

		//look for the model
		self.intention_id = opts.router.params[0];
		var model = app.collection.get('intention.' + self.intention_id);
		if(model) {
			//the model was here, proceed immediately
			self.init(model);
		}
		else {
			//create the model and fetch before rendering
			model = new app.models.intention({
				_id: self.intention_id
			});
			model.once('change', function() {
				self.init(this);
			});
			model.fetch_info();
		}
		return self;
	},
	init: function(model) {
		var self = this;
		self.model = model;
		self.render();
	},
	render: function() {
		var self = this;
		var binding = {
			el: self.el,
			model: self.model,
			template: self.template
		};
		self.$grid = false;
		var view = new Binding(binding);
		self.subviews.push(view);
		return self;
	}
});
