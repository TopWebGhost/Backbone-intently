/* Note, there is sidebar view & Overlay view */

app.views.notifications = Backbone.View.extend({
	initialize: function (opts) {
		this.opts		= opts;
		this.template	= _.template(opts.template);

		app.user.notifications.acknowledge();

		this.render();
		return this;
	},
	events: {
		'click	#load-more'		: 'load_more'
	},
	render: function () {
		var self = this;

		// define the collection and listeners
		self.coll = new app.collections.notifications();
		self.listenTo(self.coll,	'fetching',		self.render_fetching);
		self.listenTo(self.coll,	'fetched',		self.render_notifications);
		self.coll.fetch();

		$(this.el).html(this.template());

		return this;
	},
	render_fetching: function () {
		var self = this;
		// show loading icon
		self.$('#load-more').hide();
		self.$('#all-loaded').hide();
		self.$('#loading').show();
	},
	render_notifications: function (result_models) {
		var self = this;
		// hide the loading icon
		self.$('#loading').hide();
		// render the notifications (or all loaded)
		if (!result_models.length) {
			self.$('#all-loaded').show();
		}
		else {
			result_models.forEach(function (notification) {
				var v = new app.views.notification({
					model: notification
				});
				self.$('#notifications-list').append(v.render().el);
			});
			self.$('#load-more').show();
		}
	},
	load_more: function() {
		var self = this;
		self.coll.load_more();
	}
});

app.views.notification = Backbone.View.extend({
	initialize		: function (opts) {
		this.opts 		= opts;

		//default template notification in case type does not exist
		var templateEl = $('.notification-' + this.opts.model.get('type') + '-tmp');
		this.template 	= (templateEl.length) ? _.template(templateEl.html()) : _.template($('.notification-default-tmp').html());

		this.render();
		return this;
	},
	events: {
		'click		.positiveAction'	: 'positive_action',
		'click		.negativeAction'	: 'negative_action'
	},
	positive_action: function (event) {
		var self = this;
		event.preventDefault();
		//see if this is a UI or API request
		if(this.model.get('positiveActionPage') != '1') {
			//call the API
			app.plugins.fetch({ endpoint: this.model.get('positiveActionRoute'), _type: 'POST' }, function(err, resp) {
				if (resp && resp.success) {
					//hide the buttons
					self.$('.notification-action').hide();
					//change notification text to response message
					if(resp.message)
						self.$('.notification-text').html(resp.message);
				}
				else {
					//TODO: modal dialog with error message

				}
			});
		}
		else {
			//see if this is within intently
			if(this.model.get('positiveActionRoute').indexOf('{UI_ROOT}') >= 0) {
				//route to the intently page
				app.router.navigate(this.model.get('positiveActionRoute').replace('{UI_ROOT}', '#/'));
			}
			else {
				//open a new tab
				window.open(this.model.get('positiveActionRoute'));
			}
		}
	},
	negative_action: function (event) {
		var self = this;
		event.preventDefault();
		//see if this is a UI or API request
		if(this.model.get('negativeActionPage') != '1') {
			app.plugins.fetch({ endpoint: this.model.get('negativeActionRoute'), _type: 'POST' }, function(err, resp) {
				if (resp && resp.success) {
					//hide the notification entry
					self.$('#notification-' + self.model.get('id')).hide();
				}
				else {
					//TODO: modal dialog with error message

				}
			});
		}
		else {
			//see if this is within intently
			if(this.model.get('negativeActionRoute').indexOf('{UI_ROOT}') >= 0) {
				//route to the intently page
				app.router.navigate(this.model.get('negativeActionRoute').replace('{UI_ROOT}', '#/'));
			}
			else {
				//open a new tab
				window.open(this.model.get('negativeActionRoute'));
			}
		}
	},
	render: function () {
		var json = this.model.toJSON();
		if (['friendshipaccept', 'emailinviteaccept', 'friendshiprequest', 'channelsubscription'].indexOf(json.type) > -1) {
			json.cdnFileName = (json.cdnFileName) ? app.config.get_base_cdn() + 'avatar/' + json.cdnFileName : app.config.get_base_cdn() + 'avatar/intentlyAvatar.png'
		} else if (json.cdnFileName != '') {
			json.cdnFileName = app.config.get_base_cdn() + 'thumbnail/' + json.cdnFileName;
		} else {
			//default to intently logo
			json.cdnFileName = '../images/intently-logo-top.png';
		}

		$(this.el).html(this.template({ obj: json }));
		return this;
	}
});
