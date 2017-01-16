app.views.maia = Backbone.View.extend({
    initialize: function (opts) {
        var self = this;
        self.opts = opts;
        self.el = opts.el;
        //callback for populating topics
        var populate_topics = function(err, resp) {
            if(resp && resp.data) {
                self.topics = resp.data;
                //append the topic buttons
                var topicHtml = '';
                for(var lcv = 0; lcv < self.topics.length; lcv++) {
                    topicHtml += '<div class="btn btn-success maia-btn maia-btn-topic" typeformID="' + self.topics[lcv].id + '" isPremium="' + self.topics[lcv].isPremium + '">' + self.topics[lcv].name + '</div>';
                }
                $(self.el).find('.topics-container').html(topicHtml);
            }
        };
        //retrieve the available topics
        app.plugins.fetch({
            endpoint: 'aibuilders/available',
            _type: 'GET'
        }, populate_topics);
        self.template = _.template(opts.template);
        self.render();
        return self;
    },
    events: {
        'click          .maia-btn-start'           : 'show_step_2',
        'click          .maia-btn-topic'           : 'show_step_3'
    },
    show_step_1: function(event) {
        var self = this;
        //show step
        $(self.el).find('.maia-step-1').removeClass('hidden');
        $(self.el).find('.maia-step-2').addClass('hidden');
        $(self.el).find('.maia-step-3').addClass('hidden');
        $(self.el).find('.maia-step-4').addClass('hidden');
    },
    show_step_2: function(event) {
        var self = this;
        //show step
        $(self.el).find('.maia-step-1').addClass('hidden');
        $(self.el).find('.maia-step-2').removeClass('hidden');
        $(self.el).find('.maia-step-3').addClass('hidden');
        $(self.el).find('.maia-step-4').addClass('hidden');
    },
    show_step_3: function(event) {
        var self = this;
        //populate the typeform iframe
        self.typeformID = event.target.getAttribute('typeformID');
        self.isPremium = event.target.getAttribute('isPremium');
        self.populate_typeform();
        //show step
        $(self.el).find('.maia-step-1').addClass('hidden');
        $(self.el).find('.maia-step-2').addClass('hidden');
        $(self.el).find('.maia-step-3').removeClass('hidden');
        $(self.el).find('.maia-step-4').addClass('hidden');
    },
    show_step_4: function(event) {
        var self = this;
        //callback for populating images
        var handle_result = function(err, resp) {
            if(resp && resp.data) {
                if(!resp || !resp.success) {
                    //show error
                    $(self.el).find('.maia-thinking').html('It\'s taking me longer than I thought to curate your board. Check back in a few minutes.');
                }
                else if(resp.data.url) {
                    //they have access to the channel, go to it
                    app.router.navigate('#/' + resp.data.url.replace(app.config.get_base_url(), ''), true);
                }
                else {
                    //showing preview
                    self.preview_images = resp.data;
                    $(self.el).find('.maia-thinking').addClass('hidden');
                    //init masonry
                    self.$('.maia-preview-grid').empty();
                    self.$grid = self.$('.maia-preview-grid').masonry({ 
                        itemSelector: '.card-image', 
                        transitionDuration: '0.5s' 
                    });
                    //go through each preview
                    for(var lcv = 0; lcv < self.preview_images.length; lcv++) {
                        var model = new Backbone.Model({
                            src: app.config.get_base_cdn() + 'cover/' + self.preview_images[lcv].cdnFileName
                        });
                        //create the card and bind it
                        var $newelem = new app.views.imagecard({
                            model       : model,
                            template    : $('.imagecard-tmp').html()
                        });
                        var binding = {
                            el          : $newelem.$el,
                            model       : model,
                            template    : $('.imagecard-tmp').html()
                        };
                        var view = new Binding(binding);
                        self.subviews.push(view);
                        view.$el.find('.card-image').addClass('maia-preview-img');
                        //add to the grid
                        self.$grid.append(view.$el).masonry('appended', view.$el);
                    }
                    //redo the layout for each image load
                    if(self.$grid) self.$grid.imagesLoaded('progress', function(imageLoadEvent) {
                        if(self.$grid) {
                            self.$grid.masonry('layout');
                        }
                    });
                }
            }
        };
        app.plugins.fetch({
            endpoint: 'aibuilders/latestresult/' + self.typeformID,
            _type: 'GET'
        }, handle_result);
        //show thinking
        $(self.el).find('.maia-thinking').html('Hang tight ' + app.user.get('firstName') + ', I\'m curating images and creating your vision board now :)');
        $(self.el).find('.maia-thinking').removeClass('hidden');
        //show step
        $(self.el).find('.maia-step-1').addClass('hidden');
        $(self.el).find('.maia-step-2').addClass('hidden');
        $(self.el).find('.maia-step-3').addClass('hidden');
        $(self.el).find('.maia-step-4').removeClass('hidden');
    },
    populate_typeform: function() {
        var self = this;
        //define the iframe
        var iframe = document.createElement('iframe');
        iframe.setAttribute('src', app.config.get_base_api() + 'aibuilders/begintypeform/' + self.typeformID);
        $(self.el).find('.maia-iframe-target').empty();
        $(self.el).find('.maia-iframe-target').append(iframe);
        $(window).one('message', function(event) {     
            if(event.originalEvent.data == "form-submit") {      
                //go to payment       
                self.show_step_4(event);      
            }     
        });
    },
    render: function () {
        var self = this;
        $(self.el).html(self.template({
            user: app.user.toJSON()
        }));
        self.show_step_1();
        return self;
    }
});