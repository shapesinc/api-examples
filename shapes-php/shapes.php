<?php

$apiKey = 'YOURAPI';
$username = 'BOTNAME';
if(isset($_GET["bot"])){
$username = $_GET["bot"];
}

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(["error" => "SHAPESINC_API_KEY not found in .env"]);
    exit;
}
if (!$username) {
    http_response_code(500);
    echo json_encode(["error" => "SHAPESINC_SHAPE_USERNAME not found in .env"]);
    exit;
}


$user_message = "Hello. What's your name?";
if (!empty($_GET['message'])) {
    $user_message = $_GET['message'];
} elseif (!empty($_POST['message'])) {
    $user_message = $_POST['message'];
}


$payload = [
    "model" => "shapesinc/$username",
    "messages" => [
        [
            "role" => "user",
            "content" => $user_message
        ]
    ]
];

$ch = curl_init("https://api.shapes.inc/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($response === false) {
    http_response_code(500);
    echo json_encode(["error" => "Curl error: " . curl_error($ch)]);
    exit;
}
curl_close($ch);

$data = json_decode($response, true);

header('Content-Type: application/json');

if (isset($data['choices'][0]['message']['content'])) {
    echo json_encode(["reply" => $data['choices'][0]['message']['content']]);
} else {
    echo json_encode(["error" => "No choices in response", "raw" => $data]);
}
