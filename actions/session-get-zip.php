<?php
require_once dirname(__FILE__) . "/../config/config.inc.php";
require_once "lib.inc.php";

session_start();

$result = array();

try {

    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        throw new Exception("401"); // Unauthorized
    }
    

    // Teacher user name must be stored into _SESSION  vars an email address
    $teacher = isset($_SESSION['user']) ? $_SESSION['user'] : null;
    if (!$teacher || !filter_var($teacher, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("403"); // Forbidden
    }
    $teacher = strtolower($teacher);

    // Recording session name must contain only letters, numbers or dashes
    $session = isset($_POST['session']) ? $_POST['session'] : (isset($_GET['session']) ? $_GET['session'] : null);
    if (!$session || !preg_match('/^[a-z0-9A-Z_.-]+$/', $session)) {
        throw new Exception("400"); // Bad request
    }     
    
    $workDirectory = $CONFIG['data_path'] . "/$teacher/" . $CONFIG['temp_folder'];
    $sessionDirectory = $CONFIG['data_path'] . "/$teacher/" . $CONFIG['session_folder'] . "/$session";
    // Directory must exist and be readable
    if (!is_dir($sessionDirectory)) throw new Exception("404"); // not found
    if (!is_readable($sessionDirectory)) throw new Exception("403"); // forbidden
    
    

    $zipName = $session . '.zip';
    $zipPath = $workDirectory . '/' . $zipName; 
    //$zipPath = tempnam(sys_get_temp_dir(), "foo");
    
    @unlink($zipPath);
    
    $zip = new ZipArchive;
    $zip->open($zipPath, ZipArchive::CREATE);
    if ($dh = opendir($sessionDirectory)) {
      while (($entry = readdir($dh)) !== false) {
        if (is_file($sessionDirectory . '/' . $entry) && $entry != "." && $entry != ".." && !strstr($entry,'.php')) {
            $zip->addFile($sessionDirectory . '/' . $entry, $entry);
        }
      }
      closedir($dh);
    }
    $zip->close();
    
    $fp = fopen($zipPath, "rb");
    if ($fp === false)  throw new Exception("403"); // Forbidden


//  ob_clean();
    
    // Send generic headers - it should work also without headers
    header('Content-Description: File Transfer');
    header('Content-Type: application/zip');
    header("Content-Disposition: attachment; filename=$zipName");
//  header('Content-Transfer-Encoding: binary');
    header('Connection: Keep-Alive');
    header('Expires: 0');
    header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
    header("Cache-Control: no-cache, must-revalidate");
    header("Pragma: public");
    header("Content-length: " . (string) (filesize($zipPath)));
    
    readfile_chunked($zipPath);
    


//   // Flush headers
//   flush();
//
//   // Send data
//   ob_start(null, 4096);
//   while (!feof($fp)) {
//       echo fread($fp, 4096);
//   }
//   fclose($fp);
//   ob_flush();
//   
//   //unlink($zipPath);


    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>
