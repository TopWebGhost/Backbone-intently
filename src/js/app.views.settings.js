app.views.settings = Backbone.View.extend({
	initialize: function(opts) {
		this.template	= _.template(opts.template);
		this.listenTo(app.user,		'change',				this.render);
		this.render();
		return this;
	},
	events: {
		'click		.update-settings'		: 'update_settings',
		'click		.update-password'		: 'update_password'
	},
	update_settings: function() {
		var form_data = app.plugins.form.get('#wrapper .settings-form');
		form_data.showIntendButton = (form_data.showIntendButton) ? '1' : '0';
		form_data.showNewTabOverride = (form_data.showNewTabOverride) ? '1' : '0';
		app.user.update_profile(form_data);
	},
	update_password: function() {
		app.router.navigate('#/changepassword');
	},
	setup_avatar: function() {
		var self = this;
		var dropzone_config = {
			url				: app.config.get_base_api() + 'account/updateavatar',
			withCredentials	: true,
			maxFileSize		: 4,
			acceptedFiles	: 'image/*',
			previewTemplate	: $('.preview-template').html(),
			thumbnail		: function(file, dataUrl) {
				if (file.previewElement) {
					file.previewElement.classList.remove("dz-file-preview");
					var images = file.previewElement.querySelectorAll("[data-dz-thumbnail]");
					for (var i = 0; i < images.length; i++) {
						var thumbnailElement = images[i];
						thumbnailElement.alt = file.name;
						thumbnailElement.src = dataUrl;
					}
					setTimeout(function() { file.previewElement.classList.add("dz-image-preview"); }, 1);
				}
			}
		};
		var myDropzone = new Dropzone("#wrapper .upload-form", dropzone_config);
		myDropzone.on("complete", function(file) {
			app.user.fetch_profile();
		});
	},
	render: function() {
		var user	= app.user.toJSON();
		$(this.el).html(this.template({ obj: user }));
		this.setup_avatar();
		if(user.showIntendButton == true) {
			$('[data-field="showIntendButton"]').attr('checked', 'checked');
		}
		if(user.showNewTabOverride == true) {
			$('[data-field="showNewTabOverride"]').attr('checked', 'checked');
		}
		return this;
	}
});
