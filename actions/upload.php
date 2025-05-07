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


    if (count($_FILES)==0 || $_FILES['file']['error'] != 0) throw new Exception("Error in file upload data");

    
    // Get temporary file path and original name
    
    // Temporary file name
    $tmpName = $_FILES['file']["tmp_name"];
    
    // Sanitize file name
    $fileName = $_FILES['file']['name'];
/*    
    $s = "";
    for ($i = 0; $i < strlen($fileName); $i++) {
        if (ord($fileName[$i]) >= 32) {
                $s = $s . $fileName[$i];
        }
    }
    $fileName = $s;    
*/    
    //$fileName = filter_var($fileName, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK|FILTER_FLAG_NO_ENCODE_QUOTES);
    $fileName = filter_var($fileName, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK);

    
    $fileName = str_replace(array('\\','/','#',':',';','*','?','|','!','$','%','~','=','>','<',']','[','}','{'), "", $fileName);
    
    if ($fileName != $_FILES['file']['name']) throw new Exception("The supplied file name contains invalid characters");
    
    // Get filename parts and check il the extension is allowed
    $parts = pathinfo($fileName);
    $extension = strtolower(@$parts['extension']);
    if (!in_array($extension, $CONFIG["valid_extensions"])) throw new Exception("Wrong file type");
    
    if (mb_strlen($fileName) - mb_strlen($extension) == 0) throw new Exception("The supplied file name is invalid");
    
    if (file_exists($workingDirectory . "/" . $fileName)) throw new Exception("File already exists");
    
    $done = @move_uploaded_file($tmpName, $workingDirectory . "/" . $fileName);
    
    if (!$done) throw new Exception("Can't copy '$fileName' in the teacher work directory");
    
    $result['Result'] = "OK";
    $result['File'] =  $fileName;
    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>
