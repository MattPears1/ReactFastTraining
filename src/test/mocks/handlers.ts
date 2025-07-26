import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
    });
  }),

  http.post(`${API_URL}/auth/register`, () => {
    return HttpResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: '2',
          email: 'newuser@example.com',
          name: 'New User',
        },
      },
      { status: 201 }
    );
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.post(`${API_URL}/auth/forgot-password`, () => {
    return HttpResponse.json({ message: 'Password reset email sent' });
  }),

  // Contact endpoints
  http.post(`${API_URL}/contact`, () => {
    return HttpResponse.json({ message: 'Message sent successfully' });
  }),

  // Newsletter endpoints
  http.post(`${API_URL}/newsletter/subscribe`, () => {
    return HttpResponse.json({ message: 'Successfully subscribed to newsletter' });
  }),

  http.post(`${API_URL}/newsletter/unsubscribe`, () => {
    return HttpResponse.json({ message: 'Successfully unsubscribed from newsletter' });
  }),

  // User endpoints
  http.get(`${API_URL}/users/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: new Date().toISOString(),
    });
  }),

  http.put(`${API_URL}/users/profile`, () => {
    return HttpResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Updated User',
      },
    });
  }),

  // Products endpoints
  http.get(`${API_URL}/products`, () => {
    return HttpResponse.json({
      products: [
        {
          id: '1',
          name: 'Product 1',
          description: 'Description 1',
          price: 99.99,
          image: '/product1.jpg',
          category: 'category1',
        },
        {
          id: '2',
          name: 'Product 2',
          description: 'Description 2',
          price: 149.99,
          image: '/product2.jpg',
          category: 'category2',
        },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    });
  }),

  http.get(`${API_URL}/products/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      name: `Product ${id}`,
      description: `Description for product ${id}`,
      price: 99.99,
      image: `/product${id}.jpg`,
      category: 'category1',
      inStock: true,
    });
  }),

  // Analytics endpoints
  http.post(`${API_URL}/analytics/track`, () => {
    return HttpResponse.json({ success: true });
  }),

  // File upload endpoint
  http.post(`${API_URL}/upload`, () => {
    return HttpResponse.json({
      url: 'https://example.com/uploaded-file.jpg',
      filename: 'uploaded-file.jpg',
      size: 1024,
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/contact`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${API_URL}/products`, () => {
    return HttpResponse.error();
  }),
];