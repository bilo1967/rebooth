<?php
//
// Send invitations
//

require_once dirname(__FILE__) . "/../config/config.inc.php";


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;


require_once dirname(__FILE__) . "/PHPMailer/PHPMailer.php";
require_once dirname(__FILE__) . "/PHPMailer/SMTP.php";
require_once dirname(__FILE__) . "/PHPMailer/Exception.php";
session_start();

date_default_timezone_set($CONFIG['timezone']);

$result = array();

try {

    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        throw new Exception("Unauthorized");
    }
    
    if (!isset($_SESSION['user']) || ! $_SESSION['user'] || 
        !filter_var($_SESSION['user'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Teacher user name is not set or it is not an email address");
    }    
    
    $teacher = $_SESSION['user'];
    
    // Test POST data
    if (isset($_POST['invitations']) && !is_array($_POST['invitations'])) throw new Exception("Unexpected format for invitation data");

    $invitations = isset($_POST['invitations']) ? $_POST['invitations'] : array();
    $classCode = isset($_POST['classCode']) ? $_POST['classCode'] : "";
    $classTime = isset($_POST['classTime']) ? $_POST['classTime'] : "";
    
    $sendInvitations = isset($_POST['sendInvitations']) ? $_POST['sendInvitations'] : 0;
    
    if ($classCode && !filter_var($classCode, FILTER_VALIDATE_INT)) {
        throw new Exception("Invalid number in class code");
    }
    
    // classTime must be an ISO 8601 string
    if ($classTime != 0 && 
        !preg_match('/^(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})[+-](\d{2})\:(\d{2})$/', $classTime)) {
        throw new Exception("Invalid class time");
    }
    
    if ($sendInvitations != 0 && !filter_var($sendInvitations, FILTER_VALIDATE_INT)) {
        throw new Exception("Invalid send flag");
    }    
        
    foreach ($invitations as $invitation) {
        if (!filter_var($invitation['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email " . $invitation['email'] . " in invitation data");
        }
        // Add 1 before checkthe pin to make it check as a valid integer even if it starts with 0
        if (!filter_var("1" . $invitation['pin'], FILTER_VALIDATE_INT)) {
            throw new Exception("Invalid pin " . $invitation['pin'] . " in invitation data");
        }        
    }
    
    // Store invitations in session json encoded
    $_SESSION['invitations'] = json_encode($invitations);
    $_SESSION['classCode'] = $classCode;
    
    
    // Send invitations
    if ($sendInvitations) {
        foreach ($invitations as $invitation) {
        
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $CONFIG["smtp_host"];
            $mail->SMTPAuth   = $CONFIG["smtp_auth"];
            $mail->Username   = $CONFIG["smtp_user"];
            $mail->Password   = $CONFIG["smtp_pass"];
            $mail->Port       = $CONFIG["smtp_port"];
            $mail->SMTPSecure = $CONFIG["smtp_encryption"] == 'STARTTLS' ? 
                                PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
        
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );                        
            
            $mail->addReplyTo($teacher);
            $mail->setFrom($CONFIG["email_sender"]);
            $mail->isHTML(true);
            $mail->Subject = 'Please, join the interpretation class';
        
            $pin = $invitation['pin'];
            $email = $invitation['email'];
        
            $url = $CONFIG["booth_url"] . "?pin=$pin&t=$teacher&s=$email";
            if ($classCode != "") $url = $url . "&c=$classCode";
            
            $mail->addAddress($email);

            if ($classTime) {
                $t = strtotime($classTime);
                $t = "Your class will start " .
                      " on " . date('d-m-Y', $t) .
                      " at " . date('H:i',   $t) .
                      "<br/>"
                      ;
            } else {
                $t = "";
            }

            $t .= "Please, click the following link to enter your booth:<br>" .
                  "<a href='$url' target='_blank'>$url</a>";

            $mail->Body = $t;
            
            $mail->send();

            error_log("Invitation sent to <$email> by <$teacher>");
        }
    }

    $result['Result'] = "OK";
    $result['Data'] = $invitations;
    
} catch(Exception $e) {
    
    //Return error message
    $result['Result'] = "ERROR";
    $result['Message'] = $e->getMessage();
};

print json_encode($result);

?>
