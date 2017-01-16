app.plugins.extension = function () {
	if (app.config.env == 'staging') return false;

	if (!$.browser || !app.config.data.SIGNUP_VISIONS_SET) return;

	if ($.browser.chrome === true) {
		//check for chrome extension
		var intentlyManifestScript = document.createElement('script');
		intentlyManifestScript.onerror = function() {
			//add chrome store link to the head
			var chromeStoreLink = document.createElement('link');
			chromeStoreLink.rel = 'chrome-webstore-item';
			chromeStoreLink.href = 'https://chrome.google.com/webstore/detail/' + app.config.data.CHROME_EXTENSION_ID;
			document.head.appendChild(chromeStoreLink);
			var extensionInstallSuccess = function() {
				$('#extension-modal').modal('hide');
			};
			var extensionInstallFailure = function() {
				$('#extension-modal > #install-failure-warning').show();
			};
			$('#install-extension-container').append('<button id="install-extension" class="button multiline green">\
				<h2 class="serif font-bold hide-medium hide-small white">Install <span class="hide-medium">the Extension</span> Now</h2>\
				<h5 class="small-caps font-light white">When prompted, select <span class="font-bold">ADD</span></h5>\
			</button>');

			if ($('#install-extension').length > 0) {
				$('#install-extension')[0].onclick = function() {
					chrome.webstore.install('https://chrome.google.com/webstore/detail/' + app.config.data.CHROME_EXTENSION_ID, extensionInstallSuccess, extensionInstallFailure);
				};
				$('#extension-modal').modal('show');
			}

		};
		document.body.appendChild(intentlyManifestScript);
		intentlyManifestScript.src = 'chrome-extension://' + app.config.data.CHROME_EXTENSION_ID + '/manifest.json';
	} else if ($.browser.mozilla === true) {

		//check for the body attribute that firefox extension should set
		setTimeout(function() {
			if(document.body.getAttribute('intentlyFirefoxExtensionInstalled') !== '1') {
				var children = $('#install-extension > *');
				$('#install-extension-container').empty().append('<a id="install-extension" class="button multiline green" href="' + app.config.data.FIREFOX_EXTENSION_URL + '"></a>');
				$('#install-extension').append('<h2 class="serif font-bold hide-medium hide-small white">Install <span class="hide-medium">the Extension</span> Now</h2>\
					<h5 class="small-caps font-light white">When prompted, select <span class="font-bold">ALLOW</span> or <span class="font-bold">INSTALL</span></h5>');
				$('#extension-modal').modal('show');
			}
		}, 3000);

	} else if ($.browser.safari === true) {

		//check for the body attribute that safari extension should set
		setTimeout(function() {
			if(document.body.getAttribute('intentlySafariExtensionInstalled') !== '1') {
				var children = $('#install-extension > *');
				$('#install-extension-container').empty().append('<a id="install-extension" class="button multiline green" href="' + app.config.data.SAFARI_EXTENSION_URL + '"></a>');
				$('#install-extension').append('<h2 class="serif font-bold hide-medium hide-small white">Install <span class="hide-medium">the Extension</span> Now</h2>\
					<h5 class="small-caps font-light white">After downloading, <span class="font-bold">OPEN</span> the extension<br/>from your <span class="font-bold">DOWNLOADS</span> folder and click <span class="font-bold">INSTALL</span></h5>');
				$('#extension-modal').modal('show');
			}
		}, 3000);

	}
	else {

		//display a warning message noting their browser is not currently supported
		$('#extension-modal').html('<h2 class="serif font-bold text-center text-italic padding-large">Currently, Intently is supported on Chrome, Firefox, and Safari only. Stay tuned for mobile support!</h2><a class="close-reveal-modal" data-dismiss="modal">x</a>');
		$('#extension-modal').modal('show');

	}
}
