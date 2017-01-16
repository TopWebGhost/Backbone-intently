app.models.visionboard = Backbone.Model.extend({
	defaults: {
		id									: '',
		authorID							: '',
		name								: '',
		isActive							: '',
		isPublic							: '',
		iabFirstTierCategoryID				: '',
		customTags							: '',	// befree|money|financialfreedom|freedom
		emailDomainMask						: '',
		officialLink						: '',
		shortDescription					: '',
		description							: '',
		dateAdded							: '',	// 2014-03-27 00:23:40
		numSubscriptions					: '',
		numRecommendationSubscriptions		: '',
		numResources						: 0,
		channelLastUpdated					: '',	// 2015-04-07 22:41:59
		authorName							: '',
		authorFileName						: '',	// 9fca8d0ed1cbabbb20be9762e529918d_5424aa50931b23.30060769.jpg
		authorFileWidth						: '',
		authorFileHeight					: '',
		coverFileName						: 'intentlyCover.png'	// 9fca8d0ed1cbabbb20be9762e529918d_5424aa50931b23.30060769.jpg
	},
	initialize: function (data) {

		var self = this;

		self.intentions = app.collection.get_collection({ 
			category: 'intention', 
			type: 'channel', 
			term: data.authorName + '/' + data.name, 
			index_step: 500,
			no_load: true
		});

	},
	create: function (form_data) {
		var self = this;

		form_data._type		= 'POST';

		form_data.endpoint	= 'channels/create/' + encodeURIComponent(form_data.name);

		app.plugins.fetch(form_data, function (err, resp) {
			if(resp && resp.success) {
				app.user.owned.fetch();
				app.user.subscribed.fetch();

				//go to the created board page
				app.router.navigate('#/newvisionboardimages/' + form_data.name.replace(/ /g, '-'), true);
			}
		});
	},
	remove: function() {
		var data = {};
		data.endpoint = 'channels/delete/' + this.get("_id");
		data.channelID = this.get("_id");
		data._type = 'POST';

		var removeID = this.get("id");
		console.log("Remove", data);

		app.plugins.fetch(data, function (err, resp) {
			if(resp && resp.success) {
				app.collection.remove(removeID);

				app.user.owned.fetch();
				app.user.subscribed.fetch();

				app.trigger('success', resp.message);

				//go to the created board page
				app.router.navigate('#/dashboard/', true);
			}
		});
	},
	subscribe: function() {
		var self = this;
		app.plugins.fetch({ endpoint: 'channels/subscribe/' + this.get('_id'), _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				var obj = {
					isSubscribed: '1',
					numSubscriptions: self.get('numSubscriptions') + 1
				};
				self.set(obj);
				app.user.subscribed.fetch();
				app.trigger('success', resp.message);
			}
		});
	},
	unsubscribe: function() {
		var self = this;
		app.plugins.fetch({ endpoint: 'channels/unsubscribe/' + this.get('_id'), _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				var obj = {
					isSubscribed: '0',
					numSubscriptions: Math.max(0, self.get('numSubscriptions') - 1)
				};
				self.set(obj);
				app.user.subscribed.fetch();
				app.trigger('success', resp.message);
			}
		});
	},
	add_intention: function(intention_id, cb) {
		app.plugins.fetch({ endpoint: 'channels/addchannelresource/' + this.get('_id') + '/' + intention_id, _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
			}
			if(typeof cb === 'function') cb(err, resp);
		});
	},
	accept_intention_share: function(share_id, cb) {
		app.plugins.fetch({ endpoint: 'connections/acceptchannelresourceshare/' + share_id + '/' + this.get('_id'), _type: 'POST' }, function (err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
			}
			if(typeof cb === 'function') cb(err, resp);
		});
	},
	get_where: function (where) {
		var self		= this;
		var endpoint	= 'channels/info/' + where.authorName + '/' + where.name;

		app.plugins.fetch({ endpoint: endpoint, _type: 'GET' }, function(err, resp) {
			var board	= resp.data[0];
			board._id	= board.id;
			board.id	= 'visionboard.' + board._id;
			self.set(board);
			self.trigger('init', self);
			var exists	= app.collection.get(board.id);
			if (!exists) {
				app.collection.add(self);
			}
		});
	},
	remove_intention: function(intentionID, cb) {
		var self = this;
		//not a server model
		if(self.id == 'new') return false;
		var epoint = 'channels/removechannelresource/' + this.id.replace(/[a-z0-9]+\./i,'') + '/' + intentionID.replace(/[a-z0-9]+\./i,'');
		app.plugins.fetch({ endpoint: epoint, _type: 'POST' }, function(err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
				self.intentions.remove(intentionID);
			}
			if(typeof cb === 'function') cb(err, resp);
		});
	},
	_update: function (update) {
		var self		= this;
		update.endpoint = 'channels/updateinfo/' + this.get('_id');
		update._type	= 'POST';

		app.plugins.fetch(update, function (err, resp) {
			if(resp && resp.success) {
				app.trigger('success', resp.message);
				self.set(update);
				//super important with name change
				self.intentions = app.collection.get_collection({ category: 'intention', type: 'channel', term: self.get('authorName') + '/' + self.get('name'), index_step: 500, no_fetch: true });
			}
		});
	},
	update_cover:function (data){
		var self		= this;
		var update = {};
		update.endpoint	=	'channels/updatecover/' + this.get('_id') + '/' + data.resourceid;
		update._type 		=	'POST';

		app.plugins.fetch(update , function(err, resp){
			if(resp && resp.success) {
				app.trigger("success", resp.message);
				if(resp.data.length < 1){
					var intention = app.collection.get("intention."+data.resourceid);
					var filename = intention.get("cdnFileName");
					self.set({"coverFileName":filename});
				}
				else{
					self.set(resp.data);
				}
			}
		});
	}
});
