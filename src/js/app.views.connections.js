app.views.connections = Backbone.View.extend({
	initialize: function (opts) {
		this.subviews = [];
		this.template = _.template(opts.template);
		this.listenTo(app.user.connections,		'status',				this.render_status);
		this.listenTo(app.user.connections,		'all',					this.render);
		this.render();
		return this;
	},
	relationship_status: {
		relationship	: 'none',
		userID			: false
	},
	events: {
		'click		.send-invite'		: 'invite_user'
	},
	render_status: function () {
		//unfetched / fetching / fetch / fetched
		var status = app.user.connections.status;
		this.$('.unfetched, .fetching, .fetch, .fetched').addClass('hidden');
		this.$('.' + status).removeClass('hidden');
	},
	invite_user: function () {
		var self		= this;
		var form_data	= app.plugins.form.get('#wrapper .invites-form');
		if (!form_data.email.match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/))
			return app.trigger('error', 'Invalid email to invite "' + form_data.email + '"');
		app.plugins.fetch({ endpoint: 'invites/emailinvite', _type: 'POST', emailAddresses: form_data.email }, function(err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
			}
		});
	},
	relationship: function(relationship_data) {
		this.relationship_status = relationship_data;
		this.render();
	},
	$connections: false,
	connections: function() {
		var self = this;
		this.$connections = this.$('.member-connections').masonry({ itemSelector: '.card-user', transitionDuration: '0.5s' });
		app.user.connections.each(function (model) {
			//create user card and bind it
			var $newelem = new app.views.usercard({
				model 		: model,
				template 	: $('.usercard-tmp').html()
			});
			var binding = {
				el			: $newelem.$el,
				model		: model,
				template	: $('.usercard-tmp').html()
			};
			var view = new Binding(binding);
			self.subviews.push(view);
			self.$connections.append(view.$el).masonry('appended', view.$el);
		});
		if(this.$connections) this.$connections.imagesLoaded('progress', function() { if (self.$connections) self.$connections.masonry('layout'); });
	},
	render: function() {
		var json = app.user.toJSON();
		$(this.el).html(this.template({ obj: json }));
		this.connections();
		return this;
	}
});
