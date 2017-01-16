app.views.intentioncard	= Backbone.View.extend({
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
		'click 	.menu-button': 				'show_menu',
		'click 	.menu-item.like':			'like',
		'click 	.menu-item.share': 			'share',
		'click 	.menu-item.facebook': 		'facebook',
		'click 	.menu-item.remove': 		'remove',
		'click 	.menu-item.add': 			'add',
		'click 	.card-create-intention': 	'create_button_clicked'
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
	like: function() {
		var self = this;
		self.model.like();
	},
	share: function() {
		var self = this;
		app.trigger('overlay:share_intention', self.model.get('id'));
	},
	facebook: function() {
		var self = this;
        app.trigger('overlay:share_intention_to_facebook', self.model.get('id'));
	},
	remove: function() {
		var self = this;
		app.trigger('overlay:confirm_intention_delete', self.model.get('id'));
	},
	add: function() {
		var self = this;
		app.trigger('overlay:review_intention', self.model.get('id'));
	},
	create_button_clicked: function() {
		app.router.navigate('#/meme');
	}
});