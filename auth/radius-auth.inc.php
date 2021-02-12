<?php

const MyRadiusServerAddress = "127.0.0.1";
const MyRadiusSharedSecret  = "this is your shared secret";
const MyRadiusTimeout       = 2;
const MyRadiusRerty         = 1;
const MyRadiusPort          = 0; // 0=auto

function radiusAuth($u, $p) {

    $radius = radius_auth_open();
    radius_add_server($radius, MyRadiusServerAddress, MyRadiusPort, MyRadiusSharedSecret, MyRadiusTimeout, MyRadiusRerty);
    radius_create_request($radius, RADIUS_ACCESS_REQUEST);
    radius_put_attr($radius, RADIUS_USER_NAME, $u);
    radius_put_attr($radius, RADIUS_USER_PASSWORD, $p);

    $result = radius_send_request($radius);

    $retval = false;

    switch ($result) {
    case RADIUS_ACCESS_ACCEPT: // User authentication successful
        $retval = true;
        break;
    case RADIUS_ACCESS_REJECT: // User authentication failed
        $retval = false;
        break;
    case RADIUS_ACCESS_CHALLENGE: // Further info required (error?)
        $retval = false;
        throw new Exception('RADIUS server requires further information in another Access-Request before authenticating the user');
        break;
    default: // Other error
        $retval = false;
        throw new Exception('A RADIUS error has occurred: ' . radius_strerror($radius));
        break;
    }
    return $retval;
}

?>