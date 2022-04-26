<?php
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/javascript");
	
    if (isset($_GET['msg'])) 		{$msg = $_GET['msg'];}				else {$msg = "";}
	if (isset($_GET['email'])) 		{$email = $_GET['email'];} 			else {$email = "";}
	if (isset($_GET['title'])) 		{$title = $_GET['title'];}			else {$title = "";}
	if (isset($_GET['site'])) 		{$title = $_GET['site'];}			else {$site = "";}
	
	$message = $msg;
	$message = wordwrap($message,70);
	$headers = "From: " . $email . "\r\n";
	mail('contact@viviannigri.com', "Message from ".$site . $title, $message, $headers);
	echo json_encode(true);
?>