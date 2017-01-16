//NOTE: this is a full modal popup view
app.views.changepassword = Backbone.View.extend({
	initialize: function (opts) {
		this.template = _.template(opts.template);
		this.render();
		return this;
	},
	events: {
		'click                  .modal-button-submit'		: 'changepassword',
        'click                  .modal-button-cancel'       : 'cancel',
        'keyup                  input'                      : 'onkeyup',
        'blur                   .current-password-input'    : 'validate_current_password_field',
        'focus                  .current-password-input'    : 'reset_field_validation',
        'blur                   .new-password-input'        : 'validate_new_password_field',
        'focus                  .new-password-input'        : 'reset_field_validation',
        'blur                   .repeat-password-input'     : 'validate_repeat_password_field',
        'focus                  .repeat-password-input'     : 'reset_field_validation'
	},
    onkeyup: function(event) {
        var self = this;
        if(event.keyCode == 13) {
            $(event.target).trigger('blur');
            self.changepassword();
        }
    },
    validate_current_password_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.nonempty)) {
            self.currentpassword = el.val();
        }
        else {
            self.currentpassword = null;
        }
    },
    validate_new_password_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.password)) {
            self.newpassword = el.val();
        }
        else {
            self.newpassword = null;
        }
    },
    validate_repeat_password_field: function(event) {
        var self = this;
        var el = $(event.target);
        el.parent().removeClass("input-focus").addClass("input-border");
        if(app.config.validate_form_data(el, app.config.validation.passwordrepeat, $(self.el).find(".new-password-input"))) {
            self.repeatnewpassword = el.val();
        }
        else {
            self.repeatnewpassword = null;
        }
    },
    reset_field_validation: function(event) {
        var self = this;
        //reset validation
        $(self.el).find(event.target).parent().addClass("input-focus").removeClass("input-border");
    },
	changepassword: function() {
        var self = this;
        //ensure validation
		if(!self.currentpassword || !self.newpassword || !self.repeatnewpassword) return;
        //show processing
        $(self.el).find('.modal-button-submit').addClass('hidden');
        $(self.el).find('.modal-button-process').removeClass('hidden');
        //change the user password
        var obj = {
            password: self.currentpassword,
            newPassword: self.newpassword,
            newPasswordRepeat: self.repeatnewpassword
        };
		app.user.update_password(obj, function(resp) {
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
	render: function() {
		var self = this;
		$(self.el).html(self.template());
        $(self.el).find('.current-password-input').focus();
		return self;
	}
});
