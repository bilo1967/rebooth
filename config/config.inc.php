<?php
    $CONFIG = array(

        /***************/ 
        /*             */ 
        /* Invitations */
        /*             */ 
        /***************/ 
        
        // Used to generate consistent times in invitations
        "timezone"             => "Europe/Rome",

        // Set this to the actual booth url: it is used to generate invitations emails
        "booth_url"            => 'https://your.site/booth',

        // This will be set as the sender in invitation emails
        "email_sender"     => "noreply@your.site",


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
        "valid_extensions"     => array( 'wav', 'webm', 'mp3', 'ogg', 'mpeg3'),
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

        "auth_module"               => 'dummy-auth.inc.php',
        "auth_function"             => 'dummyAuth',
        "auth_description"          => 'Under development - insert any formally valid email address and the suggested password "apriti sesamo" to log in',
        "auth_username_placeholder" => 'Insert an email address as a username',
        "auth_password_placeholder" => 'Type any password',


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
        


        // Do not change anything below this line
        "end_of_list"      => true
    );
?>