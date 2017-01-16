
/*
	DEPENDENCIES
		CryptoJS (https://code.google.com/p/crypto-js/)
		jQuery (https://jquery.com/)
*/

var ipnsClient = ipnsClient || (function(serviceInfoEndpoint, debug) {

	//init vars
	var me = this;
	me.serviceInfoEndpoint = serviceInfoEndpoint;

	//logging
	me.debug = debug || false;
	me.log = function(msg) {
		if(me.debug) console.log('IPNS DEBUG: ' + msg);
	};

	//exception throwing
	me.ipnsClientException = function(message) {
		return {
			name: 'IPNSClientException',
			message: message,
			toString: function() { return this.name + ": " + this.message; } 
		};
	};

	//required param
	if(!me.serviceInfoEndpoint) {
		me.log('You must supply the service information endpoint e.g. https://api.intently.com/v0.9.43/account/pushnotificationservice');
		throw new me.ipnsClientException('Missing required parameter: service information endpoint.');
	}

	//for resetting the state
	me.resetState = function() {
		me.socket = null;
		me.encrypt = false;
		me.authenticated = false;
	};
	me.resetState();

	//event target
	me.eventListeners = {
		connected: [],
		authenticated: [],
		msgSent: [],
		msgReceived: [],
		disconnected: []
	};
	me.on = function(eventName, handler) {
		//validate event and handler
		if(!me.eventListeners[eventName] || typeof handler !== 'function')
			return;
		//add entry
		me.eventListeners[eventName].push(handler);
	};
	me.off = function(eventName, handler) {
		//validate event and handler
		if(!me.eventListeners[eventName] || typeof handler !== 'function')
			return;
		//find and remove entry
		for(var lcv = 0; lcv < me.eventListeners[eventName].length; lcv++) {
			if(me.eventListeners[eventName][lcv] == handler) {
				me.eventListeners[eventName].splice(lcv, 1);
			}
		}
	};

	//get the service info
	$.ajax({
		url: serviceInfoEndpoint,
		xhrFields: {
			withCredentials: true
		},
		success: function(result, status, xhr) {
			if(result.success == true && result.data && result.data.endpoint && result.data.key) {
				me.serviceEndpoint = result.data.endpoint;
				me.cryptoKey = result.data.key;
				me.log('Successfully retrieved service info.');
			}
			else {
				//something is wrong with the response
				me.log('Something went wrong with the service information endpoint response. This is likely an API issue.');
				throw new me.ipnsClientException('Invalid service information endpoint response.');
			}
		},
		error: function(xhr, status, error) {
			//something went wrong
			me.log('Something went wrong with retrieving the service information. This is likely an API or connectivity issue.');
			throw new me.ipnsClientException('Could not retrieve service information.');
		}
	});

	//init crypto
	me.cryptoJSAesJson = {
	    stringify: function (cipherParams) {
	        var j = {ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)};
	        if (cipherParams.iv) j.iv = cipherParams.iv.toString();
	        if (cipherParams.salt) j.s = cipherParams.salt.toString();
	        return JSON.stringify(j);
	    },
	    parse: function (jsonStr) {
	        var j = JSON.parse(jsonStr);
	        var cipherParams = CryptoJS.lib.CipherParams.create({ciphertext: CryptoJS.enc.Base64.parse(j.ct)});
	        if (j.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(j.iv)
	        if (j.s) cipherParams.salt = CryptoJS.enc.Hex.parse(j.s)
	        return cipherParams;
	    }
	};

	me.connect = function(userID, bfp, guid) {
		//required params
		if(!userID) {
			me.log('You must specify the Intently user id to connect to IPNS.');
			throw new me.ipnsClientException('Missing required connect parameter: userID.');
		}
		if(!bfp) {
			me.log('You must specify the device fingerprint to connect to IPNS.');
			throw new me.ipnsClientException('Missing required connect parameter: bfp.');
		}
		if(!guid) {
			me.log('You must specify the Intently user login guid to IPNS.');
			throw new me.ipnsClientException('Missing required connect parameter: guid.');
		}
		//ensure not already connected
		if(me.socket) {
			me.log('Already connected, nothing to do.');
			return false;
		}
		me.userID = userID;
		me.bfp = bfp;
		me.guid = guid;
		me.awaitingHandshake = true;
		try {
			//connect web socket to IPNS and set up handlers
			me.socket = new WebSocket(me.serviceEndpoint);
			me.socket.onopen = me.onWebSocketOpen;
			me.socket.onmessage = me.onWebSocketMessage;
			me.socket.onclose = me.onWebSocketClose;
		}
		catch(ex) {
			//something went wrong
			me.socket = null;
			me.log('An issue occurred during WebSocket connection.');
			throw new me.ipnsClientException('WebSocket connection failed.');
		}
		return true;
	};

	me.onWebSocketOpen = function(event) {
		me.log('WebSocket open status: ' + this.readyState);
		//emit connected events
		for(var lcv = 0; lcv < me.eventListeners['connected'].length; lcv++) {
			me.eventListeners['connected'][lcv].call(this, this.readyState);
		}
	};

	me.send = function(msg) {
		//ensure connected
		if(!me.socket) {
			me.log('You must connect to the IPNS service before sending a message.');
			throw new me.ipnsClientException('Cannot send message without connection.');
			return;
		}
		try { 
			if(me.encrypt && me.cryptoKey) {
				//encrypt and send message
				var msgCopy = msg;
				msg = me.cryptoJSAesJson.stringify(CryptoJS.AES.encrypt(msg, me.cryptoKey));
				me.socket.send(msg); 
				me.log('Sent encrypted message: ' + msgCopy);
			}
			else {
				//send message
				me.socket.send(msg); 
				me.log('Sent unencrypted message: ' + msg);
			}
		} 
		catch(ex) { 
			//something went wrong
			me.socket = null;
			me.log('Something went wrong with WebSocket send.');
			throw new me.ipnsClientException('WebSocket send failed.');
			return false;
		}
		if(me.authenticated) {
			//emit msgSent events
			for(var lcv = 0; lcv < me.eventListeners['msgSent'].length; lcv++) {
				me.eventListeners['msgSent'][lcv].call(this, msg);
			}
		}
		return true;
	};

	me.onWebSocketMessage = function(rawMsg) {
		var msg = rawMsg.data;
		if(me.encrypt && me.cryptoKey) {
			//decrypt message
			msg = CryptoJS.AES.decrypt(rawMsg.data, me.cryptoKey, {format: me.cryptoJSAesJson}).toString(CryptoJS.enc.Utf8);
			me.log('Received encrypted IPNS message: ' + msg); 
		}
		else {
			//plaintext message
			me.log('Received unencrypted IPNS message: ' + msg); 
		}
		var jsonMsg = JSON.parse(msg);
		//see if this is a handshake message
		if(jsonMsg && jsonMsg.type == 'handshake') {
			if(jsonMsg.state == 'awaiting_identification') {
				//send identify message
				var identifyMsg = {};
				identifyMsg.type = "identify";
				identifyMsg.user_id = me.userID;
				identifyMsg.bfp = me.bfp;
				me.send(JSON.stringify(identifyMsg));
				//everything should be encrypted going forward
				me.encrypt = true;
			}
			else if(jsonMsg.state == 'awaiting_authentication') {
				//send authentication
				var authenticateMsg = {};
				authenticateMsg.type = "authenticate";
				authenticateMsg.login_guid = me.guid;
				me.send(JSON.stringify(authenticateMsg));
			}
			else if(jsonMsg.state == 'authenticated') {
				//we are subscribed, woohoo!
				me.authenticated = true;
				//emit authenticated events
				for(var lcv = 0; lcv < me.eventListeners['authenticated'].length; lcv++) {
					me.eventListeners['authenticated'][lcv].call(this);
				}
			}
		}
		else if(me.authenticated) {
			//emit msgReceived events
			for(var lcv = 0; lcv < me.eventListeners['msgReceived'].length; lcv++) {
				me.eventListeners['msgReceived'][lcv].call(this, msg);
			}
		}
	};

	me.disconnect = function() {
		me.socket.close();
	};

	me.onWebSocketClose = function(event) {
		me.log('WebSocket close status: ' + this.readyState);
		me.resetState();
		//emit disconnected events
		for(var lcv = 0; lcv < me.eventListeners['disconnected'].length; lcv++) {
			me.eventListeners['disconnected'][lcv].call(this, this.readyState);
		}
	}

});