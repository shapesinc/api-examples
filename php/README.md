

---

## **.env.example**

# Shapes.inc API Chat Example

This repository demonstrates how to use the Shapes.inc API to send chat messages to a custom bot and receive responses. It is designed with security and ease of setup in mind.

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

   - Copy `.env.example` to `.env` in the same directory as your script.
   - Edit `.env` to set your Shapes.inc API key and default bot name:

     ```
     SHAPESINC_API_KEY=your_api_key_here
     SHAPESINC_SHAPE_USERNAME=your_default_botname_here
     ```

3. **Use the script**

   - The script reads credentials from `.env`.
   - You can specify a different bot name via the `bot` parameter in the request.
   - The `message` parameter is required and can be sent via GET or POST (POST is prioritized).

## **Security Features**

- **Input Sanitization:** All user inputs are sanitized.
- **Environment Variables:** Credentials are stored in `.env` and not hardcoded.
- **Validation:** Only alphanumeric, underscore, and hyphen characters are allowed for bot names.
- **Generic Error Messages:** No sensitive information is exposed in error responses.

## **Example Usage**

Send a message to your bot:

- **GET:** `/yourscript.php?message=Hello&bot=yourbotname`
- **POST:** Send `message=Hello` and optionally `bot=yourbotname` as form data.

## **.env.example**

See `.env.example` for the expected environment variables.

---

## **.env.example**

SHAPESINC_API_KEY=your_api_key_here
SHAPESINC_SHAPE_USERNAME=your_default_botname_here


---

**Replace the placeholders with your actual API key and bot name.**

---
