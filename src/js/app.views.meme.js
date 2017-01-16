//TODO: this needs cleanup, these vars should be part of the view, not global
var currentImageWidth = 0;
var currentImageHeight = 0;
var originImageWidth = 0;
var originImageHeight = 0;
var defaultFontSize = 80;
var showFontSize = '';
var srcImage = '';
var ratio = 0.0;
var textareaMarginLeft = 40;
var textareaMarginTop = 60;
var sliderWidth = 0.0;
var sliderHeight = 0.0;
var isInited = 0;
var isUploaded = 0;
var commonRatio = 0.75;
var fontColor = 'white';
var channelID = '';
var nStyleCount = 10;
var canvas_array = [];
var srcCDN = [];
var selectedIndex = 100;
var memeImg = '';

app.views.meme = Backbone.View.extend({
    selectedBackground: null, //this remains null if user chooses their own image
    selectedBackgroundBase64: null, //base64 string
    initialize: function(opts) {
        this.opts = opts;
        this.template = _.template($('.meme-tmp').html());
        this.render();
        return this;
    },
    events: {
        'click      .modal-close':              'close_modal',
        'click      .meme-intro-try':           'close_modal',
        'click      .meme-proceed-step-3':      'pick_style',
        'click      .meme-proceed-step-4':      'add_to_vb',
        'click      .meme-style':               'select_style',
        'mouseover  .meme-style':               'styles_mouse_over',
        'mouseout   .meme-style':               'styles_mouse_out',
        'keyup      .meme-top-text':            'resize_font',
        'change     .meme-upload-input':        'upload_image',
        'drop       .meme-upload-dz':           'drop',
        'drag       .meme-upload-dz':           'drag',
        'click      .white':                    'changetowhite',
        'click      .black':                    'changetoblack',
        'click      .meme-back-step-1':         'backToStep1',
        'click      .meme-back-step-2':         'backToStep2',
        'keyup      .secondStep':               'disableBtn'
    },
    render: function() {
        var content = '';
        var self = this;
        $(this.el).html(this.template);
        $(this.el).find('.firstStep').addClass('hidden');
        $(this.el).find('.secondStep').addClass('hidden');
        $(this.el).find('.thirdStep').addClass('hidden');
        //TODO: any way to consolidate all modal windows much like the "full modal window" is?
        if(!app.config.data.SUBSCRIPTION_FEATURES.includes('unlimitedImageCreations')) {
            if(app.config.data.AVAILABLE_IMAGE_CREATIONS > 0) {
                //show remaining freebies
                content = '<div class="meme-intro-title">intently pro</div>';
                content += '<div class="meme-intro-msg1">Create beautiful inspiration, fast and easy</div>';
                content += '<div class="meme-intro-msg2">Give our image creator a test run</div>';
                content += '<div class="meme-intro-count">You have <strong>' + app.config.data.AVAILABLE_IMAGE_CREATIONS + ' image credits remaining</strong></div>';
                content += '<div class="meme-intro-buttons">';
                content += '<div class="btn btn-green meme-intro-try">Try now</div>';
                content += '<div class="btn btn-white ml2 data_trigger" data-trigger="overlay:show_subscription_payment_settings">Upgrade</div>';
                content += '</div>';
            }
            else {
                //no more freebies
                content = '<div class="meme-intro-msg1">We hope you enjoyed creating beautiful memes fast and easy</div>';
                content += '<div class="meme-intro-msg2">You have used your free images</div>';
                content += '<div class="meme-intro-buttons">';
                content += '<div class="btn btn-white data_trigger" data-trigger="overlay:show_subscription_payment_settings">Upgrade</div>';
                content += '</div>';
            }
            content += '<a href="' + app.config.get_about_pro_url() + '" target="_blank" class="meme-intro-learn">Learn more about intently pro</a>';
            $(this.el).find('#trymodalbody').html(content);
            $(this.el).find('.try-modal').modal('show');
            $(this.el).find('.try-modal').on('hidden.bs.modal', function (e) {
                $(this.el).find('.custom-modal-backdrop').hide();
            });
            this.init();
        }
        else {
            //user has unlimited creations
            this.init();
        }
        return this;
    },
    init: function() {
        var self = this;
        self.initFirst();
    },
    close_modal: function(event) {
        var self = this;
        $(event.target).parents('.modal').remove();
    },
    loadImages: function() {
        var self = this;
        $.ajax({
            url: app.config.get_base_api() + 'imagecreationtool/backgrounds/0/100',
            method: "GET",
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                var backgroundModels = [];
                //remove the loading indicator
                self.$('.loadingStep').addClass('hidden');
                self.$grid = self.$('.meme-grid').masonry({ 
                    itemSelector: '.card-meme', 
                    transitionDuration: '0.5s',
                });
                //model for the upload card
                var customBackgroundModel = new Backbone.Model({
                    _id: '-1',
                    id: 'intention.-1',
                    _is_upload_image_tile: true
                });
                //create the upload card and bind it
                var $newelem = new app.views.imagecard({
                    model       : customBackgroundModel,
                    template    : $('.memecard-tmp').html()
                });
                var binding = {
                    el          : $newelem.$el,
                    model       : customBackgroundModel,
                    template    : $('.memecard-tmp').html()
                };
                var view = new Binding(binding);
                self.subviews.push(view);
                self.$grid.prepend($newelem.$el).masonry('prepended', $newelem.$el);
                //go through each intention
                for(var i = 0; i < response.data.length; i++) {
                    //array keyed on id
                    backgroundModels[response.data[i].id] = response.data[i];
                    var model = new app.models.intention(response.data[i]);
                    //create the card and bind it
                    var $newelem = new app.views.imagecard({
                        model       : model,
                        template    : $('.memecard-tmp').html()
                    });
                    var binding = {
                        el          : $newelem.$el,
                        model       : model,
                        template    : $('.memecard-tmp').html()
                    };
                    var view = new Binding(binding);
                    self.subviews.push(view);
                    //add to the grid
                    self.$grid.append(view.$el).masonry('appended', view.$el);
                    view.$el.on('click', function(event) {
                        //get the background model
                        var chosenBackground = $(event.target).parents('.card-meme');
                        self.selectedBackground = backgroundModels[chosenBackground.attr('data-intention-id')];
                        //show loading
                        self.$('.firstStep').addClass('hidden');
                        $('.loadingStepMessage').html('Loading meme generator...');
                        self.$('.loadingStep').removeClass('hidden');
                        //retrieve the image and encode to base64
                        var xhr = new XMLHttpRequest();
                        xhr.responseType = 'arraybuffer';
                        xhr.open('GET', app.config.get_base_cdn() + 'original/' + self.selectedBackground.cdnFileName);
                        xhr.onload = function() {
                            var binary = '';
                            //convert to bytes and construct string
                            var bytes = new Uint8Array(xhr.response);
                            for(var i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            //finish with metadata
                            var extension = self.selectedBackground.cdnFileName.split('.');
                            extension = extension[extension.length - 1];
                            self.selectedBackgroundBase64 = 'data:image/' + extension + ';base64,' + window.btoa(binary);
                            //done loading
                            self.$('.loadingStep').addClass('hidden');
                            //go to step two
                            self.show_secondstep();
                        };
                        xhr.send();
                    });
                }
                if(self.$grid) self.$grid.imagesLoaded('progress', function(imageLoadEvent) {
                    if(self.$grid) self.$grid.masonry('layout');
                });
            }
        });
    },
    initFirst: function() {
        //show only the first step
        $(this.el).find('.firstStep').removeClass('hidden');
        $(this.el).find('.secondStep').addClass('hidden');
        $(this.el).find('.thirdStep').addClass('hidden');
        $(this.el).find('#nextseleted').addClass('disabled');
        this.loadImages();
    },
    show_secondstep: function() {
        if($(".secondStep").hasClass("hidden")){
            $(".firstStep").addClass("hidden");
            $(".secondStep").removeClass("hidden");
            $(".thirdStep").addClass("hidden");
            this.initSecond();
        }
    },
    initSecond: function() {
        var self = this;
        $(self.el).find('.meme-caption-image').attr('src', self.selectedBackgroundBase64);
        $(self.el).find('.meme-proceed-step-3').addClass('disabled');
        $(self.el).find('.meme-caption-image').imagesLoaded('progress', function() {
            //create the layout based on background size
            var temp = $(self.el).find('.meme-caption-image');
            currentImageWidth = temp[0].clientWidth;
            currentImageHeight = temp[0].clientHeight;
            var mainTextareaWidth = currentImageWidth * commonRatio ;
            var mainTextareaHeight = currentImageHeight * commonRatio - 20;
            $(".meme-top-text").width(mainTextareaWidth);
            $(".meme-top-text").height(mainTextareaHeight);
            var mainTextareaMarginTop = (currentImageHeight - mainTextareaHeight) / 2;
            $(".meme-top-text").css('margin-top', mainTextareaMarginTop);
            //determine the initial font size
            originImageWidth = temp[0].naturalWidth;
            originImageHeight = temp[0].naturalHeight;
            ratio = currentImageWidth / originImageWidth;
            defaultFontSize = (originImageWidth / 1000) * 80;
            if(originImageWidth < 500)
                defaultFontSize = 30;
            showFontSize = defaultFontSize * ratio;
            $(self.el).find('.meme-top-text').css('font-size', showFontSize);
            //prep the style slider (step 3)
            sliderWidth = (currentImageWidth * 4 + 60);
            sliderHeight = currentImageHeight;
            var sliderContent ='<div id="jssor_1" style="overflow: hidden; position: relative; margin: 0 auto; top: 0px; left: 0px; width:' + sliderWidth +'px; height: ' + (sliderHeight * 1.5 + 10) + 'px;  visibility: hidden;">';
            sliderContent += '<div data-u="loading" style="position: absolute; top: 0px; left: 0px;"> ';
            sliderContent += '<div style="filter: alpha(opacity=70); opacity: 0.7; position: absolute; display: block; top: 0px; left: 0px; width: 100%; height: 100%;"></div>';
            sliderContent += '<div style="position:absolute;display:block;background:url("images/loading.gif") no-repeat center center;top:0px;left:0px;width:100%;height:100%;"></div> </div>';
            sliderContent += '<div class="jslides" data-u="slides" style="cursor: default; position: relative; top: ' + (sliderHeight * 0.25 + 5 ) + 'px; left: 0px; overflow: hidden; width:' + sliderWidth + 'px; height: ' + sliderHeight + 'px; ">';
            for(var i = 1; i <= 10 ; i++) {
                sliderContent +='<div class="meme-style" style="display: none; overflow: inherit; !important;"> <canvas id="style' + i +'"></canvas> </div>  ';
            }
            sliderContent += '<div data-u="prototype" style="width:21px;height:21px;">';
            sliderContent += '<div data-u="numbertemplate"></div></div></div>';
            sliderContent += '<span data-u="arrowleft" class="jssora03l" style="top:' + ((currentImageHeight - 22.5) /2 ) + 'px;left:8px;width:55px;height:55px; z-index: 99999" data-autocenter="2"></span>';
            sliderContent += '<span data-u="arrowright" class="jssora03r" style="top:' + ((currentImageHeight - 22.5) /2 ) + 'px;right:8px;width:55px;height:55px; z-index: 99999" data-autocenter="2"></span></div>';
            $(self.el).find('.slider-div').html(sliderContent);
            self.sliderInit();
            $(this.el).find('.meme-top-text').focus();
        });
    },
    sliderInit: function() {
        var jssor_1_options = {
            $AutoPlay: false,
            $AutoPlaySteps: 1,
            $SlideDuration: 160,
            $SlideWidth: currentImageWidth,
            $SlideSpacing: 20,
            $Cols: 5,
            $ArrowNavigatorOptions: {
                $Class: $JssorArrowNavigator$,
                $Steps: 1
            },
            $BulletNavigatorOptions: {
                $Class: $JssorBulletNavigator$,
                $SpacingX: 1,
                $SpacingY: 1
            }
        };
        var jssor_1_slider = new $JssorSlider$("jssor_1", jssor_1_options);
        //handle resizing
        function ScaleSlider() {
            var refSize = jssor_1_slider.$Elmt.parentNode.clientWidth;
            if (refSize) {
                refSize = Math.min(refSize, sliderWidth);
                jssor_1_slider.$ScaleWidth(refSize);
            }
            else {
                window.setTimeout(ScaleSlider, 30);
            }
        }
        ScaleSlider();
        $(window).bind("load", ScaleSlider);
        $(window).bind("resize", ScaleSlider);
        $(window).bind("orientationchange", ScaleSlider);
    },
    wrapText: function(context, text, canvasWidth, maxWidth, lineHeight, y) {
        //magic for wrapping the text for each style
        var x, xTemp;
        var patt = /\s/g;
        var words = text.split(patt);
        var line = '';
        for(var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var metricsTemp = context.measureText(line);
            var testWidth = metrics.width;
            xTemp = (canvasWidth - metricsTemp.width) /2;
            x = (canvasWidth - metrics.width) /2;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, xTemp, y);
                line = words[n] + ' ';
                y += lineHeight;
                var metricsTemp = context.measureText(line);
                xTemp = (canvasWidth - metricsTemp.width) /2;
            }
            else {
                line = testLine;
            }
        }
        var metricsTemp = context.measureText(line);
        xTemp = (canvasWidth - metricsTemp.width) / 2;
        context.fillText(line, xTemp, y);
    },
    getTextHeight: function(context, text, maxWidth, lineHeight, font) {
        //magic for determining the height of text for each style
        var patt = /\s/g;
        var words = text.split(patt);
        var line = '';
        var nCount = 0;
        context.font = font;
        for(var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                line = words[n] + ' ';
                nCount ++;
            }
            else {
                line = testLine;
            }
        }
        return (nCount + 1) * lineHeight;
    },
    pick_style: function() {
        var self = this;
        $(self.el).find('.firstStep').addClass('hidden');
        $(self.el).find('.secondStep').addClass('hidden');
        $(self.el).find('.thirdStep').removeClass('hidden');
        $(self.el).find('.meme-proceed-step-4').addClass('disabled');
        self.makeStyle();
    },
    select_style: function(ev) {
        var self = this;
        $(self.el).find('.selectStyle').removeClass('selectStyle');
        $(ev.currentTarget).addClass('selectStyle');
        $(self.el).find('.meme-proceed-step-4').removeClass('disabled');

        var c = $(self.el).find('.selectStyle').find('canvas');
        var id = c[0].id;
        id = id.substring(5);
        c = canvas_array[parseInt(id - 1)];
        self.resultData = c.toDataURL('image/jpeg');
    },
    add_to_vb: function(event) {
        var self = this;
        //trigger the overlay and navigate back
        app.trigger('overlay:add_meme_to_vb', self.resultData);
        app.config.navigate_back();
    },
    disableBtn: function(event) {
        var self = this;
        if($(self.el).find('.meme-top-text').val() != '')
            $(self.el).find('.meme-proceed-step-3').removeClass('disabled');
        else
            $(self.el).find('.meme-proceed-step-3').addClass('disabled');
    },
    resize_font: function(event) {
        var self = this;
        var target = $(event.currentTarget);
        while(target[0].scrollHeight > target.height() + 4) {
            target.css('font-size', (parseFloat(target.css('font-size')) - 1) + 'px');
        }
        if (event.keyCode == 8 || event.keyCode == 46) {
            while ( target[0].scrollHeight <= target.height() + 4 && parseFloat(target.css('font-size')) <= showFontSize ) {
                target.css('font-size', (parseFloat(target.css('font-size')) + 0.1) + 'px');
            }
            target.css('font-size', (parseFloat(target.css('font-size')) - 0.1) + 'px');
        }
    },
    drag: function(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
    },
    drop: function(ev) {
        this.upload_image(ev);
    },
    upload_image: function(input) {
        var self = this;
        var target = input.currentTarget;
        var self =  this;
        if (target.files && target.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                self.selectedBackgroundBase64 = e.target.result;
                $(".firstStep").addClass("hidden");
                $(".secondStep").removeClass("hidden");
                self.initSecond();
            };
            reader.readAsDataURL(target.files[0]);
        }
    },
    changetowhite: function() {
        fontColor = 'white';
        $(this.el).find('.meme-top-text').css('color', fontColor);
        $(this.el).find('.meme-top-text').focus();
    },
    changetoblack: function() {
        fontColor = 'black';
        $(this.el).find('.meme-top-text').css('color', fontColor);
        $(this.el).find('.meme-top-text').focus();
    },
    styles_mouse_over: function (e) {
        $(e.currentTarget).css("z-index", "9");
    },
    styles_mouse_out: function (e) {
        $(e.currentTarget).css("z-index", "0");
    },
    makeStyle: function() {
        canvas_array = [];
        var virsize_canvas_array = [];
        for(var i = 0; i < nStyleCount; i++) {
            canvas_array[i] = document.createElement("canvas");
            virsize_canvas_array[i] =  document.getElementById("style" + (i+1));
        }
        this.build_style(canvas_array, originImageWidth, originImageHeight);
        this.build_style(virsize_canvas_array, currentImageWidth, currentImageHeight);
    },
    build_style: function(canvas, newWidth, newHeight) {
        var newRatio = currentImageWidth / newWidth;
        var fontSize =  parseFloat($(this.el).find('.meme-top-text').css('font-size')) * (1 / newRatio);
        var text = $(this.el).find('.meme-top-text').val();
        var self = this;
        srcImage = new Image();
        var fontBackup = fontSize;
        var fontfamily;
        srcImage.onload = function() {
            for(var i = 0; i < nStyleCount; i++) {
                var c = canvas[i];
                c.width = newWidth;
                c.height = newHeight;
                c.style.width = currentImageWidth + 'px';
                c.style.height = currentImageHeight + 'px';
                //background image
                var ctx = c.getContext("2d");
                ctx.drawImage(srcImage, 0, 0, newWidth, newHeight);
                fontSize = fontBackup;
                fontfamily = "px font" + (i + 1);
                ctx.font = fontSize + fontfamily;
                var lineHeight = fontSize;
                var y = (newHeight - newHeight * commonRatio) / 2 ;
                var maxWidth = newWidth *commonRatio;
                var maxHeight = newHeight *commonRatio;
                switch(i + 1) {
                    case 2:
                        ctx.globalAlpha = 0.4;
                        ctx.rect(0, 0, newWidth, newHeight);
                        ctx.fillStyle = '#ffffff';
                        ctx.fill();
                        //border rect
                        var width = newWidth *commonRatio;
                        var height = newHeight *commonRatio;
                        ctx.rect( (newWidth - width) / 2 - 5, (newHeight - height) /2 , newWidth / 4 * 3 + 10, newHeight /4 * 3);
                        ctx.lineWidth = 10;
                        ctx.strokeStyle = fontColor;
                        ctx.stroke();
                        //text
                        ctx.globalAlpha = 1;
                        y = self.getTextHeight(ctx, text.toUpperCase(), maxWidth, lineHeight, fontSize + fontfamily);
                        y = (newHeight - y) /2 ;
                        break;
                    case 5:
                        var maxHeight = newHeight *commonRatio;
                        var r;
                        if(maxWidth <= maxHeight)
                            r = maxWidth;
                        else
                            r = maxHeight;
                        var tempMaxWidth = Math.sqrt(r * r / 2);
                        var tempfontSize = fontSize;
                        while(self.getTextHeight(ctx, text.toUpperCase(), tempMaxWidth, tempfontSize, tempfontSize + fontfamily) > tempMaxWidth ){
                            tempfontSize --;
                        }
                        ctx.beginPath();
                        ctx.arc(newWidth /2 ,newHeight / 2, r / 2,0,2*Math.PI);
                        ctx.globalAlpha = 0.3;
                        ctx.fillStyle = "black";
                        ctx.fill();
                        ctx.closePath();
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = fontColor;
                        maxWidth = tempMaxWidth;
                        fontSize = tempfontSize ;
                        lineHeight = tempfontSize;
                        y = self.getTextHeight(ctx, text.toUpperCase(), maxWidth, lineHeight, lineHeight + fontfamily);
                        y = (newHeight - y) /2 ;
                        break;
                    case 8:
                        var imageData = ctx.getImageData(0, 0, newWidth, newHeight);
                        var data = imageData.data;
                        StackBlur.imageDataRGBA(imageData, 0, 0, newWidth, newHeight, 25);
                        ctx.putImageData(imageData, 0, 0);

                        y = self.getTextHeight(ctx, text.toUpperCase(), maxWidth, lineHeight, fontSize + fontfamily);
                        y = (newHeight - y) /2 ;
                        break;
                    case 10:
                        var imageData = ctx.getImageData(0, 0, newWidth, newHeight);
                        var data = imageData.data;
                        for(var i = 0; i < data.length; i += 4) {
                            var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                            // red
                            data[i] = brightness;
                            // green
                            data[i + 1] = brightness;
                            // blue
                            data[i + 2] = brightness;
                        }
                        // overwrite original image
                        ctx.putImageData(imageData, 0, 0);
                        break;
                    case 1, 4, 6, 7:
                        var tempHeight = maxHeight / 2;
                        var tempfontSize = fontSize;
                        while(self.getTextHeight(ctx, text.toUpperCase(), maxWidth, tempfontSize, tempfontSize + fontfamily) > tempHeight ){
                            tempfontSize --;
                        }
                        fontSize = tempfontSize;
                        break;
                    case 9:
                        var tempHeight = maxHeight / 2;
                        var tempfontSize = fontSize;
                        while(self.getTextHeight(ctx, text.toUpperCase(), maxWidth, tempfontSize, tempfontSize + fontfamily) > tempHeight ){
                            tempfontSize --;
                        }
                        fontSize = tempfontSize;

                        ctx.beginPath();
                        ctx.strokeStyle = fontColor;
                        ctx.moveTo(newWidth / 2, 0);
                        ctx.lineTo(newWidth / 2, y );
                        ctx.moveTo(newWidth / 2, y + self.getTextHeight(ctx, text.toUpperCase(), maxWidth, tempfontSize, tempfontSize + fontfamily));
                        ctx.lineTo(newWidth / 2, newHeight - 10*(1 / newRatio) - lineHeight);
                        ctx.stroke();
                        break;
                }
                ctx.fillStyle = fontColor;
                ctx.font = fontSize + "px font" + (i + 1);
                self.wrapText(ctx, text.toUpperCase(), newWidth, maxWidth, lineHeight, y+ lineHeight);
            }
        };
        srcImage.src = self.selectedBackgroundBase64;
    },
    backToStep1: function(e) {
        $(".firstStep").removeClass("hidden");
        $(".secondStep").addClass("hidden");
    },
    backToStep2: function(e) {
        $(".secondStep").removeClass("hidden");
        $(".thirdStep").addClass("hidden");
    }

});
