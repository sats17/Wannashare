function fileSentToast(){
    var x = document.getElementById("FileSentToast");
    x.classList.add("show");
    setTimeout(function(){
      x.classList.remove("show");
    },1000);
  }
  function fileReceiveToast(){
    var x = document.getElementById("FileRecieveToast");
    x.classList.add("show");
    setTimeout(function(){
      x.classList.remove("show");
    },1000);
  }
  
  function readToast(){
    var x = document.getElementById("WaitMessageToast");
    x.classList.add("show");
    setTimeout(function(){
      x.classList.remove("show");
    },1000);
  }
  
  function roomFullToast(){
    var x = document.getElementById("RoomFullToast");
    x.classList.add("show");
    setTimeout(function(){
      x.classList.remove("show");
    },1000);
  }
  
  function notAcceptableToast(){
    var x = document.getElementById("NotAcceptable");
    x.classList.add("show");
    setTimeout(function(){
      x.classList.remove("show");
    },1000);
  }
  
  function connectionRequestToast(){
    var x = document.getElementById("ConnectionRequest");
    x.classList.add("show");
    setTimeout(function(){
      x.classList.remove("show");
    },5000);
  }

  function Toast(message) {
    var x = document.getElementById(message);
    x.classList.add("show");
    setTimeout(function(){
      x.classList.remove("show");
    },5000);
  }