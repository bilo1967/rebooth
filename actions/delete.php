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

    // Create user directory if it does not exist
    $user = strtolower($_SESSION['user']);
    $workingDirectory = $CONFIG['data_path'] . "/$user";
    @mkdir($workingDirectory);
    if (!is_dir($workingDirectory)) throw new Exception("Can't create working directory");
    if (!is_writable($workingDirectory)) throw new Exception("Working directory is not writable");

    if (!isset($_POST['file'])) throw new Exception("No file name supplied");
    
    // Sanitize file name
    $fileName = $_POST['file'];
    // $fileName = filter_var($fileName, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK);
    $fileName = filter_var($fileName, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK);
    
    $fileName = str_replace(array('\\','/','#',':',';','*','?','|','!','$','%','~','=','>','<',']','[','}','{'), "", $fileName);
    
    if ($fileName != $_POST['file']) throw new Exception("The supplied file name contains invalid characters");
    
    if (!file_exists($workingDirectory . "/" . $fileName)) throw new Exception("File '$fileName' not found");
    
    $done = unlink($workingDirectory . "/" . $fileName);
    
    if (!$done) throw new Exception("Can't delete file '$fileName'");
    
    $result['Result'] = "OK";
    $result['Data'] =  $fileName;
    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>
