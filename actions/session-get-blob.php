<?php
//
// This script can be used either with POST or GET
// It looks for a "student" recording file under a specified recording "session"
//
// Parameters
//    student: the student user name (an email address) [POST or GET, mandatory]
//    session: the name of the recording session [POST or GET, mandatory]
//    stat: an otional value. Can be anything [POST, optional]
//
// If there's a POST "stat" parameter than the script returns a JSON array
// {"Result":"OK"} if the file exists or an error code if it does not exist
// With no "stat" parameter it returns the binary file itself or an error code
// 
require_once dirname(__FILE__) . "/../config/config.inc.php";

require_once "lib.inc.php";


session_start();

$result = array();

try {
    
    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        throw new Exception("401"); // Unauthorized
    }

    $teacher = isset($_SESSION['user']) ? $_SESSION['user'] : null;
    $student = isset($_POST['student']) ? $_POST['student'] : 
                                          (isset($_GET['student']) ? $_GET['student'] : null);
    $session = isset($_POST['session']) ? $_POST['session'] : 
                                          (isset($_GET['session']) ? $_GET['session'] : null);
    $stat = isset($_POST['stat']) ? true : false;


    // Teacher user name must be stored into _SESSION  vars an email address
    if (!$teacher || !filter_var($teacher, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("403"); // Forbidden
    }
    $teacher = strtolower($teacher);

    // Student user name must be an email address or x@y
    if (!$student || !filter_var($student . ".ext", FILTER_VALIDATE_EMAIL)) {
        throw new Exception("400"); // Bad request
    }     

    // Recording session name must contain only letters, numbers or dashes
    if (!$session || !preg_match('/^[a-z0-9A-Z_.-]+$/', $session)) {
        throw new Exception("400"); // Bad request
    }     

    // File name is generated
    $fileName = $session . '-' . $student . '.webm';
    
    $filePath = $CONFIG['data_path'] . "/$teacher/" . $CONFIG['session_folder'] . "/$session/$fileName";
    
    // File must exist and be readable
    if (!file_exists($filePath)) throw new Exception("404"); // not found
    if (!is_readable($filePath)) throw new Exception("403"); // forbidden
    
    if ($stat) {
        $result['Result'] = "OK";
        print json_encode($result);
        exit (0);
    }
    
    
    // Send generic headers - it should work also without headers
    header('Content-Description: File Transfer');
    header("Content-Type: application/octet-stream");
    header("Content-Disposition: attachment; filename=$fileName");
    header('Content-Transfer-Encoding: binary');
    header('Connection: Keep-Alive');
    header('Expires: 0');
    header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
    header("Cache-Control: no-cache, must-revalidate");
    header("Pragma: public");
    header("Content-length: " . (string) (filesize($filePath)));
    
    readfile_chunked($filePath);


/*    
    // Flush headers
    flush();

    // Send data
    ob_start(null, 4096);


    $handle = fopen($filePath, "rb");
    if (FALSE === $handle)  throw new Exception("403"); // Forbidden
    
    while (!feof($handle)) {
        echo fread($handle, 8192);
    }
    fclose($handle);

    ob_flush();
*/
} catch(Exception $e) {
    
    // Errors are returned as standard HTTP response codes
    
    http_response_code(intval($e->getMessage()));

};
?>