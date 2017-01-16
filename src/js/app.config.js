app.config = {
	env		: (function() {		// dev|staging|qa|prod
		var HREF = window.location.href;
		if (HREF.indexOf('qaintently') > -1)		return 'qa';
		else if (HREF.indexOf('.intently.') > -1)	return 'prod';
		else										return 'staging';
	})(),
	urls: {
		dev			: 'http://travis.devintently.com:1337/',
		staging		: 'https://www.devintently.com/',
		qa			: 'https://www.qaintently.com/',
		prod		: 'https://www.intently.com/',
	},
	cdn_root: {
		dev 		: 'https://d3je29yutkjxpq.cloudfront.net/',
		staging 	: 'https://d3je29yutkjxpq.cloudfront.net/',
		qa 			: 'https://d20hujj0w6qwly.cloudfront.net/',
		prod		: 'https://dk3wu32ros038.cloudfront.net/',
	},
	about_page: {
		dev 		: 'http://about.devintently.com/',
		staging 	: 'http://about.devintently.com/',
		qa 			: 'http://about.qaintently.com/',
		prod 		: 'http://about.intently.com/'
	},
	validation: {
		nonempty: {
			condition: function(val) { return XRegExp("^.+$").test(val); },
			message: 'Field is required.' 
		},
		account: { 
			condition: function(val) { return (app.config.validation.username.condition(val) || app.config.validation.email.condition(val)); },
			message: 'Must be a username (between 4 and 20 alphanumeric and "_" characters only) or a valid email address.' 
		},
		password: { 
			condition: function(val) { return (XRegExp('[\\p{L}]+').test(val) && XRegExp('[0-9]+').test(val) && val.length >= 8 && val.length <= 32); },
			message: 'Password must be between 8 and 32 characters and contain at least one letter and one number.' 
		},
		passwordrepeat: {
			condition: function(val, matchingVal) { return (XRegExp('[\\p{L}]+').test(val) && XRegExp('[0-9]+').test(val) && val.length >= 8 && val.length <= 32 && val == matchingVal); },
			message: 'Passwords do not match.' 
		},
		username: {
			condition: function(val) { return XRegExp("^([\\p{L}0-9_]{4,20})$").test(val); },
			message: 'Username must be between 4 and 20 alphanumeric and "_" characters only.'
		},
		email: {
			//TODO: for some reason this matches blah@blah, but we just let the api handle it for now
			condition: function(val) { return XRegExp("^([\\p{L}0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[\\p{L}0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[\\p{L}0-9](?:[\\p{L}0-9-]*[\\p{L}0-9])?\.)+[\\p{L}0-9](?:[\\p{L}0-9-]*[\\p{L}0-9])?)$").test(val); },
			message: 'Not a valid email address.'
		},
		creditcardnumber: {
			condition: function(val) { return Stripe.card.validateCardNumber(val); },
			message: 'Not a valid credit card number.'
		},
		creditcardexpiry: {
			condition: function(val) { var parts = val.split('/'); if(parts.length < 2) return false; return Stripe.card.validateExpiry(parts[0], parts[1]); },
			message: 'Not a valid expiration.'
		},
		creditcardcvc: {
			condition: function(val) { return Stripe.card.validateCVC(val); },
			message: 'Not a valid CVC.'
		},
		hashtag: {
			condition: function(val) { return XRegExp('^#[\\p{L}0-9]{1,24}$').test(val); },
			message: 'Hashtags must begin with a pound sign and may only contain up to 24 alphanumeric characters.'
		}
	},
	get_base_url: function() {
		return this.urls[this.env];
	},
	get_base_cdn: function() {
		return this.cdn_root[this.env];
	},
	get_base_api: function() {
		if (this.env == 'dev') {
			return this.urls[this.env];
		} else {
			return this.urls[this.env].replace('www', 'api') + this.api_version + '/';
		}
	},
	get_about_url: function() {
		return this.about_page[this.env];
	},
	get_about_pro_url: function() {
		return this.about_page[this.env] + 'intently-pro';
	},
    validate_form_data: function(el, validation, matchingEl) {
    	if(!validation || !validation.condition(el.val(), ((matchingEl) ? matchingEl.val() : null))) {
            //boolean condition validation failed or input is blank
            el.parent().addClass("input-error").removeClass("input-border");
            el.siblings(".right-icon-wrapper").children("i").removeClass("fa-check").addClass("fa-exclamation-triangle");
            el.parent().attr('data-original-title', validation.message);
            //el.parent().tooltip({ show: { effect: "blind", duration: 800 } });
            //el.parent().tooltip('enable');
            return false;
        }
        //validation passed
        el.parent().attr('data-original-title', '');
        //el.parent().tooltip('disable');
        el.parent().removeClass("input-error").addClass("input-border");
        el.siblings(".right-icon-wrapper").children("i").removeClass("fa-exclamation-triangle");
        //ensure input is not blank
        if(el.val() !== "") {
            el.siblings(".right-icon-wrapper").children("i").addClass("fa-check");
        }
        else {
            el.siblings(".right-icon-wrapper").children("i").removeClass("fa-check").removeClass("fa-exclamation-triangle");
        }
        return true;
    },
	setup_browser_fingerprint: function() {
		// strip the protocol and subdomain
		var cookieDomain	= '.' + app.config.urls[app.config.env].replace(/https?:\/\/.+?\./, '').replace(/\/.*/, '');
		// generate and set the bfp cookie
		var bfp				= new Fingerprint({ screen_resolution: true, canvas: true, ie_activex: true }).get();
		Cookies.set('bfp', bfp, { secure: true, domain: cookieDomain, expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365) });
	},
	trunc: function(s, n, useWordBoundary) {
		var toLong = s.length > n,
		s_ = toLong ? s.substr(0,n-1) : s;
		s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
		return  toLong ? s_ + '&hellip;' : s_;
	},
	navigate_back: function() {
        //go to previous page
        if(Backbone.history.intently_pages.length > 0) { 
            Backbone.history.history.back();
        }
        else {
            //no previous page, go to default page
            app.router.navigate('#/dashboard');
        }
	},
	data						: {},
	api_version					: 'latest',
	generic_api_error_message	: 'Whoops! Something unexpected occurred, we\'ve logged the issue and will look into it. Please try again later.',
	jv							: {}, //this saves the last jv signup page the user visited
	pro_after_auth				: false, //will go to the pro page after user is authenticated
	public_pages				: ['loading', 'login', 'signup', 'forgotpassword', 'jv'], //externalshare should go here, once feature is implemented
	no_searchbar_pages			: ['curate'], //also not present on public pages
	full_modal_pages: { //pages that should open in full modal dialog
		loading: {
			modalOpts: { show_close_button: false, show_intently_logo: false }
		},
		jv: {
			modalOpts: { show_close_button: false, show_intently_logo: false }
		},
		login: {
			modalOpts: { show_close_button: false, show_intently_logo: true }
		},
		signup: {
			modalOpts: { show_close_button: false, show_intently_logo: true }
		}, 
		forgotpassword: {
			modalOpts: { show_close_button: true, show_intently_logo: true }
		},
		changepassword: {
			modalOpts: { show_close_button: true, show_intently_logo: true }
		},
		pro: {
			modalOpts: { show_close_button: true, show_intently_logo: true }
		},
		welcome: {
			modalOpts: { show_close_button: false, show_intently_logo: true }
		},
		meme: {
            modalOpts: { show_close_button: true, show_intently_logo: true, header_text: 'MEME TOOL' }
		},
		maia: {
			modalOpts: { show_close_button: true, show_intently_logo: true }
		},
		404: {
			modalOpts: { show_close_button: true, show_intently_logo: true }
		}
	},
	partial_modal_pages: { //pages that should open in partial modal dialog
		intentionshare: { overlay_event: 'overlay:review_intention_share' }
	}
};


function get_uri() {
	if (app.config.env == 'dev') {
		return window.location.hash.replace('#', '');
	} else {
		return window.location.href.replace(app.config.get_base_url(), '');
	}
}

app.config.uri = get_uri();
app.config.setup_browser_fingerprint();
