app.plugins.fullmodal = {
	show: function(opts) {
        var self = this;
        //remove the modal if it already exists
        $('body > #full-modal-wrapper').remove();
        //create the modal window with the specified options
        $('body').append(_.template($('.fullmodal-tmp').html())({
            opts: opts.modalOpts || {}
        }));
        if(opts.view) {
            //display the view
            var modalView = new opts.view(_.extend({
                template: opts.template,
                el: $('body > #full-modal-wrapper .full-modal-body'),
                model: opts.model || {},
                router: opts.router || {}
            }, opts.viewOpts));
        }
        else if(opts.template) {
            //render the content
            $('body > #full-modal-wrapper .full-modal-body').append(opts.template);
        }
        $('body > #full-modal-wrapper').find('.full-modal-close').click(function(e) {
            //go back on close
            if(opts.navigate_back_on_close === false) {
                self.close();
            }
            else {
                app.config.navigate_back();
            }
        });
        return $('body > #full-modal-wrapper');
	},
	close: function() {
		$('body > #full-modal-wrapper').remove();
	}
};
