<?php
    session_start();

    $_SESSION = array(); // Unset all of the session variables.

    // If it's desired to kill the session, also delete the session cookie.
    // Note: This will destroy the session, and not just the session data!
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    // Finally, destroy the session.
    session_destroy();
?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  <meta name="description" content="ReBooth (REmote BOOTH) is a WebRTC based platform for conference interpreter training">
  <meta name="keywords" content="interpreter,interpreters,interpreting,interpretation,simultaneous,consecutive,training,webrtc,conference,conference interpretation,interpretation booth">
  
  <title>ReBooth</title>
  
  <!-- favicon for all devices -->
  <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16x16.png">
  <link rel="manifest" href="/images/icons/site.webmanifest">
  <link rel="mask-icon" href="/images/icons/safari-pinned-tab.svg" color="#5bbad5">
  <link rel="shortcut icon" href="/images/icons/favicon.ico">
  
  <!-- JQuery -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" integrity="sha512-bLT0Qm9VnAYZDflyKcBaQ2gg0hSYNQrJ8RilYldYQ1FxQYoCLtUjuuRuZo+fjqhx/qtq/1itJ0C2ejDxltZVFg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  
  <!-- Bootstrap 4.x -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.min.js" integrity="sha384-+sLIOodYLS7CIrQpBjl+C7nPvqq+FbNUBDunl/OZv93DB7Ln/533i8e/mZXLi/P+" crossorigin="anonymous"></script>
  
  <!-- ReBooth -->  
  <script src="config/config.js?0.01"></script>
  <script src="js/rebooth.js?0.02"></script>
  
<style>
body {
    background-image: url("images/logo.png");
    background-repeat: no-repeat;
}
.credits {
    font-size: 0.8rem;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";    
}
</style>
  
<script>
$(document).ready(function() {

    // Set title
    $('#application-name').html(AppName + " v" + AppVersion);
    
    $('#version').html('[ ' + AppName + ' v' + AppVersion + ' &dash; clone it from <a target="_blank" href="' + AppGitHub + '">GitHub</a> ]');
    $('#author').html("By " + AppAuthorShort + " and " + AppContributorsShort + " &dash; " + AppCompanyShort);
});
</script>

</head>
<body>

  
  
  
  <div class="container-fluid">
  

    <div class="row mt-4">
      <div class="col-sm-2"></div>
      <div class="mx-auto col-sm-8 bp-4">
      
  
  
        <div class="card bg-light mt-2">
          <div class="card-header">
              <div class="display-4"><span id="application-name"></span></div>
          </div>
          <div class="card-body">
            <h5 class="card-title">You've successfully logged out</h5>
            
          </div>
          <div class="card-footer text-right">
            <a class="btn btn-primary" href="/" id="logout">Login again</a>
          </div>
        </div>  
      </div>
      <div class="col-sm-2"></div>
    </div>
  
  
  <div style="position: absolute; bottom: 2; left:10; right:10; width: vw" class="d-flex justify-content-between bg-light">
    <div id="version" class="credits"></div>
    <div class="credits"><span id="author"></span> &#128073; <a href="/credits">credits</a></div>
  </div>
  
  
 
  </div>  
  
  
  
  
  
  
</body>
</html>
