app.collections.base = Backbone.Collection.extend({
	initialize	: function () {

	},
	collections: {
		//'stringified'		: 'subcoll'
	},
	get_collection: function (query) {
		var	query_string	= JSON.stringify(query);

		//console.log("Get Collection", query_string);
		if (this.collections[query_string]) {
			return this.collections[query_string];
		}

		var subquery					= new app.collections.cluster();
		subquery.init(query);
		this.collections[query_string]	= subquery;

		return subquery;
	},
	get_where_nx: function (query) {
		var name = query.name.replace(/-/g, ' ');
		var board = this.findWhere({ authorName: query.authorName, name: name });

		if (board)
			return board;

		// reassign, so -'s are spaces
		query.name = name;
		var board = new app.models.visionboard(query);
		this.add(board);

		board.get_where(query);

		return board;
	}
});
