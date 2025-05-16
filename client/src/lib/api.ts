/**
 * Helper function for making API requests
 */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);
  
  // For non-2xx responses, throw an error
  if (!response.ok && response.status !== 401) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || `Error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response;
}