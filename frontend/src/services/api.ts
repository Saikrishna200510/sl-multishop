const API_BASE_URL = '/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

class ApiClient {
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const token = localStorage.getItem('sl_access_token');
    const tenantId = localStorage.getItem('sl_active_shop_id');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }

    return headers;
  }

  async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });

    const url = `${API_BASE_URL}${endpoint}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body: any = {}, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(headers),
      body: JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body: any = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to parse server response'
    }));

    if (!response.ok) {
      if (response.status === 401) {
        // Clear expired session if on browser
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          localStorage.removeItem('sl_access_token');
          localStorage.removeItem('sl_refresh_token');
          window.location.href = '/login?expired=true';
        }
      }
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }

    return data;
  }
}

export const api = new ApiClient();
