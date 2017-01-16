//NOTE: this is a full modal popup view
app.views.welcome = Backbone.View.extend({
	initialize: function (opts) {
		this.template = _.template(opts.template);
		this.render();
		return this;
	},
	events: {
		'click		.onboard-create'		: 'onboard_create',
        'click      .onboard-search'        : 'onboard_search',
        'click      .onboard-maia'          : 'onboard_maia'
	},
    onboard_create: function(e) {
        var self = this;
        self.onboarding_completed();
        app.router.navigate('#/dashboard');
        app.trigger('overlay:add_new_vb');
    },
    onboard_search: function(e) {
        var self = this;
        self.onboarding_completed();
        app.router.navigate('#/search');
    },
    onboard_maia: function(e) {
        var self = this;
        self.onboarding_completed();
        app.router.navigate('#/maia');
    },
    onboarding_completed: function() {
        //register user as gone through onboarding
        app.config.data.SIGNUP_VISIONS_SET = true;
        app.plugins.fetch({ endpoint: 'account/onboardingcompleted', _type: 'POST' }, function(err, resp) {
            if(resp && resp.success) {
                //do nothing
            }
        });
    },
	render: function() {
		var self = this;
		$(self.el).html(self.template());
        //check for extension
        app.plugins.extension();
		return self;
	}
});
