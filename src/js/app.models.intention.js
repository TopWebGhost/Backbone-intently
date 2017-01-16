app.models.intention = Backbone.Model.extend({
	defaults: {
		id					: '',
		acceptedShares		: '',
		cdnFileName			: '',
		customTags			: '',
		dateAdded			: '',		// 2014-06-04 23:23:47
		description			: '',
		destination			: null,
		dislikes			: '',
		fileLastUpdated		: '',		// 2014-06-04 23:23:46
		height				: '',
		isActive			: '',
		likes				: '',
		maxHeight			: '',
		maxWidth			: '',
		minHeight			: '',
		minWidth			: '',
		name				: '',
		resourceTypeID		: '',
		shares				: '',
		userID				: '',
		width				: '',
		impression			: null
	},
	initialize: function (obj) {
		if (!obj.src)
			this.set('src', app.config.get_base_cdn() + 'cover/' + obj.cdnFileName);
		else
			this.set('src', obj.src);
	},
	share_intention: function (userID, msg) {
		var endpoint = 'connections/sharechannelresource/' + this.get('_id') + '/' + userID;
		app.plugins.fetch({ endpoint: endpoint, _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
			}
		});
	},
	add_intention_to_vb: function(data) {
		var form_obj = _.pick(data, 'customTags', 'description');

		form_obj.endpoint	= 'channels/addchannelresource/' + data.boardID.replace(/[a-z0-9]+\./i,'') + '/' + data.id.replace(/[a-z0-9]+\./i,'');
		form_obj._type		= 'POST';

		app.plugins.fetch(form_obj, function (err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
			}
		});
	},
	_update: function(form_data) {
		var self			= this;
		var req_obj			= _.extend({}, form_data);
		req_obj.endpoint	= 'channelresources/updateinfo/' + this.id.replace(/[a-z0-9]+\./i,'');
		req_obj._type		= 'POST';

		app.plugins.fetch(req_obj, function (err, resp) {
			if(resp && resp.success) {
				self.set(form_data);
				app.trigger('success', resp.message);
			}
		});
	},
	fetch_info: function(id) {
		var self = this;
		var _id = id || self.get('_id');
		app.plugins.fetch({ endpoint: 'channelresources/info/' + _id + '/0', _type: 'GET' }, function (err, resp) {
			if(resp && resp.success && resp.data.length > 0) {
				//a little pre-processing
				var intention = resp.data[0];
				intention.src = app.config.get_base_cdn() + 'cover/' + intention.cdnFileName;
				intention._id = intention.id;
				intention.id = "intention."+intention.id;
				self.set(intention);
				//add to collection
				app.collection.add(self);
			}
		});
	},
	like: function() {
		var self = this;
		app.plugins.fetch({ endpoint: 'channelresources/like/' + this.get('_id'), _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				var obj = {
					impression: '1'
				};
				self.set(obj);
				app.trigger('success', resp.message);
			}
		});
	},
	dislike: function() {
		var self = this;
		app.plugins.fetch({ endpoint: 'channelresources/dislike/' + this.get('_id'), _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				var obj = {
					impression: '0'
				};
				self.set(obj);
				app.trigger('success', resp.message);
			}
		});
	}

});
