//NOTE: this is a full modal popup view
app.views.signup = Backbone.View.extend({
	initialize: function (opts) {
        var self = this;
		self.template	= _.template(opts.template);
        self.model = opts.model;
        app.config.setup_browser_fingerprint();
		this.render();
		return this;
	},
	events: {
		'click                  .modal-button-submit'		: 'signup',
        'keyup                  input'                      : 'onkeyup',
        'blur                   .email-input'               : 'validate_email_field',
        'focus                  .email-input'               : 'reset_field_validation',
        'blur                   .first-name-input'          : 'validate_first_name_field',
        'focus                  .first-name-input'          : 'reset_field_validation',
        'blur                   .last-name-input'           : 'validate_last_name_field',
        'focus                  .last-name-input'           : 'reset_field_validation',
        'blur                   .username-input'            : 'validate_username_field',
        'focus                  .username-input'            : 'reset_field_validation',
        'blur                   .password-input'            : 'validate_password_field',
        'focus                  .password-input'            : 'reset_field_validation'
	},
    onkeyup: function(event) {
        var self = this;
        if(event.keyCode == 13) {
            $(event.target).trigger('blur');
            self.signup();
        }
    },
    validate_email_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.email)) {
            self.email = el.val();
        }
        else {
            self.email = null;
        }
    },
    validate_first_name_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.nonempty)) {
            self.firstname = el.val();
        }
        else {
            self.firstname = null;
        }
    },
    validate_last_name_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.nonempty)) {
            self.lastname = el.val();
        }
        else {
            self.lastname = null;
        }
    },
    validate_username_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.username)) {
            //assume that it is not taken, for now...
            self.username = el.val();
            app.user.fetch_username_availability(self.username, function(resp) {
                if(resp && resp.success && !resp.data) {
                    //username is already taken, invalidate
                    el.parent().addClass("input-error").removeClass("input-border");
                    el.siblings(".right-icon-wrapper").children("i").removeClass("fa-check").addClass("fa-exclamation-triangle");
                    el.parent().attr('data-original-title', 'Username is already taken, please try another.');
                    self.username = null;
                }
            })
        }
        else {
            self.username = null;
        }
    },
    validate_password_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.password)) {
            self.password = el.val();
        }
        else {
            self.password = null;
        }
    },
    reset_field_validation: function(event) {
        var self = this;
        //reset validation
        $(self.el).find(event.target).parent().addClass("input-focus").removeClass("input-border");
    },
	signup: function() {
		var self = this;
        //ensure validation
		if(!self.email || !self.firstname || !self.lastname || !self.username || !self.password) return;
        //show processing
        $(self.el).find('.modal-button-submit').addClass('hidden');
        $(self.el).find('.modal-button-process').removeClass('hidden');
        //sign the user up
        var obj = {
            firstName: self.firstname,
            lastName: self.lastname,
            username: self.username,
            email: self.email,
            password: self.password
        };
        app.user.signup(obj, function(resp) {
            if(resp && resp.success) {
                //do nothing, the user model handles it
            }
            else {
                //reset the form
                $(self.el).find('.modal-button-process').addClass('hidden');
                $(self.el).find('.modal-button-submit').removeClass('hidden');
            }
        });
	},
	render: function() {
		var self = this;
		$(self.el).html(self.template({
            model: self.model
        }));
        $(self.el).find('.email-input').focus();
		return self;
	}
});
