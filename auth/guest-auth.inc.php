<?php

require_once dirname(__FILE__) . "/../config/config.inc.php";

$pwdfile = $CONFIG['data_path'] . "/rebooth.guests.json";

function guestAuth($u, $p) {
    global $pwdfile;

    if (!filter_var($u . '.a', FILTER_VALIDATE_EMAIL)) return false;
    
    $u = strtolower($u);

    $content = @file_get_contents($pwdfile);
    $users = ($content == false) ? array() : json_decode($content, true);
    
    if (!isset($users[$u])) return false; // Guest account does not exist
    
    $expiry = isset($users[$u]['expiry']) ? $users[$u]['expiry'] : 0;
    if ($expiry < time()) {
        return false; // Guest account is expired
    }

    return password_verify($p, $users[$u]['hash']) ? true : false;
}

?>