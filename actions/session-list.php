<?php
require_once dirname(__FILE__) . "/../config/config.inc.php";

session_start();

$result = array();

try {

    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        throw new Exception("Unauthorized");
    }
    
    if (!isset($_SESSION['user']) || ! $_SESSION['user'] || 
        !filter_var($_SESSION['user'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Teacher user name is not set or it is not an email address");
    }    
    
    $teacher = strtolower($_SESSION['user']);
    
    $zip = new ZipArchive;
    
    $sessionDirectory = $CONFIG['data_path'] . "/$teacher/" . $CONFIG['session_folder'];
    
    @mkdir($sessionDirectory); // Try to create if still missing
    
    if (!is_dir($sessionDirectory)) throw new Exception("Can't access session directory");
    
    $sessions = scandir($sessionDirectory);

    $list = array();
    foreach ($sessions as $name) {
        if (!is_dir($sessionDirectory . "/" . $name)) continue;  // skip files
        if ($name[0] == ".") continue; // skip hidden items
        $list[] = $name;
    }

    $result['Result'] = "OK";
    $result['Data'] = $list;
    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>