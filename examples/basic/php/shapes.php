<?php

// Load credentials from environment variables
$apiKey = getenv('SHAPESINC_API_KEY');
$username = getenv('SHAPESINC_SHAPE_USERNAME');

// Validate API key
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(["error" => "API key not found."]);
    exit;
}

// Validate username (default or from GET)
if (!$username && isset($_GET["bot"])) {
    $username = htmlspecialchars($_GET["bot"], ENT_QUOTES, 'UTF-8');
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid bot name."]);
        exit;
    }
}
if (!$username) {
    http_response_code(500);
    echo json_encode(["error" => "Bot name not found."]);
    exit;
}

// Get user message, prioritize POST over GET
$user_message = "Hello. What's your name?";
if (!empty($_POST['message'])) {
    $user_message = htmlspecialchars($_POST['message'], ENT_QUOTES, 'UTF-8');
} elseif (!empty($_GET['message'])) {
    $user_message = htmlspecialchars($_GET['message'], ENT_QUOTES, 'UTF-8');
}

// Get user ID from request parameters
$user_id = null;
if (!empty($_POST['user_id'])) {
    $user_id = htmlspecialchars($_POST['user_id'], ENT_QUOTES, 'UTF-8');
} elseif (!empty($_GET['user_id'])) {
    $user_id = htmlspecialchars($_GET['user_id'], ENT_QUOTES, 'UTF-8');
}

// Get channel ID from request parameters
$channel_id = null;
if (!empty($_POST['channel_id'])) {
    $channel_id = htmlspecialchars($_POST['channel_id'], ENT_QUOTES, 'UTF-8');
} elseif (!empty($_GET['channel_id'])) {
    $channel_id = htmlspecialchars($_GET['channel_id'], ENT_QUOTES, 'UTF-8');
}

// Prepare payload
$payload = [
    "model" => "shapesinc/" . $username,
    "messages" => [
        [
            "role" => "user",
            "content" => $user_message
        ]
    ]
];

// Prepare headers
$headers = [
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json"
];

// Add X-User-Id header if user ID is provided
if ($user_id) {
    $headers[] = "X-User-Id: $user_id";  // If not provided, all requests will be attributed to
    // the user who owns the API key. This will cause unexpected behavior if you are using the same API
    // key for multiple users. For production use cases, either provide this header or obtain a
    // user-specific API key for each user.
}

// Add X-Channel-Id header if channel ID is provided
if ($channel_id) {
    $headers[] = "X-Channel-Id: $channel_id";  // If not provided, all requests will be attributed to
    // the user. This will cause unexpected behavior if interacting with multiple users
    // in a group.
}

// Init curl
$ch = curl_init("https://api.shapes.inc/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Execute and handle response
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($response === false) {
    http_response_code(500);
    echo json_encode(["error" => "API request failed."]);
    exit;
}
curl_close($ch);

$data = json_decode($response, true);

header('Content-Type: application/json');

if (isset($data['choices'][0]['message']['content'])) {
    echo json_encode(["reply" => $data['choices'][0]['message']['content']]);
} else {
    echo json_encode(["error" => "No response received."]);
}
