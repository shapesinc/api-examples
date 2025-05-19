# Shape Auth Example

A simple authentication integration example for the Shapes Inc authorization service.

## Overview

This example demonstrates a clean, user-focused authentication flow with the following design principles:

- Centered form layout to direct user attention to the authentication process
- Subtle animations for button hover states and form submission feedback
- Visual cues using lock and key icons to represent the authentication process

## Core Features

- **Login Button**: Redirects users to the Shapes Inc authorization page (`/authorize?app_id=[your_app_id]`)
- **One-Time Code Input**: Field for users to paste the one-time code received after authenticating on Shapes Inc
- **Token Exchange Handler**: Client-side logic to submit the one-time code and exchange it for a user auth token
- **Auth Token Display**: Shows the received user auth token with options to store in browser local storage or cookies
  - Includes disclaimer explaining that displaying tokens is only for demonstration purposes

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. Click the login button to authenticate with Shapes Inc
2. Copy the one-time code from Shapes Inc
3. Paste the code into the input field
4. Submit to exchange for your auth token
5. View and optionally store your auth token

## Development

This example is built with modern web technologies and follows best practices for authentication flows. Feel free to customize the UI or extend the functionality to suit your specific needs.

## License

MIT