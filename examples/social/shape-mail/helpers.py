"""
MIT License

Copyright (c) 2025 Shapes, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

from datetime import datetime


def get_name_email_pairing(email_string):
    """
    Parse an email string into a list of name and email address pairs.
    
    This function handles various email formats, including:
    - "Name <email@example.com>"
    - "email@example.com"
    - Multiple emails separated by commas
    
    Args:
        email_string (str): Email string to parse, potentially containing multiple emails
        
    Returns:
        list: List of dictionaries, each containing 'name' and 'email' keys
    """
    # Split the string into a list of strings by comma
    email_list = email_string.split(",")
    return_list = []
    for email_item in email_list:
        # Strip leading and trailing spaces
        email_item = email_item.strip()

        # Check if there is a preceding text
        if "<" in email_item and ">" in email_item:
            # Split the string into a list of strings by '<'
            email_parts = email_item.split("<")
            # The last part is the email, remove the trailing '>'
            email = email_parts[-1].replace(">", "")
            # The preceding text is all parts except the last one, joined back together
            preceding_text = "<".join(email_parts[:-1]).strip()
        else:
            # If there's no '<' and '>', the whole string is the email
            email = email_item
            preceding_text = ""

        # Clean up the name
        # Replace double quotes with an empty string
        preceding_text = preceding_text.replace('"', "")
        # Replace single quotes with an empty string
        preceding_text = preceding_text.replace("'", "")

        return_list.append({"name": preceding_text, "email": email})
    return return_list


def extract_cc_list(email1, email2, remove1, remove2):
    """
    Process 'To' and 'Cc' lists to create a final CC list for the reply email.
    
    This function extracts email addresses from two input strings, removes specified
    addresses, and formats them for inclusion in the CC field of an email.
    
    Args:
        email1 (str): The first email string (typically the 'To' field)
        email2 (str): The second email string (typically the 'Cc' field)
        remove1 (str): First email address to remove from the list
        remove2 (str): Second email address to remove from the list
        
    Returns:
        list: Formatted list of email addresses for the CC field
    """
    email1_list = get_name_email_pairing(email1)
    email2_list = get_name_email_pairing(email2)
    remove1_list = get_name_email_pairing(remove1)
    remove2_list = get_name_email_pairing(remove2)

    black_list = [remove1_list[0]["email"], remove2_list[0]["email"]]
    cc_list = []

    # Process email1 list (To field)
    for item in email1_list:
        email = item["email"]
        name = item["name"]
        if email not in black_list:
            if name:
                cc_list.append(f'"{name}" <{email}>')
            else:
                cc_list.append(email)

    # Process email2 list (Cc field)
    for item in email2_list:
        email = item["email"]
        name = item["name"]
        if email not in black_list:
            if name:
                cc_list.append(f'"{name}" <{email}>')
            else:
                cc_list.append(email)

    return cc_list


def format_reply_body(to_email, original_body, reply_body):
    """
    Format an email reply with proper quoting of the original message.
    
    This function formats the reply body along with the original message
    in a standard email reply format.
    
    Args:
        to_email (str): The name of the original sender
        original_body (str): The body of the original email
        reply_body (str): The generated reply text
        
    Returns:
        str: Formatted email body with reply and original message
    """
    original_sender = to_email
    original_date = datetime.now().strftime("%a, %b %d, %Y at %I:%M %p")
    original_message = original_body
    reply_message = reply_body

    def format_reply(original_sender, original_date, original_message):
        """
        Helper function to format the original message.
        
        Args:
            original_sender (str): The name of the original sender
            original_date (str): The formatted date string
            original_message (str): The original message
            
        Returns:
            str: Formatted message with attribution line
        """
        # Don't prefix lines with '>' characters
        return f"On {original_date}, {original_sender} wrote:\n{original_message}"

    email_body = f"{reply_message}\n\n{format_reply(original_sender, original_date, original_message)}"

    return email_body
