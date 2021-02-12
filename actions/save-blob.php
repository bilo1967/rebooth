<?php
require_once dirname(__FILE__) . "/../config/config.inc.php";

//session_start();

$result = array();

try {

    // Teacher user name must be an email address
    if (!isset($_POST['teacher']) || !filter_var($_POST['teacher'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Teacher user name is not set or it is not an email address");
    }

    // Student user name must be an email address or x@y
    if (!isset($_POST['student']) || !filter_var($_POST['student'] . ".ext", FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Student user name is not set or it is not an email address");
    }     

    // Recording session name must contain only letters, numbers or dashes
    if (!isset($_POST['session']) || !preg_match('/^[a-z0-9A-Z_.-]+$/', $_POST['session'])) {
        throw new Exception("Recording session name contains invalid characters");
    }     

    $teacher = strtolower($_POST['teacher']);
    $student = $_POST['student'];
    $session = $_POST['session'];
    
    // Teacher workin directory must exist
    $workingDirectory = $CONFIG['data_path'] . "/$teacher/" . $CONFIG['session_folder'];
    if (!is_dir($workingDirectory)) throw new Exception("Recording storage directory does not exist");
    if (!is_writable($workingDirectory)) throw new Exception("Recording storage directory is not writeable");
    
    // Create session subfolder
    $sessionDirectory = $workingDirectory . '/' . $session;
    @mkdir($sessionDirectory);
    if (!is_dir($sessionDirectory)) throw new Exception("Can't create student jobs directory");
    
    // File name is generated
    $fileName = $session . '-' . $student . '.webm';

    if (count($_FILES)==0 || $_FILES['blob']['error'] != 0) throw new Exception("Error in file upload data");

    // Temporary file name
    $tmpName = $_FILES['file']["tmp_name"];

    // Move temporary file path to student jobs directory    
    $done = @move_uploaded_file($tmpName, $sessionDirectory . "/" . $fileName);
    
    if (!$done) throw new Exception("Can't copy '$fileName' in the student jobs directory");
    
    $result['Result'] = "OK";
    $result['File'] =  $fileName;
    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>







