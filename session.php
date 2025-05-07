<?php
    // Load configuration
    include_once(dirname(__FILE__) . "/config/config.inc.php");
    
    header('Content-Type: text/html; charset=utf-8');

    if (isset($CONFIG['php_session_timeout']) && $CONFIG['php_session_timeout'] > 0) {
        // Set the maxlifetime of session
        ini_set("session.gc_maxlifetime",  $CONFIG['php_session_timeout']);
  
        // Also set the session cookie timeout to 0 (until the browser is closed)
        ini_set("session.cookie_lifetime", 0);
    }
   
    session_start();

    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        header('Location: login');
    }
    
    if (!isset($_SESSION['invitations'])) $_SESSION['invitations'] = json_encode(array());
    
    include('templates/session.html')
?>