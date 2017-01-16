var self = this;

// strip the protocol and subdomain
var cookieDomain = '.' + window.location.href.replace(/https?:\/\/.+?\./, '').replace(/\/.*/, '');
var apiDomain = 'api' + cookieDomain;
var apiVersion = 'v0.9.44';
// generate and set the bfp cookie
var bfp	= new Fingerprint({ screen_resolution: true, canvas: true, ie_activex: true }).get();
Cookies.set('bfp', bfp, { secure: true, domain: cookieDomain, expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365) });

var getParameterByName = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var onSuccess = function(login_guid) {
	//display success
	document.getElementById('signup-form').style.display = 'none';
	document.getElementById('success-message').style.display = 'block';
	Cookies.set('login_guid', login_guid, { secure: true, domain: cookieDomain, expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365) });
}

var jv = 'beta';
var jointVentureID;

//successful login via facebook
var login_guid = getParameterByName('login_guid');
if(login_guid) {
	onSuccess(login_guid);
}
else {
	//see if jv is specified
	var queryString = window.location.href.split('?');
	if(queryString[1]) {
		jv = queryString[1];
	}
}

//request jv info
var xhr = new XMLHttpRequest();
xhr.withCredentials = true;
xhr.open('GET', 'https://' + apiDomain + '/' + apiVersion + '/public/jointventureinfo/' + jv, true);
xhr.onreadystatechange = function() {
    if(xhr.readyState == 4 && xhr.status == 200) {
    	var response = JSON.parse(xhr.responseText);
		if(response.data && response.data.id > 0) {
			//change the background and watermark
			document.getElementById('jvbg-container').setAttribute('style', 'background-image: url(\'' + response.data.landingPageBackgroundURL + '\');');
			document.getElementById('watermark-image').setAttribute('src', response.data.watermarkURL);
			jointVentureID = response.data.id;
			//enable facebook button and bind
			document.getElementById('submit-button').disabled = false;
			document.getElementById('facebook-button').onclick = function() {
				var facebookAuthURL = 'https://' + apiDomain + '/' + apiVersion + '/public/facebooklogin';
				if(jointVentureID) {
					facebookAuthURL += '?jointVentureID=' + jointVentureID;
				}
				window.location.href = facebookAuthURL;
			};
			//enable submit button and bind
			document.getElementById('submit-button').disabled = false;
			document.getElementById('submit-button').onclick = function() {
				//validate
				var firstName = document.getElementById('firstName').value;
				if(!firstName.length) {
					document.getElementById('error-message').innerHTML = 'You must provide a first name.';
					return;
				}
				var lastName = document.getElementById('lastName').value;
				if(!lastName.length) {
					document.getElementById('error-message').innerHTML = 'You must provide a last name.';
					return;
				}
				var email = document.getElementById('email').value;
				if(!email.length) {
					document.getElementById('error-message').innerHTML = 'You must provide an email address.';
					return;
				}
				var username = document.getElementById('username').value;
				if(!username.length) {
					document.getElementById('error-message').innerHTML = 'You must select a username.';
					return;
				}
				var password = document.getElementById('password').value;
				if(!password.length) {
					document.getElementById('error-message').innerHTML = 'You must select a password.';
					return;
				}
				//no errors
				document.getElementById('error-message').innerHTML = '';
				//build params
				var params = {
					firstName: firstName,
					lastName: lastName,
					email: email,
					username: username,
					password: password,
					jointVentureID: jointVentureID
				};
				//sign up the user
				var xhr = new XMLHttpRequest();
				xhr.withCredentials = true;
				xhr.open('POST', 'https://' + apiDomain + '/' + apiVersion + '/public/usersignup', true);
				xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
				xhr.onreadystatechange = function() {
				    if(xhr.readyState == 4 && xhr.status == 200) {
				    	var response = JSON.parse(xhr.responseText);
				    	if(response.success) {
				    		//display success
				    		onSuccess(response.data);
				    	}
				    	else if(response.message) {
				    		//signup failure
				    		document.getElementById('error-message').innerHTML = response.message;
				    	}
				    	else {
				    		//unknown failure
				    		document.getElementById('error-message').innerHTML = 'An unknown error has occurred, please try again later.';
				    	}
				    }
				};
				xhr.send(JSON.stringify(params));
			};
		}
		else {
			//joint venture info failure
			document.getElementById('error-message').innerHTML = 'An unknown error has occurred, please try again later';
		}
    }
}
xhr.send();
