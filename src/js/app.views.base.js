app.views.base = Backbone.View.extend({
	initialize: function() {
		//init stuff
		app.plugins.msg.initialize();
		this.listenTo(app,		'change:route',		this.update_page);
		//setup scrolling detection for infinite load
		var throttle = _.throttle(this._resize, 100);
		$(window).resize(throttle);
		$('#base-container').scroll(_.throttle(function check_scroll() { app.trigger('scroll'); }, 500));
		this.render();
		return this;
	},
	events: {
		'click		#base-container'	:	'_click',
		'click		.data_link'			:	'redirect',
		'click		.data_trigger'		:	'process_trigger'

	},
	hide_dropdown_menu : function(e) {
		if($('.member-links').hasClass("active")) {
			$('.member-links').removeClass("active");
		}
		if($('#memberlinks-mobile').hasClass("active")) {
			$('#memberlinks-mobile').removeClass("active");
		}
		//console.log($(e.target));
		//console.log($('#plusIcon'));
		if($(e.target)[0] != $('#plusIcon')[0])
			$('#discover-menu').slideUp(100);
	},
	process_trigger: function(e) {
		var trigger	= $(e.currentTarget).attr('data-trigger');
		var message	= $(e.currentTarget).attr('data-message') || {};
		var context = $(e.currentTarget).attr('data-context') || false;

		if(message && _.isString(message) && message.indexOf('{') == 0)
			message = app.plugins.json.parse(message);

		if(context)
			message = app.plugins.form.get('#base-container ' + context);

		app.trigger(trigger, message);
	},
	redirect: function(e) {
		var link = $(e.target).data('link');
		app.router.navigate(link, true);
	},
	_resize: function(e) {
		app.trigger('resize');
	},
	_click: function(e) {
		this.hide_dropdown_menu(e);
		app.trigger('click', e);
	},
	_currentView: null,
	_prev_loc: '',
	update_page: function(page_details) {
		var self = this;

		//do nothing until the config is loaded
		if(!app.config_loaded) return false;

		//see if user is logged in
		var authenticated = app.user.get('_signed_in');
		if(!authenticated) {
			if(!_.contains(app.config.public_pages, page_details.page) && page_details.page != 'login') {
				//check for a "pro" param
				for(var lcv = 0; lcv < page_details.params.length; lcv++) {
					//TODO: keep track of this in a cookie?
					if(page_details.params[lcv] == 'pro') app.config.pro_after_auth = true;
				}
				//go to login
				return app.router.navigate('#/login', true);
			}
		}

		//prevent the user from going to the standard signup page if they have visited a jv signup page
		if(page_details.page == 'signup' && app.config.jv && !app.config.jv.isDefault && app.config.jv.pathName) {
			//TODO: store this in a cookie?
			app.router.navigate('#/jv/' + app.config.jv.pathName);
		}

		if(authenticated) {
			//force user to hit the onboard page if they have not already
			if(!app.config.data.SIGNUP_VISIONS_SET && page_details.page != 'welcome') {
				return app.router.navigate('#/welcome', true);
			}
			//do not let the user view a public page if they are logged in
			if(_.contains(app.config.public_pages, page_details.page)) {
				return app.config.navigate_back();
			}
		}

		//save intently history (except 404 page)
		if(self._prev_loc.page && self._prev_loc.page != '404') Backbone.history.intently_pages.push(self._prev_loc);
		self._prev_loc = page_details;

		//digest page structure
		if(page_details.page.indexOf('@') === 0 && page_details.params[0]) {
			//we are dealing with a vision board
			page_details.authorName	= page_details.page.replace('@', '');
			page_details.name		= page_details.params[0].replace(/\-/gi, ' ');
			page_details.page		= 'visionboard';
		} 
		else if(page_details.page.indexOf('@') > -1) {
			//we are dealing with a user profile
			page_details.username	= page_details.page.replace('@', '');
			page_details.page		= 'members';
		}
/*
		//set the search term for the search page
		if(page_details.page == 'search' && page_details.params[0]) self.searchbar.set_search_value(page_details.params[0]);

		//hide searchbar on public pages or custom defined pages
		if(_.contains(app.config.public_pages, page_details.page) || _.contains(app.config.no_searchbar_pages, page_details.page)) self.searchbar.hide();
		else self.searchbar.show();
*/
		if(!app.config.partial_modal_pages[page_details.page]) {
			//repaint the canvas
			var tmp = _.template($('.signed-in-tmp').html());
			this.$('#wrapper').html(tmp());
			var $base = $('<div></div>');
			this.$('#base-container .content').html($base);
		}

		//remove old view if the new view is not partial modal
		if(self.current_view && !app.config.partial_modal_pages[page_details.page]) {
			self.current_view.remove();
			self.current_view = null;
		}

		//try to find template or view
		var four04 = _.template($('.404-tmp').html());
		var temp = $('.' + page_details.page + '-tmp').html();
		var view = app.views[page_details.page];

		if(view) {
			//check for full modal page
			if(app.config.full_modal_pages[page_details.page]) {
				var opts = { view: view, router: page_details };
				if(temp) opts.template = temp;
				_.extend(opts, app.config.full_modal_pages[page_details.page]);
		        app.plugins.fullmodal.show(opts);
			}
			else {
				//regular page
				var opts = { 
					router: page_details, 
					el: $base
				};
				if(temp) opts.template = temp;
				this.current_view = new view(opts);
				//close any full modal that may be open
				app.trigger('overlay:close_full_modal');
			}
		} 
		else if(app.config.partial_modal_pages[page_details.page]) {
			//fire the associated overlay event
			var overlay_event = app.config.partial_modal_pages[page_details.page].overlay_event;
			app.trigger(overlay_event, page_details.params);
			//close any full modal that may be open
			app.trigger('overlay:close_full_modal');
		}
		else if(temp) {
			$base.html(temp);
		} 
		else {
			$base.html(four04());
		}

	},
	render: function() {
		var self = this;
		//init the common pieces
		this.mainmenu		= new app.views.mainmenu({ el: $('#mainmenu') });
		this.overlay		= new app.views.overlay({ el: $('#overlay') });
		//this.searchbar 		= new app.views.searchbar({ el: $('#searchbar') });
		return this;
	}
});
