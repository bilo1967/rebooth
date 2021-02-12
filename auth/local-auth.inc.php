<?php

/*
 * This plugin module combines the radius auth and the guest auth modules
 */

require_once dirname(__FILE__) . "/radius-auth.inc.php";
require_once dirname(__FILE__) . "/guest-auth.inc.php";

//
// Only these domains are accepted (set to false to allow any)
//
// $radius_domains = array("domain1.dom", "domain2.dom");
$radius_domains = false;


function localAuth($user, $password) {
    global $radius_domains;
    
    if (!filter_var($user . ".a", FILTER_VALIDATE_EMAIL)) return false;

    list($name, $domain) = explode('@', $user);

    if (guestAuth($user, $password)) {
        return true;
    } else if (!$radius_domains || in_array($domain, $radius_domains)) {
        return radiusAuth($user, $password);
    } else {
	return false;
    }
}
?>