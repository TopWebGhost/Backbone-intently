app.views.curate = Backbone.View.extend({
    initialize: function (opts) {
        var self = this;
        self.subviews						= [];
        self.opts							= opts;
        if (opts.template) self.template 	= opts.template;
        self.old_term                       = null,
        self.masonry_container              = '.curate-images';
        self.masonry_item                   = '.card-intention';
        self.init();
        return self;
    },
    init: function() {
        var self = this;
        self.stopListening();
        //get the channel info
        if(self.opts.router.params.length === 0) {
            //channel not defined, abort
            app.config.navigate_back();
        }
        self.model = app.collection.get_where_nx({ authorName: app.user.get('username'), name: self.opts.router.params[0] });
        self.model.intentions.fetch();
        //initialize the intention collection
        self.intention_collection = new app.collections.cluster(); // bypass collection cache
        self.listenTo(self.intention_collection,        'all',          self.render_search);
        self.listenTo(self.intention_collection,        'status',       this.render_status);
        this.listenTo(app,                              'scroll',       this.detect_autoload);
        //render
        self.render();
    },
    events: {
		'keyup			.intention-search':                 'intention_search',
		'click			.intention-add':                    'add_intention',
		'click			.intention-remove':                 'remove_intention',
		'click			.search-clear':                     'clear_search',
        'click          .card-intention-curate-overlay':    'add_intention'
    },
    update_sidebar: function() {
        var self = this;
        if (app.user.owned.get(self.model)) {
            app.user.owned.fetch();
        }
        if (app.user.subscribed.get(self.model)) {
            app.user.subscribed.fetch();
        }
    },
    render_status: function(e) {
        //unfetched / fetching / fetch / fetched
        var status = this.intention_collection.status;
        this.$('.unfetched, .fetching, .fetch, .fetched').addClass('hidden');
        this.$('.' + status).removeClass('hidden');
    },
    detect_autoload: function () {
        var status = this.intention_collection.status;
        if(status == 'fetch') {
            if($(window).height() + $('#base-container').scrollTop() >= $('#wrapper').height()) {
                this.intention_collection.load_more();
            }
        }
    },
	intention_search: function (e) {
        var self = this;
        if(e.keyCode == 13) {
            //search on enter
            self.reset_intention_collection();
        }
	},
    clear_search: function (e) {
        var self = this;
        self.$('.intention-search').val('');
        self.reset_intention_collection();
    },
    reset_intention_collection: function() {

        var self = this;
        //if search term has been updated
        var term = self.$('.intention-search').val().trim();
        if(term != self.old_term) {
            if(term != '') {
                //search for the term
                self.intention_collection.category = 'intention';
                self.intention_collection.type = 'available';
                self.intention_collection.term = term;
                self.intention_collection.index_step = 50;
            }
            else {
                //no search term, get the most popular
                self.intention_collection.category = 'intention';
                self.intention_collection.type = 'available';
                self.intention_collection.term = '';
                self.intention_collection.index_step = 50;
            }
            self.intention_collection.fetch();
            self.old_term = term;
        }

    },
	add_intention: function (e) {

        var self = this;
		var $el = $(e.target).parents(self.masonry_item);
		var intention_id = $el.attr('data-intention-id');
		var intention_model = self.intention_collection.get(intention_id);

        //show image as being added
        $el.find('.card-intention-curate-overlay').addClass('hidden');
        $el.find('.card-intention-curating-overlay').removeClass('hidden');

        //callback
        var cb = function (err, resp) {
            //no longer adding
            $el.find('.card-intention-curating-overlay').addClass('hidden');
            if(resp.success) {
                //added
                $el.find('.card-intention-curated-overlay').removeClass('hidden');
                self.model.set('numResources', parseInt(self.model.get('numResources')) + 1);
            }
            else {
                //reset to add-able
                $el.find('.card-intention-curate-overlay').removeClass('hidden');
            }
        };
        self.model.add_intention(intention_model.get('_id'), cb);
	},
    render_search: function (action, model) {
        var self		= this;
        var tmp			= _.template($('.intentioncard-tmp').html());
        if(action == 'status' || action == 'fetched') return false;

        //init masonry grid
        if(!self.$grid || self.$grid.length == 0) {
            self.$grid = self.$(self.masonry_container).masonry({ itemSelector: self.masonry_item, transitionDuration: '0.5s' });
        }

        if (action == 'reset') {
            var elems = self.$grid.masonry('getItemElements');
            self.$grid.masonry('remove', elems);
            self.$('.add-all').addClass("hidden");
            self.$('.loading-search').removeClass("hidden");
        } else if (action == 'remove') {
            var elem = self.$('.intention-' + model.id.replace(/intention\./gi, ''));
            self.$grid.masonry('remove', elem);
        } else if (action == 'add') {
            //check that intention does not already belong to the vision board
            if(self.model.intentions.get(model.get('id'))) return;
            
            //the intention cards are in curate mode for easy-adding
            model.set('_curate_mode', true);
            model.set('src', app.config.get_base_cdn() + 'cover/' + model.get('cdnFileName'));

            //create the card and bind it
            var $newelem = new app.views.intentioncard({
                model       : model,
                template    : $('.intentioncard-tmp').html()
            });
            var binding = {
                el          : $newelem.$el,
                model       : model,
                template    : $('.intentioncard-tmp').html()
            };
            var view = new Binding(binding);
            self.subviews.push(view);
            //add to the grid
            self.$grid.append(view.$el).masonry('appended', view.$el);

        }

        if(self.$grid) self.$grid.imagesLoaded('progress', function() { if (self.$grid) self.$grid.masonry('layout'); });
    },
    render: function () {
        var self = this;
        var binding = {
            el			: self.el,
            model		: self.model,
            template	: self.template
        };
        var view = new Binding(binding);
        self.subviews.push(view);
        self.reset_intention_collection();
        return self;
    }
});
