<?php
    include_once(dirname(__FILE__) . "/config/config.inc.php");
    
    header('Content-Type: text/html; charset=utf-8');
    session_start();

    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        header('Location: login');
    }

?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  <title>ReBooth</title>

  <!-- favicon for all devices -->
  <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16x16.png">
  <link rel="manifest" href="/images/icons/site.webmanifest">
  <link rel="mask-icon" href="/images/icons/safari-pinned-tab.svg" color="#5bbad5">
  <link rel="shortcut icon" href="/images/icons/favicon.ico">

  
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

  <script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>  
  
<style>
</style>
  
<script src="js/utils.js"></script>
<link rel="stylesheet" href="css/rebooth.css?0.01">

<script src="config/config.js?0.01"></script>
<script src="js/rebooth.js?0.01"></script>
  
  
  
<script>



$(document).ready(function() {
    
    // Set title
    $('#application-name').html(AppName + " v" + AppVersion);

});

</script>

</head>
<body>
  <div class="container">
  
    <div class="card mt-2">
      <div class="card-header">
          <div class="display-3">Home</div>
      </div>
      <div class="card-body">
        <p>Main menu</p>
        <ul>
          <li><a href="setup">Set up a class</a>
          <li><a href="booth">Enter a booth</a>
          <li><a href="logout">Logout</a></li>
        </ul>
      </div>
      <div class="card-footer text-right">
      <span id="application-name"></span>
      </div>
          
    </div>  
  
 
  </div>
</body>
</html>
