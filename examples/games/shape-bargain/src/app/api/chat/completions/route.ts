import { OpenAI } from 'openai';
import { NextResponse, NextRequest } from 'next/server';

interface Message {
  role: string;
  content: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  error_type?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';

if (!process.env.SHAPESINC_API_KEY && !isDevelopment) {
  throw new Error('Missing SHAPESINC_API_KEY environment variable');
}

// Function to create a shapes client with custom user ID and merchant ID
function createShapesClient(userId: string, merchantId: string) {
  // Extract a channel ID based on the user ID and merchant ID
  // This ensures each merchant has a separate channel per user
  const channelId = `merchant-channel-${userId.split('-').pop()}-${merchantId}`; 
  
  return new OpenAI({
    apiKey: process.env.SHAPESINC_API_KEY || 'dummy-key-for-development',
    baseURL: 'https://api.shapes.inc/v1',
    defaultHeaders: {
      'X-User-Id': `${userId}-${merchantId}`, // Unique user ID per merchant
      'X-Channel-Id': channelId
    }
  });
}

function handleError(error: any, merchantId: string): ErrorResponse {
  console.error(`[API] Error in chat completion with ${merchantId}:`, error);

  // Handle rate limit errors
  if (error?.status === 429) {
    return {
      success: false,
      message: "The merchant is overwhelmed with customers right now. Please try again in a moment...",
      error_type: 'rate_limit'
    };
  }

  // Handle authentication errors
  if (error?.status === 401) {
    return {
      success: false,
      message: "The merchant doesn't recognize your credentials. Please check your API key.",
      error_type: 'auth_error'
    };
  }

  // Handle network errors
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
    return {
      success: false,
      message: "The merchant's shop seems to be closed. Please check your connection and try again.",
      error_type: 'network_error'
    };
  }

  // Handle validation errors
  if (error instanceof Error && error.message.includes('Messages array is required')) {
    return {
      success: false,
      message: "The merchant couldn't understand your request. Please try again.",
      error_type: 'validation_error'
    };
  }

  // Handle model errors for specific shapes
  if (error?.status === 404 && error?.message?.includes('model not found')) {
    return {
      success: false,
      message: `This merchant (${merchantId}) is not available at the moment. Please try another merchant.`,
      error_type: 'model_not_found'
    };
  }

  // Default error message
  return {
    success: false,
    message: "The merchant seems distracted...",
    error_type: 'unknown_error'
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Received chat request');
    
    // Extract IP address from request headers
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown-ip';
    
    // Create a unique user ID based on IP
    const userId = `merchant-game-user-${clientIp}`;
    
    const body = await request.json();
    console.log('[API] Request body:', body);
    
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('Messages array is required');
    }

    const userMessage = body.messages.find((m: Message) => m.role === 'user');
    
    if (!userMessage?.content) {
      throw new Error('User message is required');
    }
    
    // Extract the merchant ID from the model parameter
    // Format is expected to be 'shapesinc/merchantId'
    const merchantId = body.model?.split('/')[1] || 'merchantbot';
    console.log(`[API] User ID: ${userId}, Merchant ID: ${merchantId}`);

    // Create a client with the custom user ID and merchant ID
    const shapesClient = createShapesClient(userId, merchantId);

    // In development, if no API key is present, return mock responses
    if (!process.env.SHAPESINC_API_KEY && isDevelopment) {
      console.log('[API] Returning mock response (no API key in development)');
      return NextResponse.json({
        success: true,
        message: `I'm merchant ${merchantId}, but I can't help you right now. Please set up your api key to interact with me.`
      });
    }

    const response = await shapesClient.chat.completions.create({
      model: body.model || 'shapesinc/merchantbot',
      messages: body.messages
    });
    
    console.log(`[API] Received Shapes API response from ${merchantId}:`, response.choices[0]?.message);

    // Check if we have a valid response or provide a fallback
    const merchantResponse = response.choices[0]?.message?.content;
    
    if (!merchantResponse) {
      console.error(`[API] Empty response content from API for ${merchantId}`);
      return NextResponse.json({
        success: false,
        message: "Greetings traveler! Welcome to my humble shop. How may I assist you today?",
        error_type: 'empty_response'
      });
    }

    // Log the full response content for debugging
    console.log(`[API] Full API Response from ${merchantId}: ${JSON.stringify(response)}`);

    // Normalize line breaks for consistent parsing on the frontend
    const normalizedResponse = merchantResponse.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return NextResponse.json({
      success: true,
      message: normalizedResponse
    });
  } catch (error) {
    // Extract the merchant ID from the request body, defaulting to 'merchantbot'
    const body = await request.json().catch(() => ({ model: 'shapesinc/merchantbot' }));
    const merchantId = body.model?.split('/')[1] || 'merchantbot';
    
    const errorResponse = handleError(error, merchantId);
    return NextResponse.json(errorResponse);
  }
} 