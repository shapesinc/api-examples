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

from pydantic import BaseModel, Field


class QualifiedEmail(BaseModel):
    """
    Data model representing a processed email with all necessary information
    for generating and sending a reply.
    
    This model contains the details of both the original email and information
    needed for the reply, including identifiers for email threading and recipient
    information.
    """
    shape_username: str = Field(..., description="The username of the shape")
    domain: str = Field(..., description="The domain of the shape")
    outbound_email_name: str = Field(..., description="The name of the outbound email")
    outbound_email_address: str = Field(
        ..., description="The address of the outbound email"
    )
    cc_list: list = Field(..., description="The CC list for the email")
    subject: str = Field(..., description="The subject of the email")
    body: str = Field(..., description="The body of the email")
    reply_body: str = Field(..., description="The reply body of the email")
    message_id: str = Field(..., description="The message ID of the email")
    sender_email: str = Field(..., description="The sender's email address")
    in_reply_to: str = Field(..., description="The In-Reply-To header of the email")
    references: str = Field(..., description="The References header of the email")
