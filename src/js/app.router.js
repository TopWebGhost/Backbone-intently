var Base_Router = Backbone.Router.extend({
	initialize: function() {

	},
	routes: {
		'*path': 'page'
	},
	page: function(page) {
		//page is always first and defaults to dashboard
		if(!page) page = 'dashboard';
		var params = [];
		if(page.indexOf('/') > -1) {
			//anything additional is params
			var s	= page.split('/');
			page	= s[0];
			params 	= s.slice(1);
			//replace spaces with dashes for params
			for(var lcv = 0; lcv < params.length; lcv++) {
				params[lcv] = params[lcv].replace(/ /g, '-');
			}
		}
		//google analytics
		if(app.config.env !== 'dev' && ga) ga('send', 'pageview', window.location.hash);
		//go to top of page
		window.scrollTo(0, 0);
		//send to base view of app
		app.trigger('change:route', { page: page, params: params });
	},
	entry_point: {
		url: '',
		visited: false
	}
});
