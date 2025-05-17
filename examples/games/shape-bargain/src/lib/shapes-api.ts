import { type Item } from '@/store/gameStore';

interface ChatGameState {
  gold: number;
  inventory: Item[];
  merchantItems: Item[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  error_type?: string;
}

function getErrorMessage(error: any): string {
  if (error?.error_type === 'rate_limit') {
    return "The merchant is overwhelmed with customers right now. Please try again in a moment...";
  }
  if (error?.error_type === 'auth_error') {
    return "The merchant doesn't recognize your credentials. Please check your API key.";
  }
  if (error?.error_type === 'network_error') {
    return "The merchant's shop seems to be closed. Please check your connection and try again.";
  }
  if (error?.error_type === 'validation_error') {
    return "The merchant couldn't understand your request. Please try again.";
  }
  return "**Merchant seems to be asleep...**";
}

export async function chatWithMerchant(
  message: string,
  gameState: ChatGameState,
  merchantId: string = 'merchantbot' // Default to original merchant if none specified
): Promise<ApiResponse> {
  try {
    console.log(`[Frontend] Sending chat request to merchant ${merchantId}:`, { message, gameState });

    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `shapesinc/${merchantId}`,
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        isCommand: message.startsWith('!')
      }),
    });

    if (!response.ok) {
      console.error('[Frontend] Network error:', response.status, response.statusText);
      return {
        success: false,
        message: "The merchant's shop seems to be closed. Please check your connection and try again.",
        error_type: 'network_error'
      };
    }

    const data = await response.json();
    console.log(`[Frontend] Received chat response from ${merchantId}:`, data);
    return data;
  } catch (error) {
    console.error(`[Frontend] Error in chat request to ${merchantId}:`, error);
    return {
      success: false,
      message: getErrorMessage(error),
      error_type: 'unknown_error'
    };
  }
}

interface ShapesResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface ShapesError {
  message: string;
  code?: string;
  type?: string;
}

interface ShapesErrorResponse {
  success: false;
  error: string;
  error_type?: string;
}

function handleError(error: Error | ShapesError | unknown): ShapesErrorResponse {
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    };
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      success: false,
      error: String(error.message)
    };
  }

  return {
    success: false,
    error: 'An unknown error occurred'
  };
}

export async function shapesApiRequest(endpoint: string, options: RequestInit): Promise<ShapesResponse> {
  try {
    const response = await fetch(`${process.env.SHAPES_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SHAPESINC_API_KEY}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json() as ShapesError;
      throw new Error(error.message || 'API request failed');
    }

    return await response.json() as ShapesResponse;
  } catch (error) {
    throw handleError(error);
  }
} 