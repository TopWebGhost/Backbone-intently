app.models.user = Backbone.Model.extend({
	defaults: {
		username				: "",
		avatar					: "intentlyAvatar.png",
		avatarHeight			: "",
		avatarWidth				: "",
		description				: "",
		email					: "",
		firstName				: "",
		id						: "",
		lastName				: "",
		cdnFileName				: 'intentlyAvatar.png',
		avatar_src				: '',
		_signed_in				: false,
		_relationship_status	: 'none' // none|requested|pending|confirmed|self
	},
	initialize: function (opts) {
		this.opts = opts;

		//TODO: set no_load to true? the current user's loading seems to be handled by this.setup()
		this.subscribed		= app.collection.get_collection({ category: 'visionboard', type: 'subscribed', term: opts.username || null, no_load: true });
		this.owned			= app.collection.get_collection({ category: 'visionboard', type: 'owned', term: opts.username || null, no_load: true });
		this.purchased		= app.collection.get_collection({ category: 'visionboard', type: 'purchased', term: opts.username || null, no_load: true });
		this.connections	= app.collection.get_collection({ category: 'user', type: 'connected', term: opts.username || null, index_step: 500, no_load: true });
		this.notifications	= new app.collections.notifications(this.opts);

		if (opts && opts.active_user) {
			this.listenTo(app,		'user:signout',					this.signout);
			this.listenTo(app,		'user:signin',					this.signin);
			this.listenTo(app,		'user:signup',					this.signup);
			this.listenTo(app,		'user:recover_password',		this.recover_password);
			this.listenTo(app,		'user:facebooksignin',			this.facebook_signin);
		}

		if (opts.cdnFileName == '')		this.set('cdnFileName', app.models.user.prototype.defaults.cdnFileName);

		this.set('avatar_src', app.config.get_base_cdn() + 'avatar/' + this.get('cdnFileName'));
	},
	setup: function () {
		this.subscribed.fetch();
		this.owned.fetch();
		this.purchased.fetch();
		this.connections.fetch();
		app.user.notifications.setup_notification_listener();
	},
	update_recommended: function() {
		//load recommended users
		this.recommended.category = 'user';
		this.recommended.type = 'recommended';
		this.recommended.term = '';
		this.recommended.index_step = 0;
	},
	check_status: function() {
		var self = this;
		app.config_loaded = false;
		//try to get the config
		app.plugins.fetch({ endpoint: 'account/config', _type: 'GET' }, function(err, resp) {
			app.config_loaded = true;
			if(!resp || !resp.success) {
				//user not signed in, check if user is at a public page (or the pro page!)
				var loc = window.location.hash.replace('#/', '').split('/')[0];
				if(loc == 'pro') {
					app.config.pro_after_auth = true;
				}
				else if(!_.contains(app.config.public_pages, loc)) {
					//perhaps it is a jv slug
					app.plugins.fetch({ endpoint: 'public/jointventureinfo/' + loc, _type: 'GET' }, function(err, resp) {
						//see if the jv exists
						if(resp && resp.success && resp.data.pathName == loc) {
							//redirect to home page
							return app.router.navigate('#/jv/' + loc, true);
						}
						window.location.href = app.config.get_about_url();
					});
					return;
				}
				loc = window.location.hash;
			} 
			else {

				//user is signed in, set the configuration
				app.config.data = resp.data;
				var user_data = {};
				var map	= {
					'USERNAME'				: 'username',
					'USER_EMAIL'			: 'email',
					'USER_FIRST_NAME'		: 'firstName',
					'USER_LAST_NAME'		: 'lastName',
					'USER_DESCRIPTION'		: 'description',
					'USER_AVATAR'			: 'avatar',
					'USER_AVATAR_HEIGHT'	: 'avatarHeight',
					'USER_AVATAR_WIDTH'		: 'avatarWidth',
					'SHOW_INTEND_BUTTON'	: 'showIntendButton',
					'SHOW_NEW_TAB_OVERRIDE'	: 'showNewTabOverride',
					'USER_ID'				: 'id'
				};
				_.each(map, function(v, k) { user_data[v] = resp.data[k]; });
				user_data._signed_in = true;
				self.set(user_data);
				self.setup();

				var loc = app.temp.original_hash || '#/dashboard';
				//go to dashboard if the user is currently on a public page
				if(_.contains(app.config.public_pages, loc.replace(/(\/|#)/g, ''))) {
					loc = '#/dashboard';
				}
				//onboarding is required for new signups
				if(!resp.data.SIGNUP_VISIONS_SET) {
					loc = '#/welcome';
				}
				//check if pro was requested
				if(app.config.pro_after_auth) {
					//show the payment screen on top of the next page
					app.trigger('overlay:show_subscription_payment_settings');
				}
				else {
					//ensure there is no modal on top of the next page
					app.trigger('overlay:close_full_modal');
				}

			}

			//route it
			app.router.navigate(loc, true);

			//hide the loading and show the content
			$('#loading-container').addClass('hidden');
			$('#base-container').removeClass('hidden');

		});
	},
	signin: function(form_data, cb) {
		var self	= this;
		_.extend(form_data, { endpoint: 'public/login', _type: 'POST' });
		app.plugins.fetch(form_data, function(err, resp) {
			if(resp && resp.success) {
				self.check_status();
			}
			if(typeof cb === 'function') cb(resp);
		});
	},
	signup: function(form_data, cb) {
		//{ firstName, lastName, username, email, password, jointVentureID }
		var self = this;
		_.extend(form_data, { endpoint: 'public/usersignup', _type: 'POST' });
		if(app.config.jv) _.extend(form_data, app.config.jv);
		app.plugins.fetch(form_data, function(err, resp) {
			if(resp && resp.success) {
				self.check_status();
			}
			if(typeof cb === 'function') cb(resp);
		});
	},
	facebook_signin: function(form_data) {
		var self	= this;
		var errors	= [];
		var facebookAuthURL = app.config.get_base_api() + 'public/facebooklogin';
		if(app.config.jv && app.config.jv.jointVentureID) {
			facebookAuthURL += '?jointVentureID=' + app.config.jv.jointVentureID;
		}
		window.location.href = facebookAuthURL;
	},
	signout: function() {
		var self = this;
		app.temp.original_hash = '#/dashboard';
		app.plugins.fetch({ endpoint: 'account/logout', _type: 'POST' }, function(err, resp) {
			self.set({ _signed_in: false });
			app.router.navigate('#/login');
		});
	},
	update_password: function(form_data, cb) {
		// form_data { password, newPassword, newPasswordRepeat }
		var req_data = _.extend({ endpoint: 'account/changepassword', _type: 'POST' }, form_data);
		app.plugins.fetch(req_data, function(err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
				app.trigger('change:password', true);
			}
			if(typeof cb === 'function') cb(resp);
		});
	},
	recover_password: function(form_data, cb) {
		// form_data = { email }
		form_data.endpoint	= 'public/recoverpassword';
		form_data._type		= 'POST';
		console.log("forgot-password form data:", form_data);
		app.plugins.fetch(form_data, function(err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
			}
			if(typeof cb === 'function') cb(resp);
		});
	},
	setSubscription: function(plan, token, cb) {
		var req = {
			endpoint: 'subscriptionplans/setactive/' + plan,
			_type: 'POST'
		};
		if(token) req.stripeToken = token;
		app.plugins.fetch(req , function(err,resp){
			if(resp && resp.success){
				app.trigger('success', resp.message);
			}
			if(typeof cb === 'function') cb(resp);
		});
	},
	update_paymentinfo: function(token, cb) {
		var req = {
			endpoint:'account/updatepaymentinfo',
			_type: 'POST',
			stripeToken: token
		};
		app.plugins.fetch(req, function(err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
			}
			if(typeof cb === 'function') cb(resp);
		});
	},
	update_profile: function(form_data, cb) {
		// form_data: { firstName, lastName, description, showIntendButton '1'|'0' }
		var self			= this;
		var req_data		= _.extend({ endpoint: 'account/settings', _type: 'POST' }, form_data);
		app.plugins.fetch(req_data, function(err, resp) {
			if (resp && resp.success) {
				app.trigger('success', resp.message);
				self.set(form_data);
			}
			if(typeof cb === 'function') cb(resp);
		});
	},
	fetch_profile: function() {
		var self = this;

		app.plugins.fetch({ endpoint: 'users/info/' + this.get('username'), _type: 'GET' }, function (err, resp) {
			if (resp.data) {
				resp.data.avatar = resp.data.cdnFileName;
				self.set(resp.data);
			}
		});
	},
	fetch_username_availability: function(username, cb) {
		app.plugins.fetch({ endpoint: 'public/usernameavailable/' + username, _type: 'GET' }, function (err, resp) {
			if(cb) cb(resp);
		});
	},
	fetch_relationship: function() {
		if(app.user.get('username') == this.get('username'))
			return this.set('_relationship_status', 'self');

		var self = this;

		app.plugins.fetch({ endpoint: 'connections/info/' + this.get('username'), _type: 'GET' }, function (err, resp) {
			self.set('_relationship_status', resp.data.relationship);
		});
	},
	connection_req: function(type) {
		var self = this;

		var mapping = {
			request	: 'requested',
			accept	: 'confirmed',
			remove	: 'none'
		};

		app.plugins.fetch({ endpoint: 'connections/' + type + '/' + this.id.replace(/[a-z0-9]+\./i,''), _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				self.set('_relationship_status', mapping[type]);
				app.trigger('success', 'Successfully updated relationship status');
			}
		});
	}
});
