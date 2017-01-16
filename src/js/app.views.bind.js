/*  RESERVED
    template    : current html template
    reset       : reset the model
    foreach     : foreach loop. used with cluster right now
    cluster     : current cluster
    field       : current active model field
    value       : current input value
    replace     : replace html of template
    model       : current neuron
    publish     : click action
    console     : console.log everything with this item
    initValue   : initial value of a model property
    listeners   : properties to listen to for changes on model
    context     :
    scope       : create a new scoped model
    keyEnter    : on key enter
    parent      : parent model

    focus       : focus the input element,
    blur        : blur the input element

*/
var Binding = Backbone.View.extend({
    initialize: function (opts) {
        _.extend(this, opts);

        //this.hammer({ tap_always: false });

        this.subviews = [];
        this.setup_data();
        this.render();
    },
    hammerEvents: {
        'change'		: 'update_model',
        'keyup'			: 'keypress',
        'hold'          : 'hold',
        'tap'		    : 'tap',
        'doubletap'     : 'doubletap',
        'swipeleft'     : 'swipeleft',
        'swiperight'    : 'swiperight'
	},
    _call: function (ref, data) {
        var self = this;

        if (ref.indexOf('|') > -1)
            return _.each(ref.split('|'), function (ind) { self._call(ind, data); });

        var layers		= ref.split('.');
        var fn			= this;
        var fn2         = this;
        var l           = layers.length;

        _.each(layers, function(layer) {
            fn = fn[layer];
            if (--l > 0) fn2 = fn2[layer];
        });

        fn.call(fn2, data || this.model);
    },
    _animate: function (distance) {
        $(this.el)
			.css('transition', '-webkit-transform .2s ease-out')
			.css('transform', 'translate3d(' + distance + 'px, 0px, 0px)')
			.css('-webkit-transform', 'translate3d(' + distance + 'px, 0px, 0px)');
    },
    animateLeft: function () {
        this._animate(-100);
    },
    animateRight: function () {
        this._animate(0);
    },
    hold: function (e) {
        if (this.data.hold)          this._call(this.data.hold);
    },
    tap: function (e) {
        if (this.data.tap)          this._call(this.data.tap);
    },
    doubletap: function (e) {
        if (this.data.doubletap)    this._call(this.data.doubletap);
    },
    swipeleft: function () {
        if (this.data.swipeleft)    this._call(this.data.swipeleft);
    },
    swiperight: function () {
        if (this.data.swiperight)    this._call(this.data.swiperight);
    },
    back: function () {
        window.history.back();
    },
    forward: function () {
        window.history.forward();
    },
    href: function () {
        var href = this.get_value(this.data.href);
        app.router.navigate('#/' + JSON.stringify(href), true);
    },
    publish: function () {
        app.trigger(this.data.publish, this.data);
    },
    subscription: function (data) {
        this._call(this.data.action, data);
    },
    clear: function () {
        $(this.el).val('').html('');
    },
    focus: function () {
        $(this.el).focus();
    },
    blur: function () {
        $(this.el).blur();
    },
    date: function () {
        var self = this;

        if (window.cordova) {
            $(this.el)
                .focus(function () {    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);   })
                .blur(function () {     cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);    });
        } else {
            $(this.el)
                .datepicker(this.get_value(this.data.date))
                .on('changeDate', function (e) { self.update_model(); });
        }
    },
    keypress: function (e) {
        if (['INPUT', 'TEXTAREA'].indexOf($(this.el).prop('tagName')) == -1) return false;

        this.data.value         = $(e.currentTarget).val().replace(/(?:\r\n|\r|\n)/gi, '');

        var obj                 = {};
		obj[this.data.field]    = this.data.value;

        this.data.model.set(obj);

        var map = {
            13          : 'Enter',
            27          : 'Esc',
            32          : 'Space'
        };

        var $map        = map[e.keyCode];
        var $attr       = this.data['key' + $map];

        if ($map && $attr) {
            this._call($attr, this.data);
            $(this.el).val(this.data.value);
        }
	},
    toggle: function (e) {
		var opp = { 'true': 'false', 'false': 'true' };
        this.data.model.set(this.data.field, opp[this.data.model.get(this.data.field)]);
	},
    select: function () {
        this.data.model.set(this.data.field, this.data.value);
    },
    update_model: function (e) {
        var $tag = $(this.el).prop('tagName');
        if (['SELECT', 'INPUT'].indexOf($tag) == -1) return false;

        this.data.value = $(this.el).val();

        var obj = {};

        if (this.data.field)
            obj[this.data.field] = this.data.value;

        this.data.model.set(obj);

        this.on_update();
    },
    on_update: function () {
        if (this.data.onUpdate) this._call(this.data.onUpdate);
    },
    setup_data: function () {
        var self    = this;
        this.data  =  $(this.el).data();
		
        if (this.model)         this.data.model     = this.model;
        if (!this.model)        this.data.model     = new app.model.neuron();

        if (this.data.defaults) this.data.model.init(this.get_value(this.data.defaults));

        if (this.template)      this.data.template  = this.template;
        if (this.parent)        this.data.parent    = this.parent;

        if (this.data.template && this.data.template.indexOf('<') < 0)
            this.data.template  = $('#templates .' + this.data.template).html();

        if (this.data.item) {
            this.data.item      = $('#templates .' + this.data.item).html();
        } else if (this.data.foreach)     {
            this.data.item      = $(this.el).html();
            $(this.el).html('');
        }
        if (this.data.console)          console.log(this.el, this.data);

        if (this.data.cluster) this.setup_cluster();
    },
    init: {},
    init_data: function() {
        var field       = this.data.field;
        var value       = this.get_value(this.data.initValue);
        var action      = (field.indexOf('[]') > -1) ? 'add' : 'set';

        this.data.model[action](field, value);
    },
    get_value: function(val) {
        if (val.indexOf('{{') > -1) { // we have a template
            var tmp   = _.template(val);
            val       = tmp({ model: this.get_json() });
        }

        if (val.indexOf('{') > -1) {
            try {
                val = JSON.parse(val.replace(/\'/gi, '"'));
            } catch(err) {
                console.log('get_value parse error', val, err)
            }
        }

        return val;
    },
    get_json: function () {
        var self            = this;
        var json            = this.data.model.toJSON();
        var context         = [];

        if (this.data.parent)
            json.parent = this.data.parent.toJSON();

        if (this.data.context)
            context  = this.data.context.split('|');

        _.each(context, function(ctx) {
            var ct      = self.data.model.get(ctx);
            if (ct)     json[ctx.replace('data.', '')] = app.collection.get(ct).toJSON();
            else        json[ctx.replace('data.', '')] = { data: {} };
        });

        return json;
    },
    on_reset: function () {
        this._call(this.data.reset);
    },
    process_data: function () {
        var self = this;

        if (this.data.reset) {
            this.listenTo(this.data.model,   'reset',    this.on_reset);
        }

        if (this.data.subscribe) {
            this.listenTo(app, this.data.subscribe, this.subscription);
        }
        if (this.data.initValue)
            this.init_data();

        if (this.data.listeners) {
            this.setup_listeners();
        }

        this.render_item();

        if (this.data.focus)            this.focus();
        if (this.data.date)             this.date();

        if (this.data.checked) {
            var is_checked      = ('' + $(this.el).val()) == ('' + this.model.get(this.data.checked));
            if (is_checked)     $(this.el).attr('checked', '' + is_checked);
        }
    },
    setup_listeners: function () {
        var self        = this;
        var listeners   = this.data.listeners.split('|');

        _.each(listeners, function(it) {
            if (it.indexOf('parent') > -1) {
                //listen to change for a specific field on the parent element
                self.listenTo(self.parent, 'change:' + it.replace('parent.', ''), self.render_item);
            } else if (it != '*') {
                //listen to change for a specific field
                self.listenTo(self.data.model, 'change:' + it, (self.cluster) ? self.setup_cluster : self.render_item);
            } else {
                //listen to any change
                self.listenTo(self.data.model, 'change', (self.cluster) ? self.setup_cluster : self.render_item);
            }
        });
    },
    render_item: function (trigger) {
        var tagName          = $(this.el).prop('tagName');
        var self             = this;
        var json             = this.get_json();

        if (!this.tmp)      this.tmp    = {};
        if (!this.attr)     this.attr   = {};

        $.each($(this.el)[0].attributes, function (index, attr) {
            if (!self.attr[attr.name])  self.attr[attr.name]    = attr.value;
            if (!self.tmp[attr.name])   self.tmp[attr.name]     = _.template(self.attr[attr.name]);

            var val     = self.tmp[attr.name]({ model: json });

            $(self.el).attr(attr.name, val);

            // input is stubborn in that you need to set the value
            if (attr.name == 'value') {
                $(self.el).val(val);
            }
        });

        if (this.data.replace) {
            if (!this.tmp._html) this.tmp._html = $(this.el).html();
            var tmp = _.template(this.tmp._html);
            $(this.el).html(tmp({ model: json }));

            this.setup_subview();
        }

        if (tagName == 'TEXTAREA') {
            //$(this.el).autosize('update');
        }
    },
    setup_cluster: function () {
        if (this.cluster)
            this.stopListening(this.cluster);

        var tmp             = _.template(this.data.cluster);
        var cluster         = tmp({ model: this.get_json() });

        this.cluster        = app.collection.get_cluster(cluster.replace(/\'/gi, '"'));

        this.listenTo(this.cluster, 'add',     this.cluster_add);
        this.listenTo(this.cluster, 'remove',  this.cluster_remove);

        this.cluster_add(this.cluster.models);
    },
    cluster_add: function (models) {
        if (!_.isArray(models)) models = [ models ];

        var self        = this;
        var docFrag     = $(document.createDocumentFragment());

        _.each(models, function (item_model) {
            var $el     = $(self.data.item).addClass('data');
            docFrag.append($el);

            var opts    = { el: $el, model: item_model, parent: self.data.model };
            var view    = new Binding(opts);
            self.subviews.push(view);
        });

        setTimeout(function () {
            $(self.el).append(docFrag);
        }, 0);
    },
    cluster_remove: function (models) {
        if (!_.isArray(models)) models = [ models ];

        var removed_models  = _.pluck(models, 'id');

        _.each(this.subviews, function (subview) {
            if (_.contains(removed_models, subview.data.model.id)) {
                subview.remove();
            }
        });
    },
    setup_subview: function () {
        var self    = this;
        var $parent  = $(this.el);

        if (this.data.foreach)
            return false;

        $(this.el).find('.data').each(function (i, el) {
            $closest = $(el).parent().closest('.data');

            if ($closest[0] == $parent[0] || $closest.length == 0) {
                var opts    = _.extend({}, { el: $(el) });
                var data    = $(el).data();

                if (self.data.parent)   opts.parent = self.data.parent;

                if (!data.scope)        opts.model  = self.data.model;
                else                    opts.parent = self.data.model;

                var view    = new Binding(opts);
                self.subviews.push(view);
            }
		});
    },
    render: function () {
        if (_.isFunction(this.data.template))   $(this.el).html(this.data.template({ model: this.get_json() }));
        else if (this.data.template)            $(this.el).html(this.data.template);

        this.process_data();
        this.setup_subview();
    }
});
