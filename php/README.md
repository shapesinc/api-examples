

---

# Shapes.inc API Chat Example

This php script demonstrates how to use the Shapes.inc API to send chat messages to a custom bot and receive responses. It is designed with security and ease of setup in mind.

## **What Does This Do?**

- **Send chat messages** to a Shapes.inc bot via API.
- **Receive responses** in JSON format.
- **Secure by default:** Sanitizes inputs, loads credentials from `.env`, and validates bot names.

## **Requirements**

- PHP 7.4 or higher
- `curl` extension enabled
- [Shapes.inc API Key](https://shapes.inc)

## **Setup**

1. **Clone this repository** or download the files to your project directory.

2. **Configure your environment**

   - Copy `.env.example` contents to `.env` in the same directory as your script(create new .env file if no).
   - Edit `.env` to set your Shapes.inc API key and default bot name:

     ```
     SHAPESINC_API_KEY=your_api_key_here
     SHAPESINC_SHAPE_USERNAME=your_default_botname_here
     ```

3. **Use the script**

   - The script reads credentials from `.env`.
   - You can specify a different bot name via the `bot` parameter in the request.
   - The `message` parameter is required and can be sent via POST(GET is fallback).

## **Security Features**

- **Input Sanitization:** All user inputs are sanitized.
- **Environment Variables:** Credentials are stored in `.env` and not hardcoded.
- **Validation:** Only alphanumeric, underscore, and hyphen characters are allowed for bot names.
- **Generic Error Messages:** No sensitive information is exposed in error responses.

## **Example Usage**

Send a message to your bot:

- **POST:** Send `message=Hello` (optionally add `?bot=yourbotname` to URL to change bot username) to `/yourscript.php`.
- **GET:** `/yourscript.php?message=Hello&bot=yourbotname`


---

## **Example Code**

Send prompt to your Shapes API handler:

- **POST:**

```php
$message = "Hello, how are you?";
$bot = "yourbotname"; // Optional, omit to use default bot

$ch = curl_init('https://yourdomain.com/yourscript.php?bot=' . urlencode($bot));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['message' => $message]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
```

- **GET:**

```php
$prompt = "Hello, how are you?";
$botName = "yourbotname"; // Optional, omit to use default bot

$response = file_get_contents(
    "https://yourdomain.com/yourscript.php?message=" . urlencode($prompt) . "&bot=" . urlencode($botName)
);

echo $response;
```

---
