app.collections.cluster = Backbone.Collection.extend({
	category		: null,
	type			: null,
	term			: '',

	more_to_load	: true,
	current_index	: 0,			// intention: 50, user: 20
	index_step		: false,
	category_map	: { visionboard: 'channels', intention: 'channelresources', user: 'users' },
	status			: 'unfetched',
	init: function (opts) {
		/*
			no_load				: null|true
			category			: intention|user|visionboard,
			term				: username|search_term
			type - INTENTION	: channel/authorName/name|available/searchterm|importurl|
			type - USER			: connected|recommended|available|intention
			type - BOARD		: owned|subscribed|available
		*/
		_.extend(this, opts);

		this.model	= app.models[opts.category];

		if (!opts.no_load)
			this._fetch();

		return this;
	},
	fetch: function () {
		// we want to force reset if manually called
		this.reset();
		this.current_index	= 0;
		this.more_to_load	= true;
		this._fetch();
	},
	_fetch: function () {
		var self		= this;

		//do nothing if there are no more to load
		if(!this.more_to_load)
			return this.trigger('status');

		// Generate URL
		var url = this.category_map[this.category] + '/' + this.type;
		if (this.term)
			url += '/' + this.term;

		if (this.index_step)
			url += '/' + this.current_index + '/' + this.index_step;

		this.status = 'fetching';
		self.trigger('status');

		if (this.empty) {
			console.log("Empty the cluster");

			this.reset();
			this.current_index	= 0;
			return self.trigger('status');
		}

		//if (this.category == 'users') console.log("Fetch", url);
		var fixed_endpoint = encodeURIComponent(url);
		app.plugins.fetch({ endpoint: fixed_endpoint.replace(/%2C/g,","), _type: 'GET' }, function(err, resp) {
			if (resp && resp.success) {
				//keep track of index and if there is more to load
				if (!self.index_step) {
					self.more_to_load	= false;
					self.status = 'fetched';
				} else {
					self.current_index	+= self.index_step;
					self.more_to_load	= (resp.totalCount > self.current_index);
					self.status = (self.more_to_load) ? 'fetch' : 'fetched';
				}

				// ADD MODELS TO THIS COLLECTION & GENERAL COLLECTION
				var models = [];
				_.each(resp.data, function(m) {
					m._id	= m.id;
					m.id	= self.category + '.' + m._id;
					var e	= app.collection.get(m.id);
					if (!e)	e = new self.model(m);
					models.push(e);
				});

				app.collection.add(models);
				self.add(models);
				self.trigger('status');
			} else {
				self.status = 'error';
				self.trigger('status', 'error');
			}
		});
	},
	get_where_nx: function (where) {
		// where { authorName: '', name: '' }

		var m			= this.where(where);
		if (m.length > 0)
			return m[0];

		m				= new this.model();
		m.get_where(where);

		return m;
	},
	load_more: function () {
		console.log("Load More!");
		this._fetch();
	},
	intention_share: function (form_data) { // share_intention
		// form_data = { customTags, description, boardID, channelResourceShareID }

		form_data.endpoint	= 'connections/channelresourceshares/' + form_data.channelResourceShareID;
		form_data._type		= 'POST';

		app.plugins.fetch(form_data, function (err, resp) {
			// show intention?
			console.log('share intention', err, resp);
		});
	},
	intention_import: function (form_data) { // import_intention
		// form_data = { imageURL, pageURL, customTags, description, boardID }

		form_data.endpoint	= 'channelresources/importurl/' + form_data.boardID;
		form_data._type		= 'POST';

		app.plugins.fetch(form_data, function (err, resp) {
			console.log('import intention', err, resp);
		});
	},
	intention_share_accept: function (form_data) { // share_intention_accept
		// form_data = { customTags, description, boardID, channelResourceShareID }

		form_data.endpoint	= 'connections/acceptchannelresourceshare/' + form_data.channelResourceShareID + '/' + form_data.boardID;
		form_data._type		= 'POST';

		app.plugins.fetch(form_data, function (err, resp) {
			console.log('share intention accept', err, resp);
		});
	},
	user_fetch_connections: function () {
		var obj = {
			category	: 'user',
			type		: 'connected',
			index_step	: 1000
		};
	},
	user_fetch_recommended: function () {
		var obj = {
			category	: 'user',
			type		: 'recommended'
		};
	},
	user_fetch_available: function () {
		var obj = {
			category	: 'user',
			type		: 'available',
			index_step	: 20
		};
	}
});
