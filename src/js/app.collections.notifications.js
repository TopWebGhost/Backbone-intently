app.collections.notifications = Backbone.Collection.extend({
	model: app.models.notifications,
	current_index			: 0,
	index_step				: 25,
	max_index				: -1,
	unacknowledged_count	: 0,
	_fetch: function (cb) {
		var self		= this;
		var endpoint	= 'account/notifications/' + this.current_index + '/' + this.index_step;

		app.plugins.fetch({ endpoint: endpoint, _type: 'GET' }, function(err, resp) {
			self.current_index += self.index_step;
			self.max_index = resp.totalCount;

			var models = [];

			if (resp && resp.success)
				models = self.add(resp.data);

			if (cb) cb(models);
		});
	},
	fetch: function () {
		var self = this;
		self.trigger('fetching');
		self._fetch(function (result_models) {
			self.acknowledge();
			self.trigger('fetched', result_models);
		});
	},
	load_more: function () {
		var self = this;
		self.trigger('fetching');
		this._fetch(function (result_models) {
			self.trigger('fetched', result_models);
		});
	},
	setup_notification_listener: function () {
		this.fetch_unacknowledged_count();
		this.notification_listener();
	},
	notification_listener: function () {
		var self = this;

		setTimeout(function () {
			if (app.user.get('_signed_in') == true) {
				self.fetch_unacknowledged_count();
				self.notification_listener();
			}
		}, 30000);
	},
	fetch_unacknowledged_count: function (self) {
		var self = this;

		// get the count
		app.plugins.fetch({ endpoint: 'account/notificationcount', _type: 'GET' }, function(err, resp) {
			// if it is different, trigger event
			if(resp && resp.success && resp.data) {
				if(resp.data != self.unacknowledged_count) {
					app.trigger('notifications:count_updated', resp.data);
					self.unacknowledged_count = resp.data;
				}
			}
		});
	},
	acknowledge: function () {
		var self = this;
		var endpoint = 'account/acknowledgenotifications/' + (Math.floor(Date.now() / 1000));
		app.plugins.fetch({ endpoint: endpoint, _type: 'GET' }, function(err, resp) {
			if(resp && resp.success) {
				//trigger event
				app.trigger('notifications:count_updated', 0);
				self.unacknowledged_count = 0;
			}
		});
	}
});
