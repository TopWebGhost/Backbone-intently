app.views.overlay = Backbone.View.extend({
    is_taginput_created: false,
    initialize: function () {
        this.close();
        this.share_import = false;
        return this;
    },
    events: {
        'click      .close'                             : 'close',
        'click      .overlay-bg'                        : 'close',
        'click      .btn-close'                         : 'close',
        'click      .add-vb'                            : 'add_intention_to_vb',
        'click      .share-intention'                   : 'share_intention',
        'click      .intention-remove'                  : 'confirmed_delete_intention',
    	'click		.send-invite'		                : 'invite_user',
        'click      .add-meme'                          : 'add_meme',
        'click      #pr_yes'                            : 'private_yes',
        'click      #pr_no'                             : 'private_no',
        'click      #cancelVB'                          : 'close',
        'click      #createVB'                          : 'create_new_vb',
        'click      #saveVB'                            : 'save_vb',
        'click      #removeVB'                          : 'show_Remove_Confirm',
        'click 		.remove-cancel'					    : 'cancel_remove',
        'click 		.remove-confirm'				    : 'confirm_remove'

    },
    close: function () {

        this.stopListening();

        //overlays
        this.listenTo(app,      'overlay:show_full_modal',                      this.show_full_modal);
        this.listenTo(app,      'overlay:handle_payment_request',               this.handle_payment_request);
        this.listenTo(app,      'overlay:show_subscription_payment_settings',   this.show_subscription_payment_settings);
        this.listenTo(app,      'overlay:close_full_modal',                     this.close_full_modal);
        this.listenTo(app,      'overlay:review_intention',                     this.review_intention);
        this.listenTo(app,      'overlay:add_meme_to_vb',                       this.add_meme_to_vb);
        this.listenTo(app,      'overlay:show_vb_settings',                     this.show_vb_settings);
        this.listenTo(app,      'overlay:review_intention_share',               this.review_intention_share);
        this.listenTo(app,      'overlay:share_intention',                      this.show_intention_share_dialog);
        this.listenTo(app,      'overlay:share_intention_to_facebook',          this.share_intention_to_facebook);
        this.listenTo(app,      'overlay:confirm_intention_delete',             this.remove_intention_from_vb);

        $('#overlay').modal('hide');
        $('.custom-modal-backdrop').hide();

    },
    active_render: function () {
      if (this.active) this.active();
    },
    show: function () {
        var self = this;
        $('#overlay').removeClass('form-overlay');
        $('#overlay').modal('show');
        $('#overlay').on('hidden.bs.modal', function (e) {
            self.close();
        });
        $('.custom-modal-backdrop').show();
    },
    show_full_modal: function(opts) {
        var self = this;
        app.plugins.fullmodal.show(opts);
    },
    close_full_modal: function() {
        $('body > #full-modal-wrapper').remove();
    },
    form_show: function () {
        var self = this;
        $('#overlay').addClass('form-overlay');
        $('#overlay').modal('show');
        $('#overlay').on('hidden.bs.modal', function (e) {
            self.close();
        });
        $('.custom-modal-backdrop').show();
    },
    add_intention_to_vb: function(e) {
        var self = this;
        var boardID = $(e.currentTarget).data().visionboard;
        var visionboard = app.collection.get('visionboard.' + boardID);
        if(self.share_import) {
            visionboard.accept_intention_share(self.intention_share_id);
            $('.add-vb-' + boardID).removeClass("add-vb").removeClass("clickable").addClass("half-opacity");
        }
        else {
            visionboard.add_intention(self.intention.get('_id'));
            $('.add-vb-' + boardID).removeClass("add-vb").removeClass("clickable").addClass("half-opacity");
        }
    },
    add_meme: function (e) {
        //display loading portion
        $('.thirdStep').addClass('hidden');
        $('.loadingStep').removeClass('hidden');
        var channelID = $(e.currentTarget).data().visionboard;
        var resultData = this.intention.src.split('base64,')[1]; //do not need the leading metadata
        $.ajax({
            url: app.config.get_base_api() + 'imagecreationtool/upload/' + channelID,
            method: "POST",
            data: {
                imageString: resultData
            },
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                if(response && response.success) {
                    //update remaining creation count
                    if(response.data && response.data.availableImageCreations >= 0) {
                        app.config.data.AVAILABLE_IMAGE_CREATIONS = response.data.availableImageCreations;
                    }
                    //notify user
                    if(response.message) app.trigger('success', response.message);
                    else app.trigger('success', 'Successfully created image and added to vision board!');
                }
                else {
                    //reset to third step
                    $('.loadingStep').addClass('hidden');
                    $('.thirdStep').removeClass('hidden');
                }
            }
        });
        app.trigger('success', 'Your custom image is being created. Depending on your internet connection, this could take up to 15 seconds - we will notify you when creation is complete.');
        this.close();
    },
    like_intention: function(intention_id) {
        var intention = app.collection.get(intention_id);
        intention.like();
    },
    dislike_intention: function(intention_id) {
        var intention = app.collection.get(intention_id);
        intention.dislike();
    },
    share_intention: function (e) {
        var userID = $(e.currentTarget).data().member;
        var user = app.collection.get(userID);
        var msg = 'Successfully shared this intention with @' + user.get('username');
        this.intention.share_intention(user.get('_id'), msg);
        // don't allow to send again
         $('.share-intention-' + user.get('_id')).removeClass("share-intention").removeClass("clickable").addClass("half-opacity");
    },
    confirmed_delete_intention: function(e) {
        var intentionID = $(e.currentTarget).data().intention;
        this.close();
        app.trigger('intention:confirmed_delete', intentionID);
    },
    show_intention_share_dialog: function(intention_id) {
        app.plugins.shareDialog.showDialog(app.collection.get(intention_id));
    },
    review_intention: function(intention_id) {
        this.share_import = false;
        this.isIntention = true;
        this._setup_show(intention_id, '_review_intention');
    },
    add_meme_to_vb: function(srcImg) {
        this.share_import = false;
        this.isIntention = false;
        var active = '_add_meme_to_vb';
        this.srcImg = srcImg;
        this.active = this[active];
        this.active_render();
    },
    share_intention_to_facebook: function(intention_id) {
        this.intention = app.collection.get(intention_id);
        var leftPosition, topPosition, width = 600, height = 600;
        leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
        topPosition = (window.screen.height / 2) - ((height / 2) + 50);
        var windowFeatures = "status=no,height=" + height + ",width=" + width + ",resizable=yes,left=" + leftPosition + ",top=" + topPosition + ",screenX=" + leftPosition + ",screenY=" + topPosition + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no";
        window.open(app.config.get_base_api() + "channelresources/sharetofb/" + this.intention.get('_id'),'sharer', windowFeatures);
    },
    review_intention_share: function(params) {
        var self = this;
        //this is configured as a partial modal
        if(params.length === 0) {
            return app.router.navigate('$/404');
        }
        self.intention_share_id = params[0];
        self.share_import = true;
        self.ext_import = false;
        //get the share info
        app.plugins.fetch({ endpoint: 'connections/channelresourceshares/' + self.intention_share_id, _type: 'GET' }, function(err, resp) {
            if(resp && resp.success) {
                var model = new app.models.intention(resp.data[0]);
                //add to collection if not already there
                if(!app.collection.get('intention.' + model.get('id'))) {
                    model.set('_id', model.get('id'));
                    model.set('id', 'intention.' + model.get('_id'));
                    app.collection.add(model);
                }
                else {
                    model = app.collection.get('intention.' + model.get('id'));
                }
                self._setup_show(model.get('id'), '_review_intention');
            }
        });
    },
    remove_intention_from_vb: function(intention_id) {
        this._setup_show(intention_id, '_delete_intention');
    },
    _setup_show: function(intention_id, active) {
        this.intention_id   = intention_id;
        this.intention      = app.collection.get(this.intention_id);
        this.active         = this[active];
        this.active_render();
        this.listenTo(this.intention,		'all',				this.active_render);
    },
    _share_intention: function() {
        var tmp = _.template($('.share-intention-overlay-tmp').html());
        var obj = {
            intention       : this.intention.toJSON(),
            members         : app.user.connections.toJSON()
        };
        $('.overlay-title').html('Share Image');
        $('.overlay-view').html(tmp(obj));
        // include all connected users
        $('.share-intention-user-list').html('');
        var itemTmp;
        if(app.user.connections.size() > 0) {
            itemTmp = _.template($('.share-intention-user-list-item-tmp').html());
            _.each(app.user.connections.models, function(user) {
              var $itemHtml = $(itemTmp(user.toJSON()));
              $('.share-intention-user-list').append($itemHtml);
            });
        } 
        else {
          itemTmp = _.template($('.share-intention-user-list-empty-tmp').html());
          $('.share-intention-user-list').append(itemTmp());
        }
        this.show();
    },
    _review_intention: function() {
        var self = this;
        var tmp = _.template($('.add-intention-vb-overlay-tmp').html());
        var obj = {
            intention       : this.intention.toJSON()
        };
        var html = tmp(obj);

        $('.overlay-title').html('Add Image to Vision Board');
        $('.overlay-view').html(html);

				this._render_vb_list();

        this.show();
    },
    _add_meme_to_vb: function() {
        var self = this;
        var meme = {
            src:this.srcImg,
            id:"intention.meme"
        };
        this.intention = meme;
        var tmp = _.template($('.add-intention-vb-overlay-tmp').html());
        var obj = {
            intention       : meme
        };
        var html = tmp({ obj: obj });

        $('.overlay-title').html('Add Image to Vision Board');
        $('.overlay-view').html(html);

        this._render_vb_list();

        this.show();
    },
	_render_vb_list: function() {
        var self = this;

      // only include vb's that don't already have this intention
      var itemTmp;
      $('.add-intention-vb-list').html('');
      if (app.user.owned.size() > 0) {
        itemTmp = _.template($('.add-intention-vb-list-item-tmp').html());
        _.each(app.user.owned.models, function(vb) {
            var $itemHtml = $(itemTmp(vb.toJSON()));
            if(self.intention.id == "intention.meme") {
                $itemHtml.removeClass("add-vb").addClass("add-meme");
            }
            else{
                if (vb.intentions.get(self.intention.id)) {
                    $itemHtml.removeClass("add-vb").removeClass("clickable").addClass("half-opacity");
                }
            }

            $('.add-intention-vb-list').append($itemHtml);
        });
      } else {
        itemTmp = _.template($('.add-intention-vb-list-empty-tmp').html());
        $('.add-intention-vb-list').append(itemTmp());
      }
	},
    handle_payment_request: function(apiResponse, xhr) {
        var self = this;
        self.display_payment_page({
            message: apiResponse.message,
            subscriptionPlans: apiResponse.paymentRequest.subscriptionPlans,
            channel: apiResponse.paymentRequest.channel,
            failedXHR: xhr
        });
    },
    show_subscription_payment_settings: function(channel) {
        var self = this;
        var promo = ''; //no promos for now
        app.plugins.fetch({endpoint: 'subscriptionplans/available' + promo, _type: 'GET'}, function(err, resp) {
            if(resp && resp.success) {
                var options = {
                    subscriptionPlans: resp.data
                };
                //append channel, if provided
                if(channel) options.channel = channel;
                self.display_payment_page(options);
            }
        });
    },
    display_payment_page: function(options) {
        /*  
            OPTIONS
                message (optional) - a custom message to display at the top of the page
                subscriptionPlans - an array of subscriptionPlan objects
                channel - a channel object
            NOTE: either subscriptionPlans or channel must be defined
            NOTE: i'll admit this is a little messy, but just trying to get this out the door for now...
        */

        var self = this;
        var details = {};

        //reset the state
        self.paymentMethodRequired = false;
        self.channelPurchaseChosen = false;
        self.submitDeactivated = false;

        //stripe key
        Stripe.setPublishableKey(app.config.data.STRIPE_API_PUBLIC_KEY);

        //show in full modal
        //TODO: make this a proper view
        var tmp = $(".payment-tmp").html();
        self.el = app.plugins.fullmodal.show({
            template: tmp, 
            navigate_back_on_close: false,
            modalOpts: {
                show_close_button: true,
                show_intently_logo: true
            }
        });
        self.el.find('.modal-button-cancel').click(function() { self.el.remove(); });

        /*
            STATE
                upgradesubscription
                cancelsubscription
                changepayment
            NOTE: the initial state depends on whether the user has an active subscription
        */
        self.state = '';
        var enterState = function(state) {
            if(state == 'upgradesubscription') {
                //hide upgrade and cancel options
                self.el.find('.upgrade-subscription-plan').addClass('hidden');
                self.el.find('.cancel-subscription-plan').addClass('hidden');
                //show the subscription plans
                self.el.find('.subscription-plans').removeClass('hidden');
                //be clear that the user is upgrading
                self.el.find(".modal-button-submit .va-text").html('Upgrade');
                self.el.find(".modal-button-submit").removeClass('hidden');
            }
            else if(state == 'cancelsubscription') {
                //hide upgrade and cancel options and the active payment method
                self.el.find('.upgrade-subscription-plan').addClass('hidden');
                self.el.find('.cancel-subscription-plan').addClass('hidden');
                self.el.find('.active-payment-method').addClass('hidden');
                self.el.find('.new-payment-method').addClass('hidden');
                //show confirmation text
                self.el.find('.unsubscribe-confirmation-message').removeClass('hidden');
                //be clear that the user is cancelling
                self.el.find(".modal-button-submit").addClass('bg-red');
                self.el.find(".modal-button-process").addClass('bg-red');
                self.el.find(".modal-button-submit").removeClass('bg-green');
                self.el.find(".modal-button-process").removeClass('bg-green');
                self.el.find(".modal-button-submit").removeClass('hidden');
                self.el.find(".modal-button-submit .va-text").html('Unsubscribe');
            }
            else if(state == 'changepayment') {
                //show the new payment method inputs
                self.el.find('.active-payment-method').addClass('hidden');
                self.el.find('.new-payment-method').removeClass('hidden');
                self.paymentMethodRequired = true;
                //do not override the 'upgrade' text
                if(self.el.find(".modal-button-submit .va-text").html() != 'Upgrade') {
                    self.el.find(".modal-button-submit .va-text").html('Submit');
                }
                self.el.find(".modal-button-submit").removeClass('hidden');
            }
            self.state = state;
        };

        //display the message
        if(options.message) {
            //self.el.find('.payment-message').html(options.message).removeClass('hidden');
        }

        //display subscription plans
        if(options.subscriptionPlans) {
            //display the subscription plans
            var first = true;
            _.each(options.subscriptionPlans, function(plan) {
                //except for the 'none' subscription
                if(plan.id !== '1') {
                    self.el.find('.subscription-plans').append(
                        '<div data-value="' + plan.id +'" class="br2 h100px bg-green subscription-plan-item pl1 pr1' + ((!first) ? ' hidden' : '') + '">' +
                            '<div class="left">' +
                                '<div class="fs24 white mt2">' + plan.name + '</div>' +
                                '<div class="lh100">' +
                                    '<span class="lh100 fs36 white">$' + plan.amount + '</span><span class="white fs20 va-top">/' + ((plan.intervalCount !== '1') ? plan.intervalCount + ' ' : '') + plan.intervalType + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<div class="pull-right payment-dropdown white as-c mla">' +
                                '<i class="fa fa-chevron-down fs24 va-text nmt5px"></i>' +
                            '</div>' +
                        '</div>'
                    );
                    //only show the first plan initially
                    first = false;
                }
            });
            //toggle the plan list on click
            self.el.find('.subscription-plan-item').click(function(event) {
                var el = $(this);
                el.siblings().toggleClass('hidden');
                if(el.siblings().length > 0) {
                    self.el.find('.modal-button-submit').toggleClass('hidden');
                }
            });
            //show subscriptions if channel purchase is not present
            if(!options.channel || !options.channel.id) {
                self.el.find('.intently-pro-subscription').removeClass('hidden');
            }
        }

        //display premium channel purchase
        if(options.channel && options.channel.id) {
            self.channelPurchaseChosen = true;
            self.el.find('.intently-channel-purchase').append(
                '<div data-value="' + options.channel.id +'" class="br2 h100px bg-green subscription-plan-item pl1 pr1">' +
                    '<div class="left">' +
                        '<div class="fs24 white mt2">' + options.channel.name + '</div>' +
                        '<div class="lh100">' +
                            '<span class="lh100 fs36 white">$' + options.channel.amount + '</span><span class="white fs20 va-top">/lifetime</span>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );
            if(options.subscriptionPlans) {
                //show upsell and set up toggle for subscription
                self.el.find('.intently-pro-upsell').removeClass('hidden');
                self.el.find('.intently-pro-upsell-subscribe').click(function (event) {
                    //switch from premium channel to pro subscription
                    self.channelPurchaseChosen = false;
                    self.el.find('.intently-pro-upsell').addClass('hidden');
                    self.el.find('.intently-channel-purchase').addClass('hidden');
                    self.el.find('.intently-pro-subscription').removeClass('hidden');
                });
            }
            self.el.find('.intently-channel-purchase').removeClass('hidden');
        }

        //get the current subscription
        app.plugins.fetch({ endpoint: 'subscriptionplans/active', _type: "GET" }, function(err,resp) {
            if(resp && resp.success) {
                //display unless it is the 'none' subscription
                if(resp.data && resp.data.id !== '1') {
                    var currentSubscription = 'Current Subscription: ' + resp.data.name + ' ($' + resp.data.amount + ' / ' + ((resp.data.intervalCount !== '1') ? resp.data.intervalCount + ' ' : '') + resp.data.intervalType + ')';
                    //add additional information about trial period and inactive accounts
                    if(resp.data.subscriptionPlanActive == '0') {
                        currentSubscription += '<br/><div class="red">Your subscription is inactive: ' + resp.data.subscriptionPlanInactiveNotes + '</div>';
                    }
                    else if(resp.data.trial_end) {
                        currentSubscription += '<br/><div>Your free trial ends ' + resp.data.trial_end + '</div>';
                    }
                    else if(options.subscriptionPlans.length > 0) {
                        currentSubscription += '<div class="upgrade-subscription-plan green clickable">Upgrade your plan</div>';
                    }
                    //show cancel option unless subscription is inactive
                    if(resp.data.subscriptionPlanActive == '1') {
                        currentSubscription += '<div class="cancel-subscription-plan red clickable">Unsubscribe from Intently PRO</div>';
                    }
                    //show the current subscription and hide the upgrade options
                    self.el.find('.current-subscription-plan').html(currentSubscription).removeClass('hidden');
                    self.el.find('.subscription-plans').addClass('hidden');
                    //cannot submit in this state (must request changes first)
                    //TODO: this works under the assumption that a user will never have payment info defined if they do not have an active plan
                    self.el.find(".modal-button-submit").addClass('hidden');
                    //show the upgrade options on click
                    self.el.find('.upgrade-subscription-plan').click(function(event) {
                        enterState('upgradesubscription');
                    });
                    //cancel the plan?!
                    self.el.find('.cancel-subscription-plan').click(function(event) {
                        enterState('cancelsubscription');
                    });
                }
            }
        });

        //get the current payment method
        app.plugins.fetch({ endpoint: 'account/paymentinfo', _type: "GET" }, function(err,resp) {
            if(resp && resp.success) {
                if(resp.data && resp.data.length > 0) {
                    //display current payment method
                    var activePaymentMethod = 'Current Payment Method: ' + resp.data[0].brand + '-' + resp.data[0].last4 + ' (expires ' + resp.data[0].expires + ')';
                    activePaymentMethod += '<br /><span class="change-payment-method clickable green left">Change payment method</span>';
                    self.el.find('.active-payment-method-info').html(activePaymentMethod);
                    self.el.find('.active-payment-method').removeClass('hidden');
                    //give option to change payment
                    self.el.find('.change-payment-method').click(function(event) {
                        enterState('changepayment');
                    });
                }
                else {
                    //no payment method defined, must add new
                    self.el.find('.new-payment-method').removeClass('hidden');
                    self.paymentMethodRequired = true;
                }
            }
        });

        //validate card number
        self.el.find(".card-input").blur(function(event) {
            var el = $(event.target);
            el.parent().removeClass("input-focus").addClass("input-border");
            if(app.config.validate_form_data(el, app.config.validation.creditcardnumber)) {
                details.number = el.val();
            }
            else {
                details.number = null;
            }
        }).focus(function(event) {
            //reset validation
            self.el.find(event.target).parent().addClass("input-focus").removeClass("input-border");
        });

        //validate expiry
        self.el.find(".date-input").blur(function(event) {
            var el = $(event.target);
            el.parent().removeClass("input-focus").addClass("input-border");
            var month, year;
            var split = el.val().split("/");
            if(split.length > 1) {
                month = split[0];
                year = split[1];
            }
            if(app.config.validate_form_data(el, app.config.validation.creditcardexpiry)) {
                details.exp_month = month;
                details.exp_year = year;
            }
            else {
                details.exp_month = null;
                details.exp_year = null;
            }
        }).focus(function(event) {
            //reset validation
            self.el.find(event.target).parent().addClass("input-focus").removeClass("input-border");
        });

        //validate cvc
        self.el.find(".cvc-input").blur(function(event) {
            var el = $(event.target);
            el.parent().removeClass("input-focus").addClass("input-border");
            if(app.config.validate_form_data(el, app.config.validation.creditcardcvc)) {
                details.cvc = el.val();
            }
            else{
                details.cvc = null;
            }
        }).focus(function(event) {
            //reset validation
            $(event.target).parent().addClass("input-focus").removeClass("input-border");
        });

        //name validation
        self.el.find(".name-input").blur(function(event) {
            var el = $(event.target);
            el.parent().removeClass("input-focus").addClass("input-border");
            if(app.config.validate_form_data(el, app.config.validation.nonempty)) {
                details.name = el.val();
            }
            else {
                details.name = null;
            }
        }).focus(function(event) {
            //reset validation
            $(event.target).parent().addClass("input-focus").removeClass("input-border");
        });

        //upon user submit
        self.el.find(".modal-button-submit").click(function(event) {
            //hide the state buttons
            self.el.find('.upgrade-subscription-plan').addClass('hidden');
            self.el.find('.cancel-subscription-plan').addClass('hidden');
            self.el.find('.change-payment-method').addClass('hidden');
            //show processing
            $(this).addClass("hidden");
            self.el.find(".modal-button-process").removeClass("hidden");
            //function to hit the api after validation and retrival of stripe token
            var makePurchase = function(stripeToken) {
                //this is called after the api is hit
                var apiCallback = function(resp) {
                    //reset
                    self.el.find('.modal-button-process').addClass("hidden");
                    self.el.find('.modal-button-submit').removeClass("hidden");
                    //check for success
                    if(resp && resp.success) {
                        //check for a failed xhr
                        if(options.failedXHR) {
                            //reload the page on success
                            options.failedXHR.success = function(resp) {
                                //TODO: perhaps instead of this, reload the user config and refresh the current view
                                window.location.reload();
                            }
                            //retry the failed xhr
                            $.ajax(options.failedXHR);
                        }
                        else {
                            //just reload
                            window.location.reload();
                        }
                        //close the modal
                        self.el.remove();
                    }
                };
                //user has chosen to use current payment method
                if(self.channelPurchaseChosen) {
                    //there should be a failed subscription request
                    if(options.failedXHR) {
                        //add the token or the decision to use the active payment method
                        if(stripeToken)
                            options.failedXHR.data.stripeToken = stripeToken;
                        else
                            options.failedXHR.data.useActivePaymentMethod = '1';
                        //simulate a successful api call
                        apiCallback({ success: true });
                    }
                    else {
                        //nothing more to do, close the modal
                        self.el.remove();
                    }
                }
                else if(self.state == 'cancelsubscription') {
                    //they are canceling :(
                    app.user.setSubscription(
                        1,
                        null,
                        apiCallback
                    );
                }
                else if(self.el.find('.subscription-plans').hasClass('hidden')) {
                    //only updating payment method
                    app.user.update_paymentinfo(stripeToken, apiCallback);
                }
                else {
                    //set the subscription
                    app.user.setSubscription(
                        self.el.find('.subscription-plans .subscription-plan-item:not(.hidden)').data('value'),
                        stripeToken,
                        apiCallback
                    );
                }
            };
            //see if new payment method is required
            if(self.paymentMethodRequired) {
                //ensure all values are good
                if(details.numbers, details.name, details.exp_month, details.exp_year, details.cvc) {
                    Stripe.createToken(details, function(status, response) {
                        if(response.error) {
                            //show errors and reset input
                            self.el.find('.modal-button-process').addClass("hidden");
                            self.el.find('.modal-button-submit').removeClass("hidden");
                        }
                        else {
                            //stripe success
                            makePurchase(response.id);
                        }
                    });
                }
                else {
                    //reset
                    self.el.find('.modal-button-process').addClass("hidden");
                    self.el.find('.modal-button-submit').removeClass("hidden");
                }
            }
            else {
                //using the current payment method
                makePurchase();
            }
        });

    },
    _delete_intention: function () {
        var tmp = _.template($('.delete-intention-overlay-tmp').html());
        var obj = {
            intention       : this.intention.toJSON()
        };
        $('.overlay-title').html('Confirm Remove');
        $('.overlay-view').html(tmp(obj));
        this.show();
    },
  	invite_user: function () {
  		var self		= this;
  		var form_data	= app.plugins.form.get('#overlay .invites-form');
        if (!form_data) return;

  		if (!form_data.email.match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/))
  			return app.trigger('error', 'Invalid email to invite "' + form_data.email + '"');

  		app.plugins.fetch({ endpoint: 'invites/emailinvite', _type: 'POST', emailAddresses: form_data.email }, function(err, resp) {
  			if(resp && resp.success) {
  				app.trigger('success', resp.message);
  			}
  		});
  	},
    show_vb_settings: function(model_id) {
        var self = this;
        $('.remove-confirm-message').addClass('hidden');
        $('.setting_form').removeClass('hidden');
        $('.overlay-title').removeClass('hidden');
        var vb_model = app.collection.get(model_id);
        if(vb_model) {
            //model exists, this is an edit
            self.vb_model = vb_model;
            self.is_taginput_created = false;
            self.edit_vb();
        }
        else {
            //model does not exist, this is a create
            self.add_new_vb();
        }
    },
    edit_vb: function() {
        var self = this;
        var tmp = _.template($('.setting-vb-overlay-tmp').html());
        $('.overlay-title').html('Edit Channel');
        $('.overlay-view').html(tmp);
        $('#removeVB').removeClass('hidden');
        $('#createVB').addClass('hidden');
        $('#saveVB').removeClass('hidden');
        $('#vbName').val(self.vb_model.get('name'));
        $('#vbDesc').val(self.vb_model.get('shortDescription'));
        if(self.vb_model.get('isPublic') == 1) {
            $('#pr_yes').removeClass('success').addClass('secondary');
            $('#pr_no').removeClass('secondary').addClass('success');
        } 
        else {
            $('#pr_yes').removeClass('secondary').addClass('success');
            $('#pr_no').removeClass('success').addClass('secondary');
        }
        var tags = self.vb_model.get('customTags');
        var tagsArray = [];
        var tagsContent = "";
        tagsArray = tags.split("|");
        for(var i = 0; i < tagsArray.length; i++){
            tagsContent += "<li>" + tagsArray[i] + "</li>";
        }
        if(this.is_taginput_created == true) {
            this.$("#removeConfirmationTags").tagit("destroy");
        }
        this.$("#removeConfirmationTags").html(tagsContent);
        $("#removeConfirmationTags").tagit({
            availableTags: [],
            removeConfirmation: true
        });
        this.is_taginput_created = true;
        $('#customTags').val(self.vb_model.get('customTags'));
        var sampleTags = ['fitness', 'beauty', 'business'];
        $("#removeConfirmationTags").tagit({
            availableTags: sampleTags,
            removeConfirmation: true
        });
        this.form_show();
    },
    add_new_vb: function() {
        var self = this;
        var tmp = _.template($('.setting-vb-overlay-tmp').html());
        $('.overlay-title').html('Create a Vision Board');
        $('.overlay-view').html(tmp);
        $('#removeVB').addClass('hidden');
        $('#createVB').removeClass('hidden');
        $('#saveVB').addClass('hidden');
        var sampleTags = ['fitness', 'beauty', 'business'];
        $("#removeConfirmationTags").tagit({
            availableTags: sampleTags,
            removeConfirmation: true
        });
        this.form_show();
    },
    private_yes: function() {
        $('#pr_yes').addClass('success');
        $('#pr_yes').removeClass('secondary');
        $('#pr_no').removeClass('success');
        $('#pr_no').addClass('secondary');
    },
    private_no: function() {
        $('#pr_yes').removeClass('success');
        $('#pr_yes').addClass('secondary');
        $('#pr_no').addClass('success');
        $('#pr_no').removeClass('secondary');
    },
    show_Remove_Confirm: function() {
        $('.remove-confirm-message').removeClass('hidden');
        $('.setting_form').addClass('hidden');
        $('.overlay-title').addClass('hidden');
    },
    cancel_remove: function(e) {
        $('.remove-confirm-message').addClass('hidden');
        $('.setting_form').removeClass('hidden');
        $('.overlay-title').removeClass('hidden');
    },
    confirm_remove: function(e) {
        var self = this;
        if(self.vb_model) {
            self.vb_model.remove();
        }
        this.close();
    },
    validateFormdata: function() {
        var self = this;
        var nameMatch = /^[a-zA-Z 0-9\'!._,%]{1,100}$/;
        var descMatch = /^[a-zA-Z 0-9]*/;
        var vbname = $('#vbName').val();
        var vbdesc = $('#vbDesc').val();

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
        var form_data = app.plugins.form.get('.setting-board-tmp');
        form_data.name = $('#vbName').val();
        form_data.description = $('#vbDesc').val();

        var customTags = "";
        var vbTags = $('.tagit-label');
        var tags = '';
        for(var i = 0; i < vbTags.length; i++) {

            var tag = vbTags[i].innerText;
            tag = tag.replace('#', '');
            tags += tag + "|";
        }
        tags = tags.substring(0,tags.length-1);
        if($("#pr_yes").hasClass("success"))
            form_data.isPublic = 0;
        else
            form_data.isPublic = 1;
        form_data.customTags = tags;
        form_data.shortDescription = form_data.description;
        return form_data;
    },
    save_vb: function () {
        var self = this;
        var form_data = this.getFormData();
        self.vb_model._update(form_data);
        self.close();
    },
    create_new_vb: function() {
        var self = this;
        var nameMatch = /^[a-zA-Z 0-9\'!._,%]{1,100}$/;
        var descMatch = /^[a-zA-Z 0-9]*/;
        var tagMatch = /^[a-zA-Z 0-9]/;
        var vbname = $('#vbName').val();
        var vbdesc = $('#vbDesc').val();
        var vbTags = $('.tagit-label');
        var tags = '';
        for(var i = 0; i < vbTags.length; i++) {
            var tag =  vbTags[i].innerText;
            tag = tag.replace('#', '');
            tags += tag + "|";
        }
        tags = tags.substring(0,tags.length-1);
        var isPublic = 0;
        if($('#pr_yes').hasClass('success'))
            isPublic = 0;
        else
            isPublic = 1;
        if(nameMatch.exec(vbname) == null) {
            app.trigger('error', 'Please provide your vision board a valid name.');
            return;
        }
        if(descMatch.exec(vbdesc) == null) {
            app.trigger('error', 'Please provide your vision board a valid description (alphanumeric characters only).');
            return;
        }
        $.ajax({
            url: app.config.get_base_api() + 'channels/create/' + encodeURIComponent(vbname),
            method: "POST",
            data: {
                shortDescription : vbdesc,
                customTags : tags,
                isPublic : isPublic
            },
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                self.close();
                app.user.owned.fetch();
                app.user.subscribed.fetch();
                app.router.navigate('#/@' + app.user.get('username') + '/' + encodeURIComponent(vbname), true);
            }
        });
    },
    render: function() {
        return this;
    }
});
