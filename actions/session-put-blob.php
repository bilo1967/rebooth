<?php

//
// Used by booths to store their recordings on the server
//
// Parameters by POST
//
// teacher: 
//     teacher's user name. Formally an email.
// classCode: 
//     current class code. May be not set if teacher has not specified a class code
// student:
//     student's user name. Formally an email.
// pin:
//     pin of the student's booth
// session:
//     current recording session id
// token:
//     current security token. Booths receive this token by the teacher upon connection.
// blob:
//     a file with booth's audio recording
//

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

    // Booth pin is a PIN
    if (!isset($_POST['pin']) || !filter_var($_POST['pin'], FILTER_VALIDATE_REGEXP, array("options" => array("regexp" => "/^[0-9]+$/")))) {
        throw new Exception("Booth pin contains invalid characters"); // Unauthorized
    }
    
    // classCode is an integer
    if (isset($_POST['classCode']) && $_POST['classCode'] && filter_var($_POST['classCode'], FILTER_VALIDATE_INT) === false) {
        throw new Exception("Invalid characters in class code " . $_POST['classCode']);
    }

    // Session token is a PIN
    if (!isset($_POST['token']) || !filter_var($_POST['token'], FILTER_VALIDATE_REGEXP, array("options" => array("regexp" => "/^[0-9]+$/")))) {
        throw new Exception("Invalid security token"); // Unauthorized
    }
    
    $teacher   = strtolower($_POST['teacher']);
    $student   = $_POST['student'];
    $session   = $_POST['session'];
    $token     = $_POST['token'];
    $pin       = $_POST['pin'];
    $classCode = isset($_POST['classCode']) ? $_POST['classCode'] : "";


    // Check if token file exists
    if (!file_exists($CONFIG['data_path'] . "/$teacher/session$classCode.token")) {
        error_log("Token file '" . $CONFIG['data_path'] . "/$teacher/session$classCode.token' does not exist");
    } else {
        error_log("Token file exists");
    }


    // Check if booth is part of the class and has the security token 
    $reg = @json_decode(file_get_contents($CONFIG['data_path'] . "/$teacher/session$classCode.token"));
    if (@($reg->token != $token) || !@in_array($pin, $reg->members) ) {
//      throw new Exception("You're not authorized to store you recordings on this server"); // Unauthorized
        error_log("Booth $student/$pin is *NOT AUTHORIZED* to store his/her recordings on this server. Token file is '" . $CONFIG['data_path'] . "/$teacher/session$classCode.token'. Security token is $token" );
    } else {
        error_log("Booth $student/$pin is authorized to store his/her recordings on this server. Token file is '" . $CONFIG['data_path'] . "/$teacher/session$classCode.token'. Security token is $token" );
        
    }
    
    // Teacher working directory must exist
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
    $tmpName = $_FILES['blob']["tmp_name"];

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
