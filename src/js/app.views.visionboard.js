app.views.visionboard	= Backbone.View.extend({
	$grid: false,
	initialize: function (opts) {
		var self = this;
		self.subviews						= [];
		self.opts							= opts;
		self.editable_is_setup 				= false;
		self.masonry_container				= '.visionboard-active-intentions';
		self.masonry_item_selector			= '.card-intention';
		self.preview_items_displayed		= 0;
		self.preview_displayed 				= false;
		self.blank_preview_items			= 16;
		if (opts.template) self.template 	= opts.template;

		var model = app.collection.get_where_nx(_.pick(opts.router, 'authorName', 'name'));
		if(model.id != '') {
			//the model was here, proceed immediately
			self.init(model);
		}
		else {
			//wait for the model to be retrieved before rendering
			model.once('change', function() {
				self.init(model);
			});
		}

		return self;
	},
	events: {
		'click			.subscribe'						: 'subscribe',
		'click			.unsubscribe'					: 'unsubscribe',
		'click 			.card-intention-image.preview'	: 'preview_image_click',
		'click			.intention-add'					: 'add_intention',
		'click			.intention-remove'				: 'remove_intention',
		'keyup 			.new-tag'						: 'tag_enter',
		'click			.remove-tag'					: 'remove_tag',
		'click			.edit-tags' 					: 'show_tags_modal',
		'click			.add-tag'						: 'add_tag',
		'click			.edit-cover'					: 'show_cover_modal',
		'click			.select-cover'					: 'select_cover',
		'click			.close-cover-modal'				: 'save_cover',
		'click			.explore-add'					: 'explore_add'
	},
	init: function (model) {
		var self = this;
		self.stopListening();
		self.model = model;

		self.listenTo(self.model.intentions,	'all',							self.render_intentions);
		self.listenTo(self.model.intentions,	'status',						self.render_status);
		self.listenTo(app,      				'intention:confirmed_delete', 	self.delete_intention);
		self.listenTo(self.model,				'change:name',					self.update_url);
		self.listenTo(self.model,				'change:coverFileName',			self.update_sidebar);

		self.render();

	},
	init_masonry: function() {
		var self = this;
		self.$grid = self.$(self.masonry_container).masonry({ itemSelector: self.masonry_item_selector, transitionDuration: '0.5s' });
	},
	explore_add: function() {
		var self = this;
		app.router.navigate('#/curate/' + this.model.get('name'));
	},
	render_status: function () {
		//unfetched / fetching / fetch / fetched
		var status = this.model.intentions.status;
		this.$('.unfetched, .fetching, .fetch, .fetched').addClass('hidden');
		this.$('.' + status).removeClass('hidden');
	},
	update_url: function () {
		app.router.navigate('#/@' + this.model.get('authorName') + '/' + this.model.get('name').replace(/ /g, '-'));
	},
	update_sidebar: function() {
		if (app.user.owned.get(this.model)) {
			app.user.owned.fetch();
		}
		if (app.user.subscribed.get(this.model)) {
			app.user.subscribed.fetch();
		}
	},
	tag_enter: function (e) {
		if (e.keyCode == 13) {	// we hit enter, let's search
			this.save_tag($(e.target).val());
			$(e.target).val("");	// clear input
		}
	},
	add_tag: function(e) {
		this.save_tag($(e.target).html());
		$(e.target).addClass("hidden");
	},
	remove_tag: function(e) {
		var data = $(e.currentTarget).data();
		var all_tags = this.model.get('customTags').split('|');
		var remove_index = all_tags.indexOf(data.tag);
		if (remove_index != -1) {
			all_tags.splice(remove_index, 1);

			// apply to edit form
			this.$('.customTags').val(all_tags.join('|'));
			this.save();
		}
	},
	save_tag: function(tag) {
		if (tag != '') {
			if (tag.length > 24) return app.trigger('error', 'Please keep tags to 24 characters or less.');

			var form_data = app.plugins.form.get('#wrapper .edit-board');

			var all_tags = [];
			if (form_data.customTags != "") all_tags = form_data.customTags.split('|');
			all_tags.push(tag);

			this.$('.customTags').val(all_tags.join('|'));
			this.save();
		}
	},
	remove_intention: function (e) {
		var self			= this;
		var $el				= $(e.target).parents('.intention');
		var intention_id	= $el.attr('data-intention-id');
		app.trigger('overlay:confirm_intention_delete', intention_id);
	},
	delete_intention: function(intention_id) {
		var self			= this;
		var $el				= this.$('.intention-'+intention_id);
		
		//callback function
		var cb = function(err, resp) {
			if(resp && resp.success) {
				//remove from the grid and refresh
				$el.remove();
				if(self.$grid) self.$grid.masonry('reloadItems').masonry();
			}
		}
		self.model.remove_intention(intention_id.toString(), cb);
	},
	add_intention: function (e) {
		var $el				= $(e.target).parents(this.masonry_item_selector);
		var intention_id	= $el.attr('data-intention-id');

		var intention_model = this.intention_collection.get(intention_id);
		this.intention_results.add(intention_model);
		this.intention_collection.remove(intention_model);
	},

	show_tags_modal: function(e) {
		var self = this;
    	this.$('.tags-modal').modal('show');
		this.$('.tags-modal').on('hidden.bs.modal', function (e) {
    		self.$('.custom-modal-backdrop').hide();
		});
    	this.$('.custom-modal-backdrop').show();

		// append the list of suggested tags taken from images
		this.$('.suggested-desc').addClass("hidden");
		this.$('.suggested-tags').html('');
		var all_tags = new Backbone.Collection();
		all_tags.comparator = 'count';
		this.model.intentions.each(function(intention) {
			var tags = intention.get('customTags');
			if (tags) {
				var split_tags = tags.split('|');
				_.each(split_tags, function(tag) {
					var existingTag = all_tags.get(tag);
					if (existingTag) {
						existingTag.set('count', existingTag.get('count') - 1);
					} else {
						var newTag = new Backbone.Model({ id: tag, count: -1 });
						all_tags.add(newTag);
					}
				});
			}
		});

		var i = 0;
		var current_tags = this.model.get('customTags').split('|');
		all_tags.each(function(tag) {
			if (tag.get('count') < -1 && i < 10 && current_tags.indexOf(tag.id) == -1) { // make sure tag shows up more than once, and isn't already selected for this vb
				self.$('.suggested-tags').append('<button class="btn btn-primary add-tag ml1 mr1 mb1">'+tag.id+'</button>');
				i++;
			}
		});
		if (i > 0) this.$('.suggested-desc').removeClass("hidden");
	},
	show_cover_modal: function(e) {
		var self = this;
    	this.$('.cover-modal').modal('show');
		this.$('.cover-modal').on('hidden.bs.modal', function (e) {
    		self.$('.custom-modal-backdrop').hide();
		});
    	this.$('.custom-modal-backdrop').show();
		this.$('.cover-images').html("");
		var coverImage = this.model.get("coverFileName");
		this.model.intentions.each(function(intention) {
			var image = intention.get('cdnFileName');
			if(image == coverImage) {
				self.$('.cover-images').append('<div class="avatar cover-selected select-cover left clickable mb1 data" data-resourceid="' + intention.get("_id") + '" style="background-image:url('+app.config.get_base_cdn()+'cover/'+intention.get('cdnFileName')+');"></div>');
			}
			else {
				self.$('.cover-images').append('<div class="avatar left clickable mb1 select-cover data" data-resourceid="' + intention.get("_id") + '" style="background-image:url('+app.config.get_base_cdn()+'cover/'+intention.get('cdnFileName')+');"></div>');
			}
		});
	},
	select_cover: function(e) {
		this.$('.cover-selected').removeClass('cover-selected');
		this.$(e.target).addClass('cover-selected');
	},
	save_cover: function(e) {
		this.model.update_cover({'resourceid':this.$('.cover-selected').data().resourceid});
	},
	make_public: function(e) {
		this.$('.public_vb').removeClass('btn-default').addClass('btn-primary');
		this.$('.private_vb').removeClass('btn-primary').addClass('btn-default');
		this.$('.isPublic').val(1);
	},
	make_private: function(e) {
		this.$('.private_vb').removeClass('btn-default').addClass('btn-primary');
		this.$('.public_vb').removeClass('btn-primary').addClass('btn-default');
		this.$('.isPublic').val(0);
	},
	validateFormdata: function() {
		var self = this;
		var nameMatch = /^[a-zA-Z 0-9\'!._,%]{1,100}$/;
		var descMatch = /^[a-zA-Z 0-9]*/;
		var vbname = $('#vbName_edit').val();
		var vbdesc = $('#vbDesc_edit').val();

		if(nameMatch.exec(vbname) == null){
			app.trigger('error', 'Please provide your vision board a valid name.');
			return false;
		}

		if(descMatch.exec(vbdesc) == null){
			app.trigger('error', 'Please provide your vision board a valid description (alphanumeric characters only).');
			return false;
		}
		return true;
	},
	getFormData: function() {
		if(!this.validateFormdata())
			return;
		var form_data = app.plugins.form.get('#wrapper .edit-board');
		var customTags = "";
		var vbTags = $('.tagit-label');
		var tags = '';
		for(var i = 0; i < vbTags.length; i++) {

			tags += vbTags[i].innerText + "|";
		}
		tags = tags.substring(0,tags.length-1);

		if($("#pr_yes_edit").hasClass("success"))
			form_data.isPublic = 0;
		else
			form_data.isPublic = 1;
		form_data.customTags = tags;
		form_data.shortDescription = form_data.description;
		return form_data;
	},
	save: function () {
		var form_data = this.getFormData();
		this.model._update(form_data);
    	this.$('.edit-modal').modal('hide');
	},
	subscribe: function () {
		this.model.subscribe();
	},
	unsubscribe: function () {
		this.model.unsubscribe();
	},
	editable_setup: function () {
		var self = this;

		//do not set up more than once
		if(self.model.get('isOwned') == '0' || self.model.get('hasAccess') == '0' || !self.model.get('_id') || self.editable_is_setup) return;
		if (!self.$grid) this.init_masonry();

		//create the image creation card and bind it
		if(self.model.get('isPremium') == '0') {
			var createintentioncard_model = new Backbone.Model({
				id: 'intention.-1',
				_id: '-1',
				_is_image_creation_card: true
			});
			var $newelem = new app.views.intentioncard({
				model 		: createintentioncard_model,
				template 	: $('.intentioncard-tmp').html()
			});
			var binding = {
				el			: $newelem.$el,
				model		: createintentioncard_model,
				template	: $('.intentioncard-tmp').html()
			};
			var view = new Binding(binding);
			self.subviews.push(view);
			//add to the grid
			self.$grid.prepend($newelem.$el).masonry('prepended', $newelem.$el);
		}

		//only show explore / add button if not premium
		var addintentioncard_model = new Backbone.Model({
			id: 'intention.-1',
			_id: '-1',
			_is_add_intention_card: true,
			_show_explore_add_button: ((this.model.get('isPremium') == '0') ? true : false)
		});
		//create the upload / explore card and bind it
		var $newelem = new app.views.intentioncard({
			model 		: addintentioncard_model,
			template 	: $('.intentioncard-tmp').html()
		});
		var binding = {
			el			: $newelem.$el,
			model		: addintentioncard_model,
			template	: $('.intentioncard-tmp').html()
		};
		var view = new Binding(binding);
		self.subviews.push(view);
		//add to the grid
		self.$grid.prepend($newelem.$el).masonry('prepended', $newelem.$el);

		// upload intention form
		var dropzone_config = {
			url				: app.config.get_base_api() + 'channelresources/upload/' + self.model.get('_id'),
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

		var myDropzone = new Dropzone("#wrapper .card-add-intention", dropzone_config);
		myDropzone.on('addedfile', function(event) {
			self.$grid.masonry('layout');
		});
		myDropzone.on('complete', function(file) {
			self.model.intentions.fetch();
		});
		self.editable_is_setup = true;
	},
	render_intentions: function (action, model) {
		var self		= this;

		if (self.model.intentions.status != "fetch" && self.model.intentions.status != "fetched") return false;
		if (!self.$(self.masonry_container)) return false;
		if (['status', 'fetched', 'sort', 'reset'].indexOf(action) > -1) return false;
		if (!self.$grid) this.init_masonry();

		var json		= self.model.toJSON();
		var username	= app.user.get('username');

		if (action == 'reset') {
			var elems = self.$grid.masonry('getItemElements');
			self.$grid.masonry('remove', elems);
		} else if (action == 'remove') {
			var rm_json = model.toJSON();
			var elem = self.$('.intention-' + rm_json._id);

			var reloadItems = false;
			var elems = self.$grid.masonry('getItemElements');
			if ($(elems[0]).hasClass('intention-' + rm_json._id)) {
				reloadItems = true;
			}

			if (reloadItems) {
				elem.remove();
				self.$grid.masonry('reloadItems').masonry();
			} else {
				self.$grid.masonry('remove', elem);
			}
		} else if (action == 'add') {
			//if the visionboard is purchased/accessible, so are the intentions
			var obj = {
				_hide_share_button: false,
				_hide_add_button: false,
				_show_premium_label: false,
				_show_preview_label: false,
				_show_remove_button: false,
				_curate_mode: false
			};
			if(self.model.get('isPremium') == '1') {
				//no sharing or adding premium images
				obj._hide_share_button = true;
				obj._hide_add_button = true;
				if(self.model.get('hasAccess') == '1') {
					obj._show_premium_label = true;
				}
				else if(self.preview_items_displayed >= self.get_num_columns() || self.preview_items_displayed == self.model.intentions.length) {
					//only display first row of preview images
					return;
				} 
				else {
					//tease them
					obj._show_preview_label = true;
				}
			}
			if(self.model.get('isOwned') == '1') obj._show_remove_button = true;
			model.set(obj);

			//ensure the intention is not already added
			var not_added = true;
			var elems = self.$grid.masonry('getItemElements');
			_.each(elems, function(elem) {
				if ($(elem).hasClass('intention-' + model.get('_id'))) {
					not_added = false;
					return false;
				}
			});

			if(not_added && self.$grid) {
				//create the card and bind it
				var $newelem = new app.views.intentioncard({
					model 		: model,
					template 	: $('.intentioncard-tmp').html()
				});
				var binding = {
					el			: $newelem.$el,
					model		: model,
					template	: $('.intentioncard-tmp').html()
				};
				var view = new Binding(binding);
				self.subviews.push(view);
				//add to the grid
				self.$grid.append(view.$el).masonry('appended', view.$el);
				//increment number of preview images shown
				if(self.model.get('hasAccess') == '0') {
					self.preview_items_displayed++;
				}
			}
		}

		//redo the layout for each image load
		if(self.$grid) self.$grid.imagesLoaded('progress', function(imageLoadEvent) {
			if(self.$grid) {
				self.$grid.masonry('layout');
				//check if preview images are all loaded
				if(imageLoadEvent.isComplete && self.preview_items_displayed > 0 && (imageLoadEvent.images.length >= self.get_num_columns() || imageLoadEvent.images.length == self.model.intentions.length)) {
					//display the preview
					if(!self.preview_displayed) self.display_preview();
				}
			}
		});
	},
	display_preview: function() {
		var self = this;
		//add some blank intentions
		for(var lcv = 0; lcv < self.blank_preview_items; lcv++) {
			//random height between 100 and 300
			var blankIntentionModel = new Backbone.Model({
				_is_blank_preview_card: true,
				height: 100 + (2 * Math.round(Math.random() * 100))
			});
			//create the card and bind it
			var $newelem = new app.views.intentioncard({
				model 		: blankIntentionModel,
				template 	: $('.intentioncard-tmp').html()
			});
			var binding = {
				el			: $newelem.$el,
				model		: blankIntentionModel,
				template	: $('.intentioncard-tmp').html()
			};
			var view = new Binding(binding);
			self.subviews.push(view);
			//add to the grid
			self.$grid.append(view.$el).masonry('appended', view.$el);
		}
		//display the upsell
		var displayModel = {
			position_top: self.get_first_row_height() + 50,
			num_resources: self.model.get('numResources')
		};
		$(self.masonry_container).eq(0).append(_.template($('.premiumvisionboardupgrade-tmp').html())(displayModel));
		self.preview_displayed = true;
	},
	//this currently is not used but might be helpful in the future
	get_first_row_height: function() {
		var self = this;
		var tallestItem = 0;
		for(var lcv = 0; lcv < self.get_num_columns(); lcv++) {
			var itemHeight = $(self.masonry_item_selector).eq(lcv).height();
			if(itemHeight > tallestItem) tallestItem = itemHeight;
		}
		return tallestItem;
	},
	//this currently is not used but might be helpful in the future
	get_num_columns: function() {
		//clone a hidden masonry object and look at the css width
		var fakeMasonryElement = $(this.masonry_item_selector).eq(0).clone().appendTo('body').wrap('<div style="display: none"></div>'); 
		var widthPercentage = parseFloat(fakeMasonryElement.css('width'));
		//remove the element
		fakeMasonryElement.remove();
		if(!widthPercentage) return 0;
		return Math.round(100 / widthPercentage);
	},
	preview_image_click: function() {
		var self = this;
		app.trigger('overlay:show_subscription_payment_settings', self.model.toJSON());
	},
	render: function() {
		var self = this;
		var binding = {
			el			: this.el,
			model		: this.model,
			template	: this.template
		};
		var view = new Binding(binding);
		this.subviews.push(view);
		this.editable_setup();
		this.model.intentions.fetch();
		return this;
	}
});
