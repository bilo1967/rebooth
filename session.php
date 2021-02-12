<?php
    include_once(dirname(__FILE__) . "/config/config.inc.php");
    
    header('Content-Type: text/html; charset=utf-8');
    session_start();

    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        header('Location: login');
    }
    
    if (!isset($_SESSION['invitations'])) $_SESSION['invitations'] = json_encode(array());
    
    include('templates/session.html')
?>