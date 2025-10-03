export const API_BASE = 'http://localhost:3000'; // Pour le développement local

async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = {
    method,
    headers,
  };

  if (data && !(data instanceof FormData)) {
    config.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    delete headers['Content-Type']; // Let browser set it
    config.body = data;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  if (!res.ok) throw new Error(`Erreur API: ${res.status} ${res.statusText}`);
  return res.status !== 204 ? await res.json() : null;
}

// ✅ Créer une session Stripe Checkout (lignes + client)
export async function createStripeCheckoutSession(lignes, customer) {
  // On envoie à l’API both “lignes” et “client”
  return apiRequest('/api/payment/create-checkout-session', 'POST', {
    lignes,
    customer,
  });
}

// === API spécifiques export de la gestion du site ===
export async function exportOrders(
  format,
  periode,
  mois = null,
  annee = null,
  token = null
) {
  const url = new URL(`${API_BASE}/api/order/export`);
  url.searchParams.append('format', format);
  url.searchParams.append('periode', periode);
  if (mois !== null) url.searchParams.append('mois', mois);
  if (annee !== null) url.searchParams.append('annee', annee);

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });

  if (!res.ok)
    throw new Error(`Erreur API export: ${res.status} ${res.statusText}`);

  const blob = await res.blob();
  return blob;
}

// === API spécifiques commande client ===
export async function commandeClient() {
  return apiRequest('/api/order');
}
export async function ajoutCommandeClient(formData, token) {
  return apiRequest('/api/order', 'POST', formData, token);
}
// === API spécifiques avis client ===
export async function avis(productRef) {
  const token = localStorage.getItem('token');
  const url = productRef
    ? `/api/avis?productRef=${encodeURIComponent(productRef)}`
    : '/api/avis';
  return apiRequest(url, 'GET', null, token);
}

export async function postAvis(payload) {
  return apiRequest('/api/avis', 'POST', payload);
}

export async function validateAvis(id) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token admin manquant');

  return apiRequest(`/api/avis/${id}/validate`, 'PATCH', null, token);
}

export async function deleteAvis(id) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token admin manquant');

  return apiRequest(`/api/avis/${id}`, 'DELETE', null, token);
}

// === API spécifiques recherche ===
export async function searchProducts(query) {
  return apiRequest(`/api/recherche?search=${encodeURIComponent(query)}`);
}

// === API spécifiques vidéo blog ===
export async function getGalerie() {
  return apiRequest('/api/galerie');
}

// === API spécifiques produits ===
export async function getAllProducts() {
  return apiRequest('/api/produits');
}

export async function getProductByRef(ref) {
  return apiRequest(`/api/produits/by-ref/${encodeURIComponent(ref)}`);
}

export async function deleteProduct(id, token) {
  return apiRequest(`/api/produits/${id}`, 'DELETE', null, token);
}

export async function createProduct(formData, token) {
  return apiRequest('/api/produits', 'POST', formData, token);
}

export async function updateProduct(id, formData, token) {
  return apiRequest(`/api/produits/${id}`, 'PUT', formData, token);
}
// === API spécifiques ID ===
export async function loginAdmin(credentials) {
  return apiRequest('/api/auth/login', 'POST', credentials);
}
