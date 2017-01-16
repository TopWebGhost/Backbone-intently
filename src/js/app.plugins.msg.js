app.plugins.msg = {
	queue: [],
	initialize: function () {
		this.listenTo(app, 'notifications:alert',			this.alert);
		this.listenTo(app, 'notifications:prompt',		this.prompt);
		this.listenTo(app, 'notifications:confirm',		this.confirm);
		this.listenTo(app, 'notifications:notify',		this.notify);
		this.listenTo(app, 'success',                 this.notifySuccess);
    this.listenTo(app, 'error',                   this.notifyError);

		// reset
		$('#notification').velocity({ 'translateX': 0, 'translateY': -110, 'translateZ': 0 }, { duration: 0 });
		$('#notification-success').velocity({ 'translateX': 0, 'translateY': -110, 'translateZ': 0 }, { duration: 0 });
		$('#notification-error').velocity({ 'translateX': 0, 'translateY': -110, 'translateZ': 0 }, { duration: 0 });

	},
	alert: function (message, btn_text) {
		window.alert(message);
	},
	prompt: function (placeholder, cb, title, buttons) {
		//don't use placeholder or buttons
		var response = window.prompt(title);

		var buttonIndex = (response == null) ? 1 : 0;

		cb({ buttonIndex: buttonIndex, input1: response });
	},
	confirm: function (data) {
		var result = window.confirm(data.title);
		return (result == true) ? data.success() : data.cancel();
	},
	notify: function (msg, url) {
		var note = { 'el': '#notification', 'msg': msg };
		this.queue.push(note);

		// call show_notification if there is only one object in queue
		if (this.queue.length == 1) this.show_notification(this.queue[0]);
	},
	notifySuccess: function (msg, url) {
		var note = { 'el': '#notification-success', 'msg': msg };
		this.queue.push(note);

		// call show_notification if there is only one object in queue
		if (this.queue.length == 1) this.show_notification();
	},
	notifyError: function (msg, url) {
		var note = { 'el': '#notification-error', 'msg': msg };
		this.queue.push(note);

		// call show_notification if there is only one object in queue
		if (this.queue.length == 1) this.show_notification();
	},
	show_notification: function() {
		if (this.queue.length == 0) return;

		var self = this;
		var obj = this.queue[0];
		$(obj.el).html('<p class="center no-stuffing">' + obj.msg + '</p>');

		$(obj.el).velocity({ 'translateY': 0 }, { duration: 500 })
			.velocity({ 'translateY': -110 }, { delay: 1500, duration: 500, complete: function(elements) {
		    // remove first object in queue
				self.queue.shift();

				// call show_notification if there are still notifications in the queue
				if (self.queue.length > 0) self.show_notification();
		} });
	}
};

_.extend(app.plugins.msg, Backbone.Events);
