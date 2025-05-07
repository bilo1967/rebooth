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
    
    $teacher = strtolower($_SESSION['user']);
    
    $sessionDirectory = $CONFIG['data_path'] . "/$teacher/" . $CONFIG['session_folder'];
    
    @mkdir($sessionDirectory); // Try to create if still missing
    
    if (!is_dir($sessionDirectory)) throw new Exception("Can't access session directory");
    
    $sessions = scandir($sessionDirectory);

    $list = array();
    foreach ($sessions as $name) {
        if (!is_dir($sessionDirectory . "/" . $name)) continue;  // skip files
        if ($name[0] == ".") continue; // skip hidden items
        $n = countFilesInDirectory($sessionDirectory . "/" . $name);
        $list[] = [ "name" => $name, "count" => $n ];
    }

    $result['Result'] = "OK";
    $result['Data'] = $list;
    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);


function countFilesInDirectory($directory) {
    // Ensure the directory path ends with a slash
    $directory = rtrim($directory, '/') . '/';

    // Initialize the file count
    $fileCount = 0;

    // Check if the directory exists
    if (is_dir($directory)) {
        // Open the directory
        if ($handle = opendir($directory)) {
            // Loop through the directory contents
            while (false !== ($entry = readdir($handle))) {
                // Skip the special entries '.' and '..'
                if ($entry != "." && $entry != "..") {
                    // Check if the entry is a file
                    if (is_file($directory . $entry)) {
                        $fileCount++;
                    }
                }
            }
            // Close the directory handle
            closedir($handle);
        } else {
            return "Unable to open the directory.";
        }
    } else {
        return "The specified path is not a directory.";
    }

    return $fileCount;
}

?>
