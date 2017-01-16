app.plugins.form = {
	un_nest: function (form_data) {
		var result = {},
			layers,
			end,
			length;

		_.each(form_data, function(val, key) {
			layers		= key.split('.');
			end			= result;
			length		= layers.length;

			_.each(layers, function(layer) {
				length--;

				if (length == 0) 			end[layer]	= val;
				else if (!end[layer]) 		end[layer]	= {};

				end = end[layer];
			});
		});

		return result;
	},
	get: function (context) {
		context = context || '.content';

		var obj = {};

		function get_form_item(i, el) {
			var field	= $(el).attr('data-field');
			var value	= $(el).val();

			if (field)
				obj[field]	= value;
		};

		$(context + ' input:hidden').each(get_form_item);
		$(context + ' input:password').each(get_form_item);
		$(context + ' input:text').each(get_form_item);
		$(context + ' input:checkbox:checked').each(get_form_item);
		$(context + ' input:radio:checked').each(get_form_item);
		$(context + ' input[type="range"]').each(get_form_item);
		$(context + ' select').each(get_form_item);
		$(context + ' textarea').each(get_form_item);

		_.each(obj, function(val, key) {
			if (!isNaN(parseInt(val, 10)) && parseInt(val, 10) == val)
				obj[key] = parseInt(val, 10);
		});

		return this.un_nest(obj);
	},
	update: function (data, context) {
		context = context || '#the-page-content';

		var obj = (_.isObject(data)) ? data : JSON.parse(data);

		$(context + ' input:hidden').each(function (i, el) {
			var field	= $(el).attr('data-field');
			$(el).val(obj[field]);
		});

		$(context + ' input:text').each(function (i, el) {
			var field	= $(el).attr('data-field');
			$(el).val(obj[field]);
		});

		$(context + ' input:radio').each(function (i, el) {
			var field	= $(el).attr('data-field');
			if (obj[field]) {
				var val = $(el).val();
				if (val == obj[field]) $(el).attr('checked', 'checked');
			}
		});

		$(context + ' input[type="range"]').each(function (i, el) {
			var field	= $(el).attr('data-field');
			$(el).val(obj[field]);
		});

		$(context + ' select').each(function (i, el) {
			var field	= $(el).attr('data-field');
			$(el).val(obj[field]);
		});

		return obj;
	},
	reset: function (context) {
		context = context || '.content';

		var obj = {};

		function get_form_item(i, el) {
			$(el).val('');
		};

		$(context + ' input:password').each(get_form_item);
		$(context + ' input:text').each(get_form_item);
		$(context + ' input:checkbox:checked').each(get_form_item);
		$(context + ' input:radio:checked').each(get_form_item);
		$(context + ' input[type="range"]').each(get_form_item);
		$(context + ' select').each(get_form_item);
		$(context + ' textarea').each(get_form_item);
	}
};
