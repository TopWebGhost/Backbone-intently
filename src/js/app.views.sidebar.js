app.views.sidebar = Backbone.View.extend({

	template	: _.template($('.sidebar-tmp').html()),
	initialize: function (opts) {
		this.opts			= opts;
		this.hide_width		= 70;
		this.show_menu 		= false;

		this.listenTo(app.user,					'all',							this.render);
		this.listenTo(app.user.subscribed,		'all',							this.render);
		this.listenTo(app.user.owned,			'all',							this.render);
		this.listenTo(app.user.notifications,	'all',							this.render);
		this.listenTo(app,						'change:route',					this.update_page);
		this.listenTo(app,						'notifications:count_updated',	this.render);
		this.listenTo(app, 						'resize', 						this.check_sm_menu);

		this.render();

	},
	hidden		: true,
	events: {
		'click 			.btn-hamburger'				: 'toggle_sm_menu',
		'click			#memberlinks'				: 'show_dropdown_menu',
		'click			#memberlinks-mobile'		: 'show_dropdown_menu_mobile',
		'click			*'							: 'hide_dropdown_menu'
	},
	check_sm_menu: function() {
		var width = parseInt($('#base-container').css('width').replace('px',''));
		var currentHeight = $('#sidebar').css('height');
		if(width >= 992) {
			this.show_menu = false;
			if(currentHeight == '46px') {
				$('#sidebar').css({'height': '100%', 'overflow-y': 'auto', 'bottom': 0 });
			}
		} 
		else if(width > 0 && width < 992 && currentHeight != '46px' && this.show_menu == false) {
			$('#sidebar').css({'height': '46px', 'overflow-y': 'hidden', 'bottom': 'auto' });
		}
	},
	toggle_sm_menu: function() {
		var currentHeight = $('#sidebar').css('height');
		if(currentHeight == '46px') {
			this.show_menu = true;
			$('#sidebar').css({'height': '100%', 'overflow-y': 'auto', 'bottom': 0 });
		} 
		else {
			this.show_menu = false;
			$('#sidebar').css({'height': '46px', 'overflow-y': 'hidden', 'bottom': 'auto' });
		}
	},
	update_page: function (page_data) {
		this.opts.router = page_data;
		this.render();
		if(app.user.attributes._signed_in) {
			$("#sidebar").removeClass("hidden");
			this.check_sm_menu();
		}
		else {
			$("#sidebar").addClass("hidden");
		}
	},
	show_notifications: function () {
		app.router.navigate('#/notifications');
	},
	show_dropdown_menu: function (e) {
		console.log(e.target.id);
		if(e.target.id == "signout-p")
			app.trigger('user:signout');

		e.stopPropagation();

		if($('#memberlinks').hasClass("active"))
			$('#memberlinks').removeClass("active");
		else {
			$('#memberlinks').addClass("active");
		}
	},
	show_dropdown_menu_mobile: function (e) {
		if(e.target.id == "signout-p-mobile") {
			app.trigger('user:signout');
		}
		e.stopPropagation();
		if($('#memberlinks-mobile').hasClass("active")) {
			$('#memberlinks-mobile').removeClass("active");
		}
		else {
			$('#memberlinks-mobile').addClass("active");
		}
	},
	hide_dropdown_menu: function (e) {
		//alert("sadfsdaf");
		//if(e.target.id != "memberlinks")
			//$('.member-links').removeClass("active");

	},
	render: function () {
		$(this.el).html('');

		if (!this.opts.router)
			return false;

		var self			= this;
		var user			= app.user.toJSON();
		var data = {
			user				: user,
			notifications		: app.user.notifications.toJSON(),
			owned_status		: app.user.owned.status,
			owned				: app.user.owned.toJSON(),
			subscribed_status	: app.user.owned.status,
			subscribed			: app.user.subscribed.toJSON(),
			board_tmp			: _.template($('.visionboard-sidebar-tmp').html()),
			router				: this.opts.router,
			nav					: {}
		};

		data.nav.profile	= (data.user._signed_in		&& data.router.original !== '@' + data.user.username)	? ''		: 'hidden';
		data.nav.dashboard	= (data.user._signed_in		&& data.router.original ==  '@' + data.user.username)	? ''		: 'hidden';

		if(data.user._signed_in) data.nav.current = 'profile';

		data.nav.support = 'no-mobile-inline';
		if(data.nav.current == 'profile') {
			data.nav.support = '';
		}

		data.notificationCount = app.user.notifications.unacknowledged_count;

		$(this.el).html(this.template({ obj: data }));

		//exit the menu on mobile if router change
		if(this.show_menu) {
			this.toggle_sm_menu();
		}
	}
});
