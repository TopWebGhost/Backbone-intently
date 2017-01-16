//NOTE: this is a full modal popup view
app.views.login = Backbone.View.extend({
	initialize: function (opts) {
		this.template = _.template(opts.template);
        app.config.setup_browser_fingerprint();
		this.render();
		return this;
	},
	events: {
		'click		            .modal-button-submit'		: 'login',
        'keyup                  input'                      : 'onkeyup',
        'blur                   .username-input'            : 'validate_username_field',
        'focus                  .username-input'            : 'reset_field_validation',
        'blur                   .password-input'            : 'validate_password_field',
        'focus                  .password-input'            : 'reset_field_validation'
	},
    onkeyup: function(event) {
        var self = this;
        if(event.keyCode == 13) {
            $(event.target).trigger('blur');
            self.login();
        }
    },
    validate_username_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.account)) {
            self.username = el.val();
        }
        else {
            self.username = null;
        }
    },
    validate_password_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.nonempty)) {
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
	login: function() {
		var self = this;
        //ensure validation
		if(!self.username || !self.password) return;
        //show processing
        $(self.el).find('.modal-button-submit').addClass('hidden');
        $(self.el).find('.modal-button-process').removeClass('hidden');
        //sign the user in
		var obj = {
            email: self.username,
            password: self.password
        };
        app.user.signin(obj, function(resp) {
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
		$(self.el).html(self.template());
        $(self.el).find('.username-input').focus();
		return self;
	}
});
