app.plugins.shareDialog = {
  dialogNode:   '<div id="intentlyShareDialog">' +
    '  <div id="intentlySharedCard">' +
    '    <div id="intentlyShareClose"></div>' +
    '    <div id="intentlyShareHeader">Share Image</div>' +
    '    <div id="intentlyShareImage"></div>' +
    '    <div id="intentlyShareSearchBar">' +
    '     <input id="intentlyShareSearch" class="app-popup-text-search intentlyShareSearchEmailHidden" type="text" placeholder="Name or Email" />' +
    '     <div id="intentlyShareInvite" class="intentlyShareInviteHidden hidden" ></div>' +
    '    </div>' +
    '    <div id="intentlyShareFriendsList">' +
    '    </div>' +
    '    <div id="intentlyShareFacebookTrigger">' +
    '      <div class="avatar intentlyFacebook">' +
    '      </div>' +
    '      <div class="intentlyUserTitle">' +
    '        Share Via Facebook'+
    '      </div>' +
    '    </div>'+
    '  </div>' +
    '</div>',
  emailDialogDisplayed : false,
  friends : [],
  dialogID : "intentlyShareDialog",
  image : {},
  intention : {},
  emails:[],
  showDialog : function (intention){
    var self = this;
    console.log("intention:",intention.toJSON());
    this.intention = intention;
    this.image = intention.toJSON();
    var url = app.config.get_base_cdn() + "cover/" + this.image.cdnFileName;
    var img = new Image();
    img.onload = function(){
      console.log(JSON.stringify(img.width));
      $('#intentlyShareImage').append(img);
    };
    img.src = url;
    this.closeDialog();
    $("body").append(this.dialogNode);
    this.fetchFriends();
    $('#intentlyShareSearch').on("keyup",function(){
      var str = $("#intentlyShareSearch").val();
      self.emails = self.extractEmails(str);
      if(self.emails !== null){
        if(!self.emailDialogDisplayed){
          self.transitionEmail();
          self.emailDialogDisplayed = true;
        }
      }else{
        if(self.emailDialogDisplayed){
          self.transitionFriend();
          self.emailDialogDisplayed = false;
        }
        console.log("search:",str);
        self.populateFriends(str);
      }
    }).css({
      background: "url('/images/search.png') no-repeat scroll 7px 7px",
      "padding-left":"30px",
    });
    $("#intentlyShareClose").css({
      "background-image":'url("/images/close.png")',
      "background-repeat": "no-repeat"
    }).mouseover(function(){
      $(this).css({"background-image":'url("/images/close-hover.png")'});
    }).mouseout(function(){
      $(this).css({
        "background-image":'url("/images/close.png")',
      });
    }).click(function(){
      self.closeDialog();
    });
    $("#intentlyShareInvite:hover").css({
      "background-color":"#41943f"
    });
    $("#intentlyShareInvite").click(function(){
      self.selectEmails();
    });
    $('#intentlyShareFacebookTrigger').click(function(){
      var leftPosition, topPosition, width = 600, height = 600;
      //Allow for borders.
      leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
      //Allow for title and status bars.
      topPosition = (window.screen.height / 2) - ((height / 2) + 50);
      var windowFeatures = "status=no,height=" + height + ",width=" + width + ",resizable=yes,left=" + leftPosition + ",top=" + topPosition + ",screenX=" + leftPosition + ",screenY=" + topPosition + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no";
      window.open(app.config.get_base_api() + "channelresources/sharetofb/" + self.image._id,'sharer', windowFeatures);
      self.closeDialog();
    });
  },

  populateFriends: function(substr){
    var self = this;
    var el = $("#intentlyShareFriendsList");
    var substrLower = substr.toLowerCase();
    el.html("");
    console.log("Friends:", this.friends);
    this.friends.filter(function(friend){
      console.log("Friend:",friend);
      var name = friend.fullName.toLowerCase() + friend.username.toLowerCase();
      if(name.indexOf(substrLower)!= -1){
        self.appendFriend(friend,el);
        return true;
      }
      return false;
    });
  },

  appendFriend: function(friend,el){
    console.log("Adding Friend");
    console.log("Target element:", el);
    var self = this;
    var html = "<div class='intentlyFriend' id='user-" + friend.username + "'><div id='" + friend.username +
      "' class='avatar'></div><div class='intentlyUserName'>" +
      friend.fullName + "</div><div class='intentlyUserTitle'>@" +
      friend.username + "</div></div>";
    console.log("Friend element", html);
    el.append(html);
    var friendPanel = $("#" + friend.username);
    var friendIcon = "intentlyAvatar.png";
    if(friend.cdnFileName!==""){
      friendIcon = friend.cdnFileName;
    }
    friendPanel.css({
      "background-image":"url('https://dk3wu32ros038.cloudfront.net/avatar/" + friendIcon + "')"
    });
    if(el.attr("id") == "intentlyShareFriendsList"){
      console.log("bound click event");
      $("#user-" + friend.username).click(function(){self.selectFriend(friend);});
    }
  },

  fetchFriends: function(){
    var self = this;
    console.log("Connections:",app.user.connections);
    if(app.user.connections.length !== 0){
      $.each(app.user.connections.models,function(id,friend){
        console.log("Connection:", friend);
        console.log("Connection JSON:", friend.toJSON());
        self.friends.push(friend.toJSON());
        self.appendFriend(friend.toJSON(),$("#intentlyShareFriendsList"));
      });
    }
  },

  transitionEmail: function(){
    $("#intentlyShareSearch").addClass("intentlyShareSearchEmail").removeClass("intentlyShareSearchEmailHidden");
    $("#intentlyShareInvite").removeClass("hidden");
    $("#intentlyShareInvite").removeClass("intentlyShareInviteHidden").addClass("intentlyShareInviteShown").html("Invite");
    $("#intentlyShareFriendsList").addClass("hidden");
  },

  transitionFriend: function(){
    $("#intentlyShareSearch").removeClass("intentlyShareSearchEmail").addClass("intentlyShareSearchEmailHidden");
    $("#intentlyShareInvite").addClass("hidden");
    $("#intentlyShareInvite").addClass("intentlyShareInviteHidden").removeClass("intentlyShareInviteShown").html("");
    $("#intentlyShareFriendsList").removeClass("hidden");
  },

  selectFriend: function (friend){
    var self = this;
    var el = $("#intentlySharedCard");
    var message = "";
    console.log("Friend:",JSON.stringify(friend));
    $("#intentlyShareSearchBar").addClass("hidden");
    $("#intentlyShareFriendsList").remove();
    $("#intentlyShareFacebookTrigger").remove();
    this.appendFriend(friend,el);
    el.append(
      "<div id='intentlyCustomMessage'><textarea rows='5' id='intentlyShareCustomMessage'></textarea></div>" +
      "<div class='intentlyShareButton'>Send</div>"
    );
    $("#intentlyShareCustomMessage").on("keyup",function(){
      var count = $("#intentlyShareCustomMessage").val().split("").length;
      if(count>255){
        $("#intentlyShareCustomMessage").addClass("intentlyOverage");
      }else{
        $("#intentlyShareCustomMessage").removeClass("intentlyOverage");
      }
    });
    var data = {};
    $(".intentlyShareButton").click(function(){
      self.intention.share_intention(friend._id, $('#intentlyShareCustomMessage').val());
      self.closeDialog();
    });
  },

  selectEmails: function(){
    var self = this;
    var el = $("#intentlySharedCard");
    var message = "";
    var data = {};
    var emailList = this.emails.join(",");
    $("#intentlyShareSearchBar").remove();
    $("#intentlyShareFriendsList").remove();
    $("#intentlyShareFacebookTrigger").remove();
    var html = "<div class='intentlyFriend'><div class='avatar'><i class='fa fa-envelope-o fs36'></i></div><div class='intentlyUserName'>" +
      emailList + "</div></div>";
    el.append(html);
    el.append(
      "<div id='intentlyCustomMessage'><textarea rows='5' id='intentlyShareCustomMessage'></textarea></div>" +
      "<div class='intentlyShareInvite'>Send Invitation</div>"
    );
    $("#intentlyShareCustomMessage").on("keyup",function(){
      var count = $("#intentlyShareCustomMessage").val().split("").length;
      if(count>255){
        $("#intentlyShareCustomMessage").addClass("intentlyOverage");
      }else{
        $("#intentlyShareCustomMessage").removeClass("intentlyOverage");
      }
    });
    console.log("Emails:", emailList);
    $(".intentlyShareInvite").click(function(){
      data = {customMessage:$('#intentlyShareCustomMessage').val(),emailAddresses:emailList};
      $.post(app.config.get_base_api() + 'invites/emailinvite/', $.param(data, true), function(response) {
        console.log(response);
        self.closeDialog();
      });
    });
  },

  formatEmail: function(str,search,replacement){
    return str.replace(new RegExp(search, 'g'), replacement);
  },

  extractEmails: function(str){
    return str.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
  },

  closeDialog: function(){
    $("#" + this.dialogID).remove();
  },

  validateEmail: function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email.trim());
  }
};
