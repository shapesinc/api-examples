<?php
$message = "Hello, how are you?";
$bot = "yourbotname"; // Optional, omit to use default bot

$ch = curl_init('https://yourdomain.com/yourscript.php?bot=' . urlencode($bot));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['message' => $message]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
