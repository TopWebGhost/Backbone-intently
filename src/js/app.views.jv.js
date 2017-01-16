app.views.jv = Backbone.View.extend({
	initialize: function (opts) {
		var self = this;
		self.subviews = [];
		self.template = _.template(opts.template);
		self.opts = opts;
		//get the jv name
		if(self.opts.router.params.length > 0) {
			self.jv = self.opts.router.params[0];
		}
		self.render();
		return self;
	},
	jv: 'intently',
	load_jv_bg: function() {
		var self = this;
		function cb(err, resp) {
			if(resp && resp.data && resp.data.id > 0) {
				app.config.jv = {
					jointVentureID: resp.data.id,
					pathName: resp.data.pathName,
					isDefault: resp.data.isDefault
				};
				$('div.jvimage').css('background-image', 'url(' + resp.data.landingPageBackgroundURL + ')');
				$('div.videoEmbedHtml').html(resp.data.videoEmbedHtml);
				$('div.bulletPointHtml').html(resp.data.bulletPointHtml.replace(/<li>/g,"<li><i class='fa fa-check'></i> "));
				$('div.additionalInfoHtml').html(resp.data.additionalInfoHtml);
				$('div.logoURL').html("<img src='"+resp.data.logoURL + "'>");
				$('div.logo').html("<img src='../images/intently-logo-top.png'>");
			}
		}
		app.plugins.fetch({ endpoint: 'public/jointventureinfo/' + self.jv, _type: 'GET' }, cb);
	},
	render: function() {
		var self = this;
		$(self.el).html(self.template());
		//TODO: this does not need to be called if the user is authenticated and going to a page e.g. dashboard, settings, etc.
		self.load_jv_bg();
		var model = new Backbone.Model({
			is_jv_signup: true
		})
		//display top signup widget
		var signup1 = new app.views.signup({
			el  		: $(self.el).find('.sign-up-1'),
			model		: model,
			template 	: $('.signup-tmp').html()
		});
		var binding1 = {
			el			: signup1.$el,
			model 		: model,
			template	: $('.signup-tmp').html()
		};
		var signupView1 = new Binding(binding1);
		self.subviews.push(signupView1);
		//display bottom signup widget
		var signup2 = new app.views.signup({
			el  		: $(self.el).find('.sign-up-2'),
			model		: model,
			template 	: $('.signup-tmp').html()
		});
		var binding2 = {
			el			: signup2.$el,
			model 		: model,
			template	: $('.signup-tmp').html()
		};
		var signupView2 = new Binding(binding2);
		self.subviews.push(signupView2);
		//focus on the first signup form
		$(self.el).find('.sign-up-1').find('.email-input').focus();
		//TODO: why is this needed?
		window.scrollTo(0, 0);
/*
		//validation
		skrollr.init({
			forceHeight: false,
			easing: {
				vibrate: function(p) {
					return Math.sin(p * 10 * Math.PI);
				}
			}
		});
		$('input#firstName').focus();
		$('.scrollto').click(function(){
			var $target = $('#' + $(this).data('target'));
			var speed = $(this).data('scroll-duration').length ? $(this).data('scroll-duration') : 1000;
			smoothScrollTo($target, 1500);
		});
*/
	}
});
