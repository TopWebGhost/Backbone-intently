// requres $, config

app.plugins.fetch = function (data, cb) {
	var url			= app.config.get_base_api();
	var dev_url		= app.config.urls.staging.replace('www', 'api') + app.config.api_version + '/';

	if(app.config.env == 'dev') {
		url += 'intently-web-ui/stubs/' + app.config.api_version + '/';
		data._type = 'GET';
	}

	if(data.endpoint) {
		url	+= (app.config.env == 'dev') ? data.endpoint.replace(/\//gi, '-') + '.json' : data.endpoint;
		dev_url	+= data.endpoint;
		delete data.endpoint;
	}

	var contentType;
	if(data.contentType) {
		contentType = data.contentType;
		delete data.contentType;
	}
	else {
		contentType = 'application/x-www-form-urlencoded';
	}

	var type = data._type || 'POST';
	delete data._type;

	url = url.replace(/%2F/gi, '/');

	if(contentType == 'application/json') {
		data = JSON.stringify(data);
	}

	var obj = {
		url: url,
		type: type,
		data: data,
		contentType: contentType,
		xhrFields: {
			withCredentials: true
		},
		success: function(response) {
			//callback
			cb(null, response);
		},
		error: function(err) {
			cb(err, null);
		}
	};

	if(obj.type == 'GET')
		delete obj.data;

	$.ajax(obj);

	// also other url
	if(app.config.env == 'dev') {
		var obj_2 = _.extend(obj, { url: dev_url });
		$.ajax(obj_2);
	}
};
