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

    // Teacher temp directory must exist
    $tempDirectory = $CONFIG['data_path'] . "/$user/" . $CONFIG['temp_folder'];
    if (!is_dir($tempDirectory)) throw new Exception("Recording storage directory does not exist");
    if (!is_writable($tempDirectory)) throw new Exception("Teacher's temp directory is not writeable");
    
    if (count($_FILES)==0 || $_FILES['file']['error'] != 0) throw new Exception("Error in uploaded file data");
    
    // Temporary file name
    $tmpName = $_FILES['file']["tmp_name"];    
    
    // Sanitize file name
    $fileName = $_FILES['file']['name'];
    $fileName = filter_var($fileName, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK);
    $fileName = str_replace(array('\\','/','#',':',';','*','?','|','!','$','%','~','=','>','<',']','[','}','{'), "", $fileName);
    if ($fileName != $_FILES['file']['name']) throw new Exception("The supplied file name contains invalid characters");
    
    // Get filename parts and check il the extension is allowed
    $parts = pathinfo($fileName);
    $extension = strtolower(@$parts['extension']);
    if (in_array($extension, $CONFIG["forbidden_extensions"])) throw new Exception("Wrong file type");    



    // Move temporary file path to student jobs directory    
    $done = @move_uploaded_file($tmpName, $tempDirectory . "/" . $fileName);
    
    if (!$done) throw new Exception("Can't copy '$fileName' in teacher's temp directory");
    
    $result['Result'] = "OK";
    $result['File'] =  $fileName;
    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>







