if (app.config.env !== 'dev') {
	// GOOGLE ANALYTICS
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
	var gaToken = 'UA-59563640-';
	if(window.location.hostname.indexOf('devintently') >= 0) gaToken += '2';
	else if(window.location.hostname.indexOf('qaintently') >= 0) gaToken += '3';
	else gaToken += '1';
	ga('create', gaToken, 'auto');
	ga('send', 'pageview', { 'page': location.pathname + location.search + location.hash });
}
