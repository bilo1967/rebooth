<?php
//
// This script can be used via POST
//
// It removes the session token by unlinking the file on which
// it is stored
//
// Parameters: none
//
// Session token is initialized when the class session page is loaded, 
// and stored on the server with this script when the class starts to
// prevent unauthorized uploads/downloads from the booths (or from
// a malicious script).
// It is removed from the server when the teacher logs out and the 
// class session page is closed (or reloaded, in which case it's also
// re-initialized)
// 
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
    

    // Teacher user name must be stored into _SESSION  vars an email address
    if (!$teacher || !filter_var($teacher, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("403"); // Forbidden
    }
    $teacher = strtolower($teacher);

    // Class code, if any, must be stored into _SESSION vars an integer
    if ($classCode && !filter_var($classCode, FILTER_VALIDATE_INT)) {
        throw new Exception("400"); // Bad request
    }     

    

    $dataPath = $CONFIG['data_path'] . "/$teacher";
    $filePath = "$dataPath/session$classCode.token";
    
    // File must exist and be readable
    if (!is_writable($dataPath)) throw new Exception("403"); // forbidden


error_log("Teacher $teacher wants to unlink the file '$filePath'");
    
    if (file_exists($filePath)) {
        $b = @unlink($filePath);
        if ($b === false) throw new Exception("400"); // bad request
error_log("File '$filePath' has been unlinked");
    }
    
    
    $result['Result'] = "OK";
    

} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);
?>
