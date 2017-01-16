app.views.imagecard = Backbone.View.extend({
	/*
		NOTE: cards must be rendered/bound as subviews i.e. there is no main view for a card
	*/
	initialize: function (opts) {
		var self = this;
		self.subviews						= [];
		self.opts							= opts;
		self.model							= opts.model;
		if(opts.template) self.template 	= opts.template;
		return self;
	}
});