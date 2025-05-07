<?php

//
// Read an audio/media file from the theacher's directory
//
// Invoked either by teacher and by the booths.
//
// Teacher can use this script only if authenticated
// Booths need to know the security token sent bt the
// teacher and their pin must be part of the class
//
// Requests are received via POST:
//
// user: variable with the teacher user name since we've to access his/her
//       working directory. user is formally an email address
//
// file: the name of the file we need
//
// token: the current security token (only for booths)
// classCode: classCode for current class
// pin: the pin of the booth
//

require_once dirname(__FILE__) . "/../config/config.inc.php";

require_once "lib.inc.php";

session_start();

try {
    
    // If we're logged in we won't need a security token
    $authenticated = isset($_SESSION['login']) && $_SESSION['login'];
    
    // Fail if user and file are not both set
    if (!isset($_POST['user']) || !isset($_POST['file'])) throw new Exception("400"); // bad request
    
    // Check if the user (teacher) name is an email 
    if (!filter_var($_POST['user'], FILTER_VALIDATE_EMAIL)) throw new Exception("400"); // bad request
    $user = strtolower($_POST['user']);

    // Check if working directory exists
    $workingDirectory = $CONFIG['data_path'] . "/$user";
    if (!is_dir($workingDirectory)) throw new Exception("404"); // not found

    
    // If not authenticated, we check if session token file exists, get token value and check it against POST field
    if (!$authenticated) {
        // We're a booth...
        
        // classCode is an integer
        if (isset($_POST['classCode']) && $_POST['classCode'] && filter_var($_POST['classCode'], FILTER_VALIDATE_INT) === false) {
            throw new Exception("412"); // Precondition failed
        }
        
        // Session token is a PIN
        if (!isset($_POST['token']) || !filter_var($_POST['token'], FILTER_VALIDATE_REGEXP, array("options"=>array("regexp"=>"/^[0-9]+$/")))) {
            throw new Exception("403"); // Forbidden
        } 
        
        // Booth pin is a PIN
        if (!isset($_POST['pin']) || !filter_var($_POST['pin'], FILTER_VALIDATE_REGEXP, array("options" => array("regexp" => "/^[0-9]+$/")))) {
            throw new Exception("403"); // Forbidden
        }        

        $token     = $_POST['token'];
        $pin       = $_POST['pin'];
        $classCode = isset($_POST['classCode']) ? $_POST['classCode'] : "";


        // Check if token file exists
        if (!file_exists("$workingDirectory/session$classCode.token")) {
            error_log("Token file '$workingDirectory/session$classCode.token' does not exist");
        } else {
            error_log("Token file exists");
        }
        
        // Check if booth is part of the class and has the security token 
        $reg = @json_decode(file_get_contents("$workingDirectory/session$classCode.token"));
        if (@($reg->token != $token) || !@in_array($pin, $reg->members) ) {
            throw new Exception("401"); // Forbidden
            error_log("Booth with pin $pin and token $token is *NOT* authorized to read files");
        } else {
            error_log("Booth with pin $pin and token $token is authorized to access files");
        }
    
    } else {
        error_log("Teacher $user is authenticated and authorized to access files.");
    }
    
    
    
    

    // Sanitize file name and reject it if it contains invalid charachters
    $fileName = $_POST['file'];
    
    // Sanitize file name
    //$fileName = filter_var($fileName, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK);
    $fileName = filter_var($fileName, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK);

    $fileName = str_replace(array('\\','/','#',':',';','*','?','|','!','$','%','~','=','>','<',']','[','}','{'), "", $fileName);
    if ($fileName != $_POST['file']) throw new Exception("404"); // not found
    
    $filePath = $workingDirectory . "/" . $fileName;
    
    if (!file_exists($filePath)) throw new Exception("404"); // not found


    error_log("File $fileName exists and can be downloaded. Sending headers and data.");


    // Send generic headers - it should work also without headers
    header("Content-Type: application/octet-stream");
    header("Content-Disposition: attachment; filename=\"$fileName\"");
    header("Content-length: " . (string) (filesize($filePath)));
    header("Expires: " . gmdate("D, d M Y H:i:s", mktime(date("H") + 2, date("i"), date("s"), date("m"), date("d"), date("Y"))) . " GMT");
    header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
    header("Cache-Control: no-cache, must-revalidate");
    header("Pragma: no-cache");
    
    //readfile_chunked($filePath);
    readfile($filePath);

} catch(Exception $e) {
    // Errors are returned as standard HTTP response codes
    
    http_response_code(intval($e->getMessage()));
};
?>
