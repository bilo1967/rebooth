<?php
// Load configuration
include_once dirname(__FILE__) . "/config/config.inc.php";

header('Content-Type: text/html; charset=utf-8');

if (isset($CONFIG['php_session_timeout']) && $CONFIG['php_session_timeout'] > 0) {
    // Set the maxlifetime of session
    ini_set("session.gc_maxlifetime",  $CONFIG['php_session_timeout']);

    // Also set the session cookie timeout to 0 (until the browser is closed)
    ini_set("session.cookie_lifetime", 0);
}

session_start();

$errMsg = false;

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
    
    if (! $you_are_not_a_robot) {    
        $errMsg = 'Please, fill the captcha at bottom';
    }
    
    if (!$errMsg && class_exists("Redis") && $CONFIG['auth_rate_limiter']) {
        include_once dirname(__FILE__) . "/auth/RateLimiter/StorageInterface.php";
        include_once dirname(__FILE__) . "/auth/RateLimiter/RedisStorage.php";
        include_once dirname(__FILE__) . "/auth/RateLimiter/RateLimiter.php";

        $redis = new Redis();
        $redis->connect(
            $CONFIG['auth_rate_redis_addr'] ?? '127.0.0.1',
            $CONFIG['auth_rate_redis_port'] ?? 6379
        );
        
        $storage = new RedisStorage($redis);

        // Allow maximum 10 requests in 60 seconds.
        $rateLimitter = new RateLimiter( [
            'refillPeriod' => $CONFIG['auth_rate_refill_period'],
            'maxCapacity' => $CONFIG['auth_rate_max_capacity'],
            'prefix' => 'rebooth.ratelimiter',
        ], $storage);

        if (! $rateLimitter->check($_SERVER['REMOTE_ADDR'])) {
            $errMsg = "You're trying to authenticate too fast";
        }
    }


    if (!$errMsg) {
        include_once dirname(__FILE__) . "/auth/" . $CONFIG['auth_module'];

        $user = !empty(trim($_POST['user'])) ? trim($_POST['user']) : '';
        $pass = !empty(trim($_POST['pass'])) ? trim($_POST['pass']) : '';

        $user = strtolower($user); // usernames are case insensitive

        $_SESSION['login'] = true; 
        $_SESSION['user']  = null;

        if (filter_var($user . ".a", FILTER_VALIDATE_EMAIL) && $CONFIG['auth_function']($user, $pass)) {
            // Variabili di sessione
            $_SESSION['login'] = true;
            $_SESSION['user']  = strtolower($user);

            // File and directory creation mask
            umask($CONFIG['umask'] ?? 00007);

            // User is authenticated: we create a personal
            // working directory (if it does not exist) with
            // session and temp subdirectories
            $perm = $CONFIG['folder_mode'] ?? 00777; // Folder permissions

            $home = $CONFIG['data_path'] . "/$user/" . $CONFIG['session_folder'];
            @mkdir($home, $perm, true);
            if (!is_dir($home)) throw new Exception("Can't create working directory '$home' for $user");
            if (!is_writable($home)) throw new Exception("$user working directory is not writable"); 

            // We also create the log directory
            $log = $CONFIG['data_path'] . "/$user/" . $CONFIG['log_folder'];
            @mkdir($log, $perm, true);
            if (!is_dir($log)) throw new Exception("Can't create log directory for $user");
            if (!is_writable($log)) throw new Exception("$user log directory is not writable");

            // We also create temp directory and delete all files
            $temp = $CONFIG['data_path'] . "/$user/" . $CONFIG['temp_folder'];
            @mkdir($temp, $perm, true);
            if (!is_dir($temp)) throw new Exception("Can't create temp directory for $user");
            if (!is_writable($temp)) throw new Exception("$user temp directory is not writable");
            $files = glob($temp . '/*'); // get all file names
            foreach($files as $file){ // iterate files
                if(is_file($file)) {
                    $ok = @unlink($file); // delete file
                    if (!$ok) throw new Exception("Can't delete files in $user's temp directory");
                }
            } 

            $errMsg = 'ok';

        } else {
            $_SESSION['login'] = false;
            $_SESSION['user']  = $user;

            $errMsg = 'Wrong user name or password';
        }        

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

  <meta name="description" content="ReBooth (REmote BOOTH) is a WebRTC based platform for conference interpreter training">
  <meta name="keywords" content="interpreter,interpreters,interpreting,interpretation,simultaneous,consecutive,training,webrtc,conference,conference interpretation,interpretation booth">

  <title>ReBooth:login</title>

  <!-- favicon for all devices -->
  <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16x16.png">
  <link rel="manifest" href="/images/icons/site.webmanifest">
  <link rel="mask-icon" href="/images/icons/safari-pinned-tab.svg" color="#5bbad5">
  <link rel="shortcut icon" href="/images/icons/favicon.ico">


  <!-- FontAwesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/css/all.min.css" integrity="sha256-h20CPZ0QyXlBuAw7A+KluUYx/3pK+c7lYEpqLTlxjYQ=" crossorigin="anonymous" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/js/fontawesome.min.js" integrity="sha256-NP9NujdEzS5m4ZxvNqkcbxyHB0dTRy9hG13RwTVBGwo=" crossorigin="anonymous"></script>  

  <!-- JQuery -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" integrity="sha512-bLT0Qm9VnAYZDflyKcBaQ2gg0hSYNQrJ8RilYldYQ1FxQYoCLtUjuuRuZo+fjqhx/qtq/1itJ0C2ejDxltZVFg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  
  <!-- Bootstrap 4.x -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.min.js" integrity="sha384-+sLIOodYLS7CIrQpBjl+C7nPvqq+FbNUBDunl/OZv93DB7Ln/533i8e/mZXLi/P+" crossorigin="anonymous"></script>

  <!-- Google reCaptcha -->
  <script src='https://www.google.com/recaptcha/api.js'></script>

  <!-- ReBooth -->
  <link rel="stylesheet" href="css/rebooth.css?v0.1">
  <script src="js/utils.js"></script>
  <script src="config/config.js?0.03"></script> 
  <script src="js/rebooth.js?0.03"></script>


<!-- Local styles -->
<style>
body {
    background-image: url("images/logo.png");
    background-repeat: no-repeat;
}
.credits {
    font-size: 0.8rem;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";    
    background-color: rgba(255, 255, 255, 0.75);
}
</style>

<!-- Local scripts -->
<script>
$(document).ready(function(){
    $('#version').html('[ ' + AppName + ' v' + AppVersion + ' &dash; clone it from <a target="_blank" href="' + AppGitHub + '">GitHub</a> ]');
    $('#author').html("By " + AppAuthorShort + " and " + AppContributorsShort + " &dash; " + AppCompanyShort);



    $('#show-password').on('mousedown', function() {
        $('#show-password > i').removeClass('fa-eye').addClass('fa-eye-slash');
        $('#pass').attr('type', 'text');
    });

    $('#show-password').on('mouseup', function() {
        $('#show-password > i').removeClass('fa-eye-slash').addClass('fa-eye');
        $('#pass').attr('type', 'password');
    });
    $('#show-password').on('mouseleave', function() {
        $('#show-password > i').removeClass('fa-eye-slash').addClass('fa-eye');
        $('#pass').attr('type', 'password');
    });

});
</script>

</head>
<body>

<br/>
<div class="container-fluid">


  <div class="display-3 text-center">ReBooth</div>

  <br/>

  <div class="row">
    <div class="col-sm-3"></div>

    <div class="mx-auto col-sm-6 border rounded border-primary pl-4 pr-4 pt-3 pb-0 bg-light">
      <h3 class="" style="text-align: center">Login</h3>
<?php
  if ($errMsg) {
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
          <div class="input-group">
            <input type="password" class="form-control" id="pass" name="pass" placeholder="<?=$CONFIG['auth_password_placeholder']?>">
            <div class="input-group-append ">
              <div class="input-group-text unselectable cursor-pointer" style="width:2.75rem" id="show-password">
                <i class="far fa-eye"></i>
              </div>
            </div>
          </div>
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

  <div style="position: absolute; bottom: 2; left:10; right:10; width: vw" class="d-flex justify-content-between">
    <div id="version" class="credits"></div>
    <div class="credits"><span id="author"></span> &#128073; <a href="/credits">credits</a></div>
  </div>
</div>
</body>
</html>
