/* Note, there is sidebar view & Overlay view */

app.views.invite = Backbone.View.extend({
	initialize: function (opts) {
		this.opts		= opts;
		this.template	= _.template(opts.template);

		this.render();
		return this;
	},
	events: {
		'click	#send-invites'		: 'send_invites'
	},
	render: function () {
		var self = this;
		$(this.el).html(this.template());

		self.invite_emails = [];
		self.numInvitesAvailable = 5; //this should be number of invites from account/config
	    for(var lcv = 0; lcv < self.numInvitesAvailable; lcv++) {
	    	//right now only type is email
			var v = new app.views.invite_email({
				index: lcv
			});
			self.invite_emails.push(v);
			self.$('#invites > ul').append(v.render().el);
	    }

		return this;
	},
	send_invites: function () {
		var self = this;
		// construct params
		var email_addresses = [];
		self.invite_emails.forEach(function(invite_email) {
			if(invite_email.$('input').val() !== '')
				email_addresses.push(invite_email.$('input').val());
		});
		// ensure at least one email was provided
		if(email_addresses.length === 0) {
			return;
		}
		// disable inputs
		self.processing();
		// send request and consume response
		app.plugins.fetch({ endpoint: 'invites/emailinvite', _type: 'POST', emailAddresses: email_addresses.join(',') }, function(err, resp) {
			self.processing_complete();
			if(resp && resp.message) {
				self.$('#invite-response-message').html(resp.message);
			}
			else {
				self.$('#invite-response-message').html('Something unexpected occurred. Please try again.');
			}
			// check success
			if(resp && resp.success && resp.data.length > 0) {
				// yay, go through each input
				var lcv = 0;
				self.invite_emails.forEach(function(invite_email) {
					// reset the input
					invite_email.$('input').val('');
					// hide the inputs based on amount of invites left
					if(lcv >= resp.data[0]) {
						invite_email.$('input').hide();
					}
					lcv++;
				});
				// update number of available invites
				self.numInvitesAvailable = resp.data[0];
			}
		});
	},
	processing: function () {
		var self = this;
		// set button to processing
		self.$('#send-invites > h2').html('Sending Invites...');
		self.$('#send-invites').attr('disabled', 'disabled');
		// disable email address inputs
		self.invite_emails.forEach(function(invite_email) {
			invite_email.$('input').attr('disabled', 'disabled');
		});
	},
	processing_complete: function () {
		var self = this;
		// reset button
		self.$('#send-invites > h2').html('Send');
		self.$('#send-invites').removeAttr('disabled');
		// enable email address inputs
		self.invite_emails.forEach(function(invite_email) {
			invite_email.$('input').removeAttr('disabled');
		});
	}
});

app.views.invite_email = Backbone.View.extend({
	initialize: function (opts) {
		this.opts = opts;

		var templateEl = $('.invite-email-tmp');
		if(templateEl.length) {
			this.template = _.template(templateEl.html());
			this.render();
		}

		return this;
	},
	render: function () {
		$(this.el).html(this.template({ obj: this.opts }));
		return this;
	}
});
