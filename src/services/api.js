const BASE_URL = 'https://myshop24.ng/api/m';

let _authToken = null;

export function setAuthToken(token) {
  _authToken = token;
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;
  return headers;
}

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      headers: { Accept: 'application/json', ...options.headers },
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const api = {
  getActiveUrl: () => BASE_URL,

  getBanners: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/banners`);
    if (!response.ok) throw new Error(`getBanners failed: ${response.status}`);
    return await response.json();
  },

  getCategories: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/categories`);
    if (!response.ok) throw new Error(`getCategories failed: ${response.status}`);
    return await response.json();
  },

  getProducts: async (filters = {}) => {
    let url = `${BASE_URL}/products?`;
    if (filters.search) url += `search=${encodeURIComponent(filters.search)}&`;
    if (filters.category) url += `category=${encodeURIComponent(filters.category)}&`;
    if (filters.limit) url += `limit=${filters.limit}&`;
    if (filters.page) url += `page=${filters.page}&`;
    if (filters.seed) url += `seed=${filters.seed}&`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`getProducts failed: ${response.status}`);
    const data = await response.json();

    if (data && data.data) {
      return {
        products: data.data,
        hasMore: data.next_page_url !== null,
        total: data.total,
      };
    }
    return { products: Array.isArray(data) ? data : [], hasMore: false, total: 0 };
  },

  getProductDetails: async (id) => {
    const response = await fetchWithTimeout(`${BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error(`Product not found (${response.status})`);
    return await response.json();
  },

  getFlashSales: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/flash-sales`);
    if (!response.ok) throw new Error(`getFlashSales failed: ${response.status}`);
    return await response.json();
  },

  getCuratedSet: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/curated-sets`);
    if (!response.ok) throw new Error(`getCuratedSet failed: ${response.status}`);
    return await response.json();
  },

  getTrendingKeywords: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/search-trending`);
    if (!response.ok) throw new Error(`getTrendingKeywords failed: ${response.status}`);
    return await response.json();
  },

  register: async ({ name, email, password }) => {
    const response = await fetchWithTimeout(`${BASE_URL}/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed.');
    return data; // { user, token }
  },

  login: async ({ email, password }) => {
    const response = await fetchWithTimeout(`${BASE_URL}/login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed.');
    return data; // { user, token }
  },

  logout: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
    _authToken = null;
    if (!response.ok) return;
    return await response.json();
  },

  getUser: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/user`, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Not authenticated.');
    return await response.json();
  },

  forgotPassword: async (email) => {
    const response = await fetchWithTimeout(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    // This endpoint always answers 200 with a `success` flag rather than an HTTP error status.
    if (!response.ok || !data.success) throw new Error(data.message || 'Could not send reset email.');
    return data;
  },

  resetPassword: async ({ email, otp, password, passwordConfirmation }) => {
    const response = await fetchWithTimeout(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Could not reset password.');
    return data;
  },

  validatePromo: async (code) => {
    const response = await fetchWithTimeout(`${BASE_URL}/promo-validate?code=${encodeURIComponent(code)}`);
    const data = await response.json();
    if (!response.ok || !data.valid) {
      throw new Error(data.message || 'Invalid or expired coupon code.');
    }
    return data;
  },

  initializeCheckout: async ({ items, shipping, promoCode }) => {
    const response = await fetchWithTimeout(`${BASE_URL}/checkout/initialize`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        items,
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_zip: shipping.zip,
        shipping_country: shipping.country,
        promo_code: promoCode || undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not start payment.');
    return data; // { authorization_url, reference, expected_total }
  },

  verifyCheckout: async ({ reference, items, shipping, promoCode }) => {
    const response = await fetchWithTimeout(`${BASE_URL}/checkout/verify`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        reference,
        items,
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_zip: shipping.zip,
        shipping_country: shipping.country,
        promo_code: promoCode || undefined,
      }),
    }, 20000);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Payment verification failed.');
    return data; // { order }
  },

  getOrders: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/orders`, { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not load orders.');
    return data;
  },

  getWishlist: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/wishlist`, { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not load wishlist.');
    return data;
  },

  toggleWishlist: async (productId) => {
    const response = await fetchWithTimeout(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ product_id: productId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not update wishlist.');
    return data; // { in_wishlist }
  },

  submitContact: async ({ name, email, subject, message }) => {
    const response = await fetchWithTimeout(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, email, subject, message }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not send your message.');
    return data;
  },

  getVendorDashboard: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/vendor/dashboard`, { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not load vendor dashboard.');
    return data;
  },

  registerVendor: async (payload) => {
    const response = await fetchWithTimeout(`${BASE_URL}/vendor/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not register as a seller.');
    return data; // { user, store_name, token }
  },

  spinWheel: async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/spin-wheel`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not spin the wheel.');
    return data; // { prize_index, prize_label, coupon_code }
  },

  submitReview: async (productId, { rating, comment }) => {
    const response = await fetchWithTimeout(`${BASE_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ rating, comment }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not submit your review.');
    return data;
  },

  searchByImage: async (base64Image) => {
    const response = await fetchWithTimeout(`${BASE_URL}/search/image`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ image_data: base64Image }),
    }, 30000);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not search by image.');
    return data; // array of products
  },
};
