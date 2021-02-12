<?php

require_once dirname(__FILE__) . "/../config/config.inc.php";

$pwdfile = $CONFIG['data_path'] . "/rebooth.guests.json";

function guestAuth($u, $p) {
    global $pwdfile;

    if (!filter_var($u . '.a', FILTER_VALIDATE_EMAIL)) return false;

    $content = @file_get_contents($pwdfile);
    $users = ($content == false) ? array() : json_decode($content, true);

    if (!isset($users[$u])) return false;

    return password_verify($p, $users[$u]['hash']) ? true : false;
}

?>
