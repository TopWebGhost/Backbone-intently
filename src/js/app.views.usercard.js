app.views.usercard	= Backbone.View.extend({
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
	},
	events: {
		'click 	.menu-button': 			'show_menu',
		'click 	.menu-item.connect': 	'connect',
		'click 	.menu-item.unconnect': 	'unconnect'
	},
	show_menu: function() {
		var self = this;
        var menu = self.$el.find('.menu');
        var menuButton = self.$el.find('.menu-button');
        //show the menu and hide the button
        menuButton.addClass('hidden');
        menu.removeClass('hidden');
        //reset on mouseleave
        self.$el.one('mouseleave', function() {
            menuButton.removeClass('hidden');
            menu.addClass('hidden');
        });
	},
	connect: function() {
		var self = this;
		//TODO: code this
		self.model.connect();
	},
	unconnect: function() {
		var self = this;
		//TODO: code this
		self.model.unconnect();
	}
});