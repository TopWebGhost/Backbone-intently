app.views.externalshare = Backbone.View.extend({
	initialize: function (opts) {
		this.template = opts.template;
		this.opts		= opts;
		var Model = Backbone.Model.extend();
		var model = new Model({
			cdnFileName:'',
			width:0,
			height:0,
			src:app.config.get_base_cdn()
		});
		if (this.opts.router.id) {
			this.share_id = this.opts.router.id;
		}

		this.init(model);

		return this;
	},
	init:function(model){
		this.stopListening();

		this.model = model;

		this.render();
	},

	load_shared_intention: function () {
		var self = this;

		function cb(err, resp) {
			if(resp && resp.data && resp.data.length > 0) {
				var imageHtml = '<img class="externalShareIntention" src="' + app.config.get_base_cdn() + 'cover/' + resp.data[0].cdnFileName +'" />'
				$('.cdnImage').parent().html(imageHtml);
				$('.content').css("margin", 0);
				$('#loading-image').hide();
				$('#cta')[0].style.top = '10vh';
				$(self).addClass("unfiltered");
				$('#cta').show();
				$('.heroImage').removeClass('hidden');
				setTimeout(function checkHeight(){
					console.log("run checkHeight: ",$('.externalShareIntention').css('height'));
					if($('.externalShareIntention').css('height')!='0'){
						$('.exampleImage').css('height',$('.externalShareIntention').css('height'));
					}else{
						setTimeout(checkHeight,50);
					}
				},50);
			}
		}

		this.getData(cb);
	},
	redirect: function(){
		function cb(err, resp){
			if(resp.data && resp.data.length > 0) {
				// app.router.page('intention','intention.' + resp.data[0].channelResourceID);
				app.router.navigate('#/intention/intention.' + resp.data[0].channelResourceID,true);
				console.log(resp.data[0]);
			}
		}
		this.getData(cb);
	},
	getData:function(cb){
				app.plugins.fetch({ endpoint: 'public/externalshareinfo/channelresource/' + this.share_id, _type: 'GET' }, cb);
	},
	render: function() {
		var self			= this;
		var user			= app.user.toJSON();
		console.log("router ",app.router);
		var bindings = {
			el: this.el,
			model: this.model,
			template: this.template
		};


		if(user._signed_in){
			this.redirect();
		}else{
			var view = new Binding(bindings);
			this.subviews.push(view);
			this.load_shared_intention();
		}

		return this;
	}
});
