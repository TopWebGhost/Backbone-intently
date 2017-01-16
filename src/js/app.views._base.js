Backbone.View.prototype.remove = function () {
	var self = this;

	function _on_remove() {
		self.on_remove();
		if (self.undelegateHammerEvents) self.undelegateHammerEvents();
		if (self.undelegateEvents) self.undelegateEvents();
		self.stopListening();
		self.$el.remove();
	}
	if (this.subviews) {
		self.on_remove();
		this.remove_subviews(_on_remove);
	} else {
		_on_remove();
	}

	return this;
};

Backbone.View.prototype.subviews	= [];
Backbone.View.prototype.on_remove	= function () { };
Backbone.View.prototype.initialize	= function (options) { _.extend(this, options); this.render(); return this; }
Backbone.View.prototype.render		= function (options) { this.html(this.template(this)); return this; }

Backbone.View.prototype.remove_subviews = function(cb) {
	if (cb) this._cb = cb;

	if (this.subviews.length == 0) {
		if (this._cb) this._cb();
		return false;
	}

	var subview = this.subviews.shift();

	subview.remove();
	this.remove_subviews(cb);
};
