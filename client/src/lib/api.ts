/**
 * Utility for making API requests to our server
 */

/**
 * Make an API request to the backend
 * @param method HTTP method to use
 * @param endpoint API endpoint (with leading slash)
 * @param data Optional data to send (for POST/PUT/PATCH)
 * @returns Response object
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);
    return response;
  } catch (error) {
    console.error(`API request error: ${endpoint}`, error);
    throw error;
  }
}