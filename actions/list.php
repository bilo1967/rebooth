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
    
    $user = strtolower($_SESSION['user']);
    
    $workingDirectory = $CONFIG['data_path'] . "/$user";
    
    @mkdir($workingDirectory);
    
    if (!is_dir($workingDirectory)) throw new Exception("Can't create working directory");
    if (!is_writable($workingDirectory)) throw new Exception("Working directory is not writable");
    
    
    $files = scandir($workingDirectory);

    $list = array();
    foreach ($files as $name) {
        $file = $workingDirectory . "/" . $name;
        if (!is_file($file)) continue;    
        $parts = pathinfo($file);
        
        $extension = strtolower($parts['extension']);
        
        if (!in_array($extension, $CONFIG["valid_extensions"])) continue;
        
        $info["name"] = $name;
        $info["extension"] = $extension;
        $info["size"] = filesize($file);
//      $info["type"] = mime_content_type($file);
        
        $list[] = $info;
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