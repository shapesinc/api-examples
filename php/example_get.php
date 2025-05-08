<?php
$prompt = "Hello, how are you?";
$botName = "yourbotname"; // Optional, omit to use default bot

$response = file_get_contents(
    "https://yourdomain.com/yourscript.php?message=" . urlencode($prompt) . "&bot=" . urlencode($botName)
);

echo $response;
?>
