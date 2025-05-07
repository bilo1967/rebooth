<?php
// No session and session variables here since booths do not
// authenticate with the server but just with the teacher
//
// Requests are received via POST:
//
// user: variable with the teacher user name since we've to access his/her
//       working directory. user is formally an email address
//
// file: the name of the file we need
//

require_once dirname(__FILE__) . "/../config/config.inc.php";

require_once "lib.inc.php";


try {
    // Fail if user and file are not both set
    if (!isset($_POST['user']) && !isset($_GET['file']) ||
        !isset($_GET['user']) && !isset($_POST['file'])) throw new Exception("400"); // bad request
    
    // Check if the user name is an email 
    $user = isset($_POST['user']) ? $_POST['user'] : $_GET['user'];
    if (!filter_var($user, FILTER_VALIDATE_EMAIL)) throw new Exception("400"); // bad request
    $user = strtolower($user);
    
    // Check if working directory exists
    $tempDirectory = $CONFIG['data_path'] . "/$user/" . $CONFIG['temp_folder'];;
    if (!is_dir($tempDirectory)) throw new Exception("404"); // not found

    // Sanitize file name and reject it if it contains invalid charachters
    $fileName = isset($_POST['file']) ? $_POST['file'] : $_GET['file'];
    
    $originalFileName = $fileName;
    
    // Sanitize file name
    $fileName = filter_var($fileName, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_BACKTICK);
    $fileName = str_replace(array('\\','/','#',':',';','*','?','|','!','$','%','~','=','>','<',']','[','}','{'), "", $fileName);
    if ($fileName != $originalFileName) throw new Exception("403"); // bad request
    
    $filePath = $tempDirectory . "/" . $fileName;
    
    if (!file_exists($filePath)) throw new Exception("404"); // not found


    // Send generic headers - it should work also without headers
    header("Content-Type: application/octet-stream");
    header("Content-Disposition: attachment; filename=$fileName");
    header("Content-length: " . (string) (filesize($filePath)));
    header("Expires: " . gmdate("D, d M Y H:i:s", mktime(date("H") + 2, date("i"), date("s"), date("m"), date("d"), date("Y"))) . " GMT");
    header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
    header("Cache-Control: no-cache, must-revalidate");
    header("Pragma: no-cache");
    
    readfile_chunked($filePath);

} catch(Exception $e) {
    // Errors are returned as standard HTTP response codes
    
    http_response_code(intval($e->getMessage()));
};
?>