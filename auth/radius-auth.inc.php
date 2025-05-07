<?php

const RadiusTimeout     = 2; // seconds
const RadiusRetry       = 1;
const RadiusDefaultPort = 0; // 0=auto

const RadiusServers = [
    [ 
        "address" => "192.168.1.33",
        "secret"  => "avada kedavra",
        "port"    => RadiusDefaultPort
    ],
    [ 
        "address" => "192.168.1.34",
        "secret"  => "open sesame",
        "port"    => RadiusDefaultPort
    ],
    [ 
        "address" => "192.168.1.35",
        "secret"  => "drakaris",
        "port"    => RadiusDefaultPort
    ],
];

function radiusAuth($u, $p) {
    // Try all servers and throw an exception if they all fail
    for ($i = 0; $i < count(RadiusServers); $i++) {
        $isLast = ($i == count(RadiusServers) - 1);
        $server = RadiusServers[$i];
        try {
            $ok = radiusAuth0($u, $p, $server["address"], $server["port"], $server["secret"]);
            return $ok;
        } catch (Exception $e) {
            
            // Let's log server failure
            error_log("Radius server " . $server['address'] . " failed with error '" . $e->getMessage() . "'");
            
            if ($isLast) {
                error_log('All radius server have failed');
                throw new Exception('All radius server have failed');
            }
            
        }
    }
    return false;
}


function radiusAuth0($u, $p, $address, $port, $secret, $timeout = RadiusTimeout, $retry = RadiusRetry) {

    $radius = radius_auth_open();
    radius_add_server($radius, $address, $port, $secret, $timeout, $retry);
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
        throw new Exception(radius_strerror($radius));
        break;
    }
    return $retval;
}

?>