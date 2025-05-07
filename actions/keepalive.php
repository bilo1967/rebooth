<?php

//
// Session keepalive
//

include_once(dirname(__FILE__) . "/../config/config.inc.php"); // Load configuration

if (isset($CONFIG['php_session_keepalive']) && $CONFIG['php_session_keepalive'] == false) {
    exit(0);
}

if (isset($CONFIG['php_session_timeout']) && $CONFIG['php_session_timeout'] > 0) {
    // Set the maxlifetime of session
    ini_set("session.gc_maxlifetime",  $CONFIG['php_session_timeout']);

    // Also set the session cookie timeout to 0 (until the browser is closed)
    ini_set("session.cookie_lifetime", 0);
}

session_start();

if (! isset($_SESSION['KEEPALIVE'])) {
    $_SESSION['KEEPALIVE'] = 0;
}

$_SESSION['KEEPALIVE'] = $_SESSION['KEEPALIVE'] + 1;


?>