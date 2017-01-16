//NOTE: this is a full modal popup view
app.views.pro = Backbone.View.extend({
	initialize: function(opts) {
		//literally just show the payment window
        app.trigger('overlay:show_subscription_payment_settings');
		return this;
	}
});
