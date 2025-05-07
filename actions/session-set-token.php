<?php
//
// This script can be used via POST
//
// It sets a session token to allow only authenticated booths to store
// or load data from this server
//
// Parameters
//    token: a numerical ID
//
// Session token is initialized when the class session page is loaded, 
// and stored on the server with this script when the class starts to
// prevent unauthorized uploads/downloads from the booths (or from
// a malicious script).
// It is removed from the server when the teacher logs out and the 
// class session page is closed (or reloaded, in which case it's also
// re-initialized)


require_once dirname(__FILE__) . "/../config/config.inc.php";

require_once "lib.inc.php";


session_start();

$result = array();

try {
    
    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        throw new Exception("401"); // Unauthorized
    }


    // Get teacher and class code from session
    $teacher = isset($_SESSION['user']) ? $_SESSION['user'] : null;
    $classCode = isset($_SESSION['classCode']) ? $_SESSION['classCode'] : "";
    
    // Get token value from POST
    $token = isset($_POST['token']) ? $_POST['token'] : null;

    // Get members value from POST
    $members = isset($_POST['members']) && is_array($_POST['members']) ? $_POST['members'] : array();
    

    // Teacher user name must be stored into _SESSION  vars an email address
    if (!$teacher || !filter_var($teacher, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("401"); // Forbidden
    }
    $teacher = strtolower($teacher);

    // Class code, if any, must be stored into _SESSION vars as an integer
    if ($classCode && !filter_var($classCode, FILTER_VALIDATE_INT)) {
        throw new Exception("400"); // Bad request
    }     

    // Token is a PIN: [0-9]+
    if (!$token || !filter_var($token, FILTER_VALIDATE_REGEXP, array("options"=>array("regexp"=>"/^[0-9]+$/")))) {
        throw new Exception("400"); // Bad request
    }
    
    // Members is an array of PINS
    foreach ($members as $m) {
        if (!filter_var($m, FILTER_VALIDATE_REGEXP, array("options"=>array("regexp"=>"/^[0-9]+$/"))))
            throw new Exception("400"); // Bad request
    }
    

    $dataPath = $CONFIG['data_path'] . "/$teacher";
    $filePath = "$dataPath/session$classCode.token";
    
    error_log("Teacher $teacher wants to create file '$filePath' with content " . json_encode(array("token" => $token, "members" => $members)) );
    
    
    // Data dir must be writeable
    if (!is_writable($dataPath)) throw new Exception("403"); // forbidden

    // Session file must be writeable (if it exists)
    if (file_exists($filePath) && !is_writable($filePath)) throw new Exception("403"); // forbidden
    
    $b = file_put_contents($filePath, json_encode(array("token" => $token, "members" => $members), JSON_PRETTY_PRINT) );
    
    
    if (file_exists($filePath) && $b) {
        error_log("File '$filePath' has been created");
    } else {
        error_log("File '$filePath' has *NOT* been created");
    }
    
    if ($b === false) throw new Exception("401"); // Unauthorized
    
    $result['Result'] = "OK";

} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);
?>