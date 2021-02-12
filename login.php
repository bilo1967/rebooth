<?php
header('Content-Type: text/html; charset=utf-8');

session_start();

// Libreria per verificare un account UniBo tramite IMAP
include_once dirname(__FILE__) . "/config/config.inc.php";

$errMsg = '';

// Verify login
if (isset($_POST['login']) && !empty($_POST['login'])) {


    $you_are_not_a_robot = false;
    if ($CONFIG['google_recaptcha']) {
        if (isset($_POST['g-recaptcha-response']) && !empty($_POST['g-recaptcha-response'])) {
            //your site secret key
            $secret = $CONFIG['google_recaptcha_secret_key'];
            // get verify response data
            // https://www.google.com/recaptcha/admin
            $verifyResponse = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='
                                                . $secret . '&response='
                                                . $_POST['g-recaptcha-response'] );
                                                
            $responseData = json_decode($verifyResponse);
            $you_are_not_a_robot = $responseData->success;
        }
    } else {
        $you_are_not_a_robot = true;
    }
    
    
    if ($you_are_not_a_robot) {
        include_once dirname(__FILE__) . "/auth/" . $CONFIG['auth_module'];


        $user = !empty(trim($_POST['user'])) ? trim($_POST['user']) : '';
        $pass = !empty(trim($_POST['pass'])) ? trim($_POST['pass']) : '';        

        $_SESSION['login'] = true; 
        $_SESSION['user']  = null;
        
        if (filter_var($user . ".a", FILTER_VALIDATE_EMAIL) && $CONFIG['auth_function']($user, $pass)) {
            // Variabili di sessione
            $_SESSION['login'] = true;
            $_SESSION['user']  = strtolower($user);
            
            // User is authenticated: we create a personal
            // working directory (if it does not exist) with
            // session and temp subdirectories
            
            $home = $CONFIG['data_path'] . "/$user/" . $CONFIG['session_folder'];
            @mkdir($home, 0771, true);
            if (!is_dir($home)) throw new Exception("Can't create working directory '$home' for $user");
            if (!is_writable($home)) throw new Exception("$user working directory is not writable"); 
            
            // We also create temp directory and delete all files
            $temp = $CONFIG['data_path'] . "/$user/" . $CONFIG['temp_folder'];
            @mkdir($temp, 0771, true);
            if (!is_dir($temp)) throw new Exception("Can't create temp directory for $user");
            if (!is_writable($temp)) throw new Exception("$user temp directory is not writable");
            
            //$files = glob($temp); // get all file names
            //foreach($files as $file){ // iterate files
            //    if(is_file($file)) {
            //        $ok = @unlink($file); // delete file
            //        if (!$ok) throw new Exception("Can't delete files in $user's temp directory");
            //    }
            //} 
            
            $errMsg = 'ok';

        } else {
            $_SESSION['login'] = false;
            $_SESSION['user']  = $user;
            
            $errMsg = 'Wrong user name or password';
        }        
        
    } else {

        $errMsg = 'Please, fill the captcha at bottom';

    }



}
// Authenticated
if (@$_SESSION['login']) {
    header("location: /");
}
?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  
  <!-- favicon for all devices -->
  <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16x16.png">
  <link rel="manifest" href="/images/icons/site.webmanifest">
  <link rel="mask-icon" href="/images/icons/safari-pinned-tab.svg" color="#5bbad5">
  <link rel="shortcut icon" href="/images/icons/favicon.ico">

  
  <title>ReBooth:login</title>

  
  <script src="https://kit.fontawesome.com/ea65ac0a48.js"></script>
  
  
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

  <script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>  

  <!-- Google reCaptcha -->
  <script src='https://www.google.com/recaptcha/api.js'></script>


  <script src="js/bootstrap4-input-clearer.min.js"></script>
  <script src="js/utils.js"></script>

  <link rel="stylesheet" href="css/rebooth.css?v0.1">
  
  <script src="config/config.js?0.01"></script>  


<!-- Stili locali -->
<style>
body {
    background-image: url("images/logo.png");
    background-repeat: no-repeat;
}
</style>

<!-- Script locali -->
<script>
$(document).ready(function(){
});
</script>

</head>
<body>
<br/>

<br/>
<div class="container">


<div class="display-3 text-center">ReBooth</div>

<br/>

<div class="row">
  <div class="col-sm-3"></div>
  <div class="mx-auto col-sm-6 border rounded border-primary p-4" style="background: rgb(255,255,255)">
    <h3 class="" style="text-align: center">Login</h3>
<?php
  if ($errMsg != '') {
    echo '<br/><div class="mx-auto alert alert-danger">' . $errMsg . '</div>';
  }
?>
    <form action="" method="post">
      <legend><?=$CONFIG['auth_description']?></legend>
      <div class="form-group">
        <label for="user">User name:</label>
        <input type="text" class="form-control" name="user" placeholder="<?=$CONFIG['auth_username_placeholder']?>">
      </div>
      <div class="form-group">
        <label for="pass">Password:</label>
        <input type="password" class="form-control" id="pass" name="pass" placeholder="<?=$CONFIG['auth_password_placeholder']?>">
      </div>
      
<?php 
    if ($CONFIG['google_recaptcha']) {
?>
      <div class="row">
      <div class=" mx-auto g-recaptcha" data-sitekey="<?=$CONFIG['google_recaptcha_site_key']?>"></div>   
      </div>
<?php
    };
?>      
      <br/>
      <div  style="text-align: center">
      <input type="submit" name="login" id="login" class="mx-auto btn btn-primary" value="Login">
      </div>
    </form>
  </div>
  <div class="col-sm-3"></div>
</div>

</div>

<br/>
</body>
</html>
<?php


?>
