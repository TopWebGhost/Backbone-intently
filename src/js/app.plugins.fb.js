window.fbAsyncInit = function() {
  FB.init({
    appId      : '233192890357515',
    xfbml      : true,
    version    : 'v2.6'
  });
};

(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));

// https://www.facebook.com/v2.5/dialog/feed?
//
// {
//   app_id:"233192890357515",
// {
//   picture:"https://dk3wu32ros038.cloudfront.net/full/18bf1f7a6d9b4fec15bb39833f2e84b6_57606489540288.01598791.jpg",
//   name:"Tired%20of%20Ads?&caption=Replace%20them%20all%20with%20images%20like%20this%20for%20free.%20Click%20here%20to%20get%20started.",
//   link:"https://api.intently.com/v0.9.44/public/externalshareclick/channelresource/675&",
//   display:"iframe",
//   redirect_uri:"https://api.intently.com/v0.9.44/channelresources/sharetofbcomplete/675"
// }
