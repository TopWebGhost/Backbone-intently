//NOTE: this is a full modal popup view
app.views.forgotpassword = Backbone.View.extend({
	initialize: function (opts) {
		this.template	= _.template(opts.template);
		this.render();
		return this;
	},
	events: {
		'click					.modal-button-submit'		: 'forgotpassword',
		'click      			.modal-button-cancel'       : 'cancel',
		'keyup      			input'                      : 'onkeyup',
        'blur                   .email-input'               : 'validate_email_field',
        'focus                  .email-input'               : 'reset_field_validation',
	},
    onkeyup: function(event) {
        var self = this;
        if(event.keyCode == 13) {
            $(event.target).trigger('blur');
            self.forgotpassword();
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
    reset_field_validation: function(event) {
        var self = this;
        //reset validation
        $(self.el).find(event.target).parent().addClass("input-focus").removeClass("input-border");
    },
	forgotpassword: function () {
		var self = this;
		//ensure validation
		if(!self.email) return;
        //show processing
        $(self.el).find('.modal-button-submit').addClass('hidden');
        $(self.el).find('.modal-button-process').removeClass('hidden');
        //recover the users password
		var obj = {
			email: self.email
		};
		app.user.recover_password(obj, function(resp) {
            if(resp && resp.success) {
            	//go back to whatever the user was doing
                app.config.navigate_back();
            }
            else {
                //reset the form
                $(self.el).find('.modal-button-process').addClass('hidden');
                $(self.el).find('.modal-button-submit').removeClass('hidden');
            }
		});
	},
    cancel: function() {
    	//go back to whatever the user was doing
        app.config.navigate_back();
    },
	render: function () {
		var self = this;
		$(self.el).html(self.template());
		$(self.el).find('.email-input').focus();
		return self;
	}
});
