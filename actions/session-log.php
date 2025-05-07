<?php

//
// Write a log line to proper log file in teacher's log directory
//
// Invoked either by teacher and by the booths.
//
// Teacher can use this script only if authenticated
// Booths need to know the security token sent by the
// teacher and their pin must be part of the class
//
// Requests are received via POST:
//
// teacher: variable with the teacher user name since we've to access his/her
//          working directory. It is formally an email address
//
// student: variable with the student's user name. It is formally an email
//          address (only for booths)
//
// token: the current security token (only for booths)
// classCode: classCode for current class
// pin: the pin of the booth
//
// log: log data
// timeStamp: time stamp (format: YYYY-MM-DD HH:MM:SS)
//

require_once dirname(__FILE__) . "/../config/config.inc.php";

require_once "lib.inc.php";

session_start();


$result = array();

try {
    
    // If we're logged in we won't need a security token
    $authenticated = isset($_SESSION['login']) && $_SESSION['login'];
    
    // Fail if teacher and log data are not both set or if teacher name is not an email 
    if (!isset($_POST['teacher']) || !isset($_POST['log'])) throw new Exception("Bad request (missing or invalid field)"); // bad request
    if (!filter_var($_POST['teacher'], FILTER_VALIDATE_EMAIL)) throw new Exception("Bad request (missing or invalid field)"); // bad request
    
    $teacher = strtolower($_POST['teacher']);

    $student = null;


    // Check if working directory exists
    $workingDirectory = $CONFIG['data_path'] . "/$teacher";
    if (!is_dir($workingDirectory)) {
        error_log("$teacher working directory does not exist");
        throw new Exception("File system or permission error"); // forbidden
    }
        
    // Create log directory if it does not exists
    $logDirectory = $workingDirectory . "/" . $CONFIG['log_folder'];
    @mkdir($logDirectory);
    if (!is_dir($logDirectory)) throw new Exception("File system or permission error");
    if (!is_writable($logDirectory)) throw new Exception("File system or permission error");
    
    // If not authenticated, we check if session token file exists, get token value and check it against POST field
    if (!$authenticated || isset($_POST['student'])) {
        // We're a booth...
        
        // a valid student user name is needed
        if (!isset($_POST['student']) || !filter_var($_POST['student'], FILTER_VALIDATE_EMAIL)) throw new Exception("Bad request (missing or invalid field)"); // bad request
        $student = strtolower($_POST['student']);
        
        // classCode is an integer
        if (isset($_POST['classCode']) && $_POST['classCode'] && filter_var($_POST['classCode'], FILTER_VALIDATE_INT) === false) {
            throw new Exception("Bad request (missing or invalid field)"); // Bad request
        }
        
        // Session token is a PIN
        if (!isset($_POST['token']) || !filter_var($_POST['token'], FILTER_VALIDATE_REGEXP, array("options"=>array("regexp"=>"/^[0-9]+$/")))) {
            throw new Exception("Bad request (missing or invalid field)"); // Bad request
        } 
        
        // Booth pin is a PIN
        if (!isset($_POST['pin']) || !filter_var($_POST['pin'], FILTER_VALIDATE_REGEXP, array("options" => array("regexp" => "/^[0-9]+$/")))) {
            throw new Exception("Bad request (missing or invalid field)"); // Bad request
        }        

        $token     = $_POST['token'];
        $pin       = $_POST['pin'];
        $classCode = isset($_POST['classCode']) ? $_POST['classCode'] : "";
        
        // Check if token file exists
        if (!file_exists("$workingDirectory/session$classCode.token")) {
            error_log("Token file '$workingDirectory/session$classCode.token' does not exist");
            throw new Exception("Unauthorized:"); // Unauthorized
        } else {
            error_log("Token file exists");
        }
        
        // Check if booth is part of the class and has the security token 
        $reg = @json_decode(file_get_contents("$workingDirectory/session$classCode.token"));
        if (@($reg->token != $token) || !@in_array($pin, $reg->members) ) {
            error_log("Booth with pin $pin and token $token is *NOT* authorized to read files");
            throw new Exception("Unauthorized"); // Unauthorized
        } else {
            error_log("Booth with pin $pin and token $token is authorized to access files");
        }
    
    }
    
    // We are either an authenticated teacher or a validated booth


    // script
    if (isset($_POST['script']) && $_POST['script'] && !valid_filename(basename($_POST['script']))) {
        throw new Exception("Bad request (missing or invalid field 1)"); // Bad request
    }
    // line
    if (isset($_POST['line']) && $_POST['line'] && filter_var($_POST['line'], FILTER_VALIDATE_INT) === false) {
        throw new Exception("Bad request (missing or invalid field 2)"); // Bad request
    }
    // column
    if (isset($_POST['column']) && $_POST['column'] && $_POST['column'] != "" && filter_var($_POST['column'], FILTER_VALIDATE_INT) === false) {
        throw new Exception("Bad request (missing or invalid field 3)" . $_POST['column']); // Bad request
    }    
    $script    = isset($_POST['script']) ? basename($_POST['script']) : "";
    $line      = isset($_POST['line']) ? $_POST['line'] : "";
    $column    = isset($_POST['column']) ? $_POST['column'] : "";
    
    
    // Check for time stamp and log level
    $timeStamp = '';
    if (isset($_POST['timeStamp'])) {
        if ($_POST['timeStamp'] != '' && !filter_var($_POST['timeStamp'], FILTER_VALIDATE_REGEXP, array("options"=>array("regexp"=>"/^[0-9\/.: -]+$/")))) {
            throw new Exception("Malformed data " . $_POST['timeStamp']); // Bad request
        } else {
            $timeStamp = $_POST['timeStamp'];
        }
        error_log($timeStamp);
        $timeStamp = $_POST['timeStamp'];
    }
    $logLevel = '';
    if (isset($_POST['logLevel'])) {
        $logLevel = $_POST['logLevel'];
        if (!in_array($logLevel, array('log', 'warn', 'error', 'syserr') ) ) $logLevel = '';
    }
    
    

    // Append to log file
    $logFile = $logDirectory . '/' . ($student ? $student : $teacher) . '.log';
    $f = fopen($logFile, "a");
    if (!$f) throw new Exception("File system or permission error"); // not found
    
    $text = '';
    if ($timeStamp != '' || $logLevel != '' || $script != '') {
        $mark = array();
        if ($timeStamp) $mark[] = $timeStamp;
        if ($logLevel) $mark[] = $logLevel;
        if ($script) $mark[] = $line ? "$script:$line" : $script;
        if (count($mark) > 0) $text .= "[" . implode(" - ", $mark) . "] ";
    }
    $text .= $_POST['log'] . "\n";
    
    fwrite($f, $text);
    fclose($f);    

    $result['Result'] = "OK";

} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>