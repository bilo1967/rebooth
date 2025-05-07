<?php
    $CONFIG = array(

        /***************/ 
        /*             */ 
        /* Invitations */
        /*             */ 
        /***************/ 
        
        "send_invitations"     => true,
        // Used to generate consistent times in invitations
        "timezone"             => "Europe/Rome",

        // Set this to the actual booth url: it is used to generate invitations emails
        "booth_url"            => 'https://your.site/booth',

        // This will be set as the sender in invitation emails
        "email_sender"         => "noreply@your.site",

        /****************/
        /*              */ 
        /* File storage */
        /*              */ 
        /****************/

        // This is the directory where rebooth stores data, audio files and recordings
        // It must be writeable by your web server
        "data_path"            => "/var/www/whatever/.../data",
        
        // Do not change these values unless yo know what you are doing
        "session_folder"       => "sessions",   // Teacher's sessions subdirectory directory
        "temp_folder"          => "tmp",        // Teacher's temp subdirectory directory
        "log_folder"           => "log",        // Javascript console debug log folder (in Teachers profile folder)
        "session_prefix"       => "rs-",

        "valid_extensions"     => array( 'wav', 'mp3', 'ogg', 'mkv', 'mpeg3', 'm4a', 'm4v', 'mp4'),
        "forbidden_extensions" => array( 'exe', 'msi', 'com', 'bat', 'vbs', 'vba', 'lnk', 'app', 'dmg'),

        /********************************/
        /*                              */
        /* PHPMailer SMTP configuration */
        /*                              */
        /********************************/
        
        "smtp_host"        => "smtp.your.site",         // Your SMTP host
        "smtp_user"        => 'smtpuser@your.site.it',  // Your SMTP user
        "smtp_pass"        => 'smtppassword',           // Your SMTP password
        "smtp_auth"        => true,
        "smtp_port"        => 587,        
        "smtp_encryption"  => 'STARTTLS', 

        /*************************/
        /*                       */
        /* Authentication module */
        /*                       */
        /*************************/

        // In order to authenticate users (teachers) you need to write your own authentication
        // module (in PHP). This module must contain an authentication function accepting
        // the username and password as parameters and returning true if the authentication
        // succeeds, false otherwise. Put this module in the auth directory
        //
        // 'auth_module' is the filename of your own php authentication module 
        // 'auth_function' must contain the name the authentication function.
        //
        // 'auth_description' is the description which will be placed above the login form
        // 'auth_username_placeholder' and 'auth_password_placeholder' are the hints which
        // will be placed inside the the user name and password fields on the login form

        "auth_module"               => 'local-dit-auth.inc.php',
        "auth_function"             => 'localAuth',
        "auth_description"          => 'Login with your Bologna University credentials (or write to <a href="mailto:rebooth@dipintra.it?Subject=Guest account request">rebooth@dipintra.it</a> to get a guest account)',
        "auth_username_placeholder" => 'Insert your email address as a username',
        "auth_password_placeholder" => 'Type your password',

        /*******************************/
        /*                             */
        /* Authentication rate limiter */
        /*                             */
        /*******************************/

        // Set up a rate limit to authentication attempts. Can be user either together with
        // or in alternative to google captcha to mitigate brute force attacks against your
        // authentication service.
        // The implemented rate limit algorithm is "token bucket".
        // If auth_rate_limiter is set to on, your PHP setup must include the Redis module
        // (usually php_redis) and you must have a local Redis server. This is a standard
        // package for most linux distributions and some open source implementations are
        // available also for windows. 
        // auth_rate_limiter is silently set to false if the redis module is not installed.
        
        "auth_rate_limiter"         => false,       // set it to true to enable the rate limiter 
        "auth_rate_max_capacity"    => 10,          // number of attempts per refill period
        "auth_rate_refill_period"   => 60,          // time after which the attempt counter is restored
        "auth_rate_redis_addr"      => '127.0.0.1', // Redis server IP address (usually 127.0.0.1, if you have a local server)
        "auth_rate_redis_port"      => 6379,        // Redis server port (default is 6379)

        /*******************/
        /*                 */
        /* Google recapcha */
        /*                 */
        /*******************/

        // if google_recaptcha is set to false then no google recaptcha is shown in the login form
        // if set to true you have to set your V2 site key and secret key respectively in
        // google_recaptcha_site_key and google_recaptcha_secret_key parameters which are
        // otherwise ignored
        "google_recaptcha"            => false,
        "google_recaptcha_site_key"   => '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcd',
        "google_recaptcha_secret_key" => '0987654321abcdZYXWVUTSRQPONMLKJIHGFEDCBA',

        /*****************/
        /*               */
        /* PHP Settings  */
        /*               */
        /*****************/
        "php_session_keepalive"       => true,    // Use PHP session keepalive via AJAX call
        "php_session_timeout"         => 60*60,   // PHP Session Timeout in seconds, 0=default


        // Do not change anything below this line
        "end_of_list"      => true
    );
?>
