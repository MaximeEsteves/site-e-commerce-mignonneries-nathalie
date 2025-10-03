//panier.js
import { updateFavorisCount } from '../../global/addFavorisPanier.js';
import {
  createStripeCheckoutSession,
  API_BASE,
  getAllProducts,
} from '../../api/apiClient.js';
const baseURL = API_BASE + '/';

// Récupère le panier depuis localStorage
function getPanier() {
  return JSON.parse(localStorage.getItem('panier')) || [];
}

// Sauvegarde le panier dans localStorage
function savePanier(panier) {
  localStorage.setItem('panier', JSON.stringify(panier));
}

// Render du panier et calcul des totaux
function renderPanier() {
  const panier = getPanier();
  const panierContainer = document.getElementById('panier-container');
  const totalAmountEl = document.getElementById('total-amount'); // total articles
  const fraisLivraisonEl = document.getElementById('frais-livraison');
  const totalPanierEl = document.getElementById('total-panier'); // total articles + frais
  panierContainer.innerHTML = '';

  const btnCheckout = document.getElementById('btn-checkout');

  if (panier.length === 0) {
    panierContainer.innerHTML = '<p>Votre panier est vide.</p>';
    totalAmountEl.textContent = '0 €';
    totalPanierEl.textContent = '0 €';
    if (btnCheckout) btnCheckout.disabled = true;
    return;
  }
  if (btnCheckout) btnCheckout.disabled = false;

  let totalArticles = 0;

  panier.forEach((produit) => {
    const quantite = produit.quantite || 1;
    const sousTotal = produit.prix * quantite;
    totalArticles += sousTotal;

    // Création de la carte
    const card = document.createElement('div');
    card.classList.add('panier-card');

    // Image
    const image = document.createElement('img');
    image.src = baseURL + produit.image[0];
    image.alt = produit.nom;
    image.addEventListener('click', () => {
      window.location.href = `/produit/${encodeURIComponent(
        produit.reference
      )}`;
    });

    // Détails
    const details = document.createElement('div');
    details.classList.add('panier-details');

    // Nom / lien
    const nom = document.createElement('h3');
    const lien = document.createElement('a');
    lien.href = `/produit/${produit.reference}`;
    lien.textContent = produit.nom;
    nom.appendChild(lien);

    // Prix unitaire
    const prixUni = document.createElement('p');
    prixUni.classList.add('prix-unitaire');
    prixUni.textContent = `Prix unitaire : ${produit.prix} €`;

    // Actions : quantité, sous-total, supprimer
    const actions = document.createElement('div');
    actions.classList.add('panier-actions');

    const quantiteLabel = document.createElement('label');
    quantiteLabel.setAttribute('for', `quantite-${produit._id}`);
    quantiteLabel.textContent = 'Quantité :';
    const quantiteInput = document.createElement('input');
    quantiteInput.type = 'number';
    quantiteInput.min = '1';
    quantiteInput.max = `${produit.stock}`;
    quantiteInput.value = quantite;
    quantiteInput.id = `quantite-${produit._id}`;
    quantiteInput.addEventListener('change', (e) => {
      let panierActu = getPanier();
      const index = panierActu.findIndex((p) => p._id === produit._id);
      if (index !== -1) {
        let newQ = parseInt(e.target.value, 10);
        if (isNaN(newQ) || newQ < 1) newQ = 1;
        if (newQ > produit.stock) newQ = produit.stock;
        panierActu[index].quantite = newQ;
        savePanier(panierActu);
        renderPanier();
      }
    });

    const sousTotalEl = document.createElement('p');
    sousTotalEl.classList.add('prix-unitaire');
    sousTotalEl.textContent = `Sous-total : ${(produit.prix * quantite).toFixed(
      2
    )} €`;

    const btnSupprimer = document.createElement('button');
    btnSupprimer.textContent = 'Supprimer';
    btnSupprimer.classList.add('btn-supprimer');
    btnSupprimer.addEventListener('click', () => {
      let panierActu = getPanier();
      panierActu = panierActu.filter((p) => p._id !== produit._id);
      savePanier(panierActu);
      renderPanier();
      updateFavorisCount();
    });

    actions.appendChild(quantiteLabel);
    actions.appendChild(quantiteInput);
    actions.appendChild(sousTotalEl);
    actions.appendChild(btnSupprimer);

    details.appendChild(nom);
    details.appendChild(prixUni);
    details.appendChild(actions);

    card.appendChild(image);
    card.appendChild(details);
    panierContainer.appendChild(card);
  });

  // Affichage total des articles
  const totalArticlesFormatted = totalArticles.toFixed(2) + ' €';
  totalAmountEl.textContent = totalArticlesFormatted;

  // Récupérer frais de livraison depuis le span (ex "4.99 €")
  let frais = 0;
  if (fraisLivraisonEl) {
    const txt = fraisLivraisonEl.textContent.trim();
    const num = parseFloat(txt.replace(/\s?€/, '').replace(',', '.'));
    if (!isNaN(num)) frais = num;
  }
  // Calcul total panier
  const totalPanier = totalArticles + frais;
  totalPanierEl.textContent = totalPanier.toFixed(2) + ' €';
}

// Fonctions pour autocomplétion d'adresse si désiré
function completeFormulaire() {
  const inputAdresse = document.getElementById('adresse');
  const dataList = document.getElementById('suggestions');
  const inputVille = document.getElementById('ville');
  const inputCodePostal = document.getElementById('code-postal');

  if (!inputAdresse) return;
  inputAdresse.addEventListener('input', async () => {
    const query = inputAdresse.value;
    if (query.length < 3) return;
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const data = await res.json();
      dataList.innerHTML = '';
      data.features.forEach((feature) => {
        const option = document.createElement('option');
        option.value = feature.properties.label;
        option.dataset.city = feature.properties.city;
        option.dataset.postcode = feature.properties.postcode;
        dataList.appendChild(option);
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des adresses :', error);
    }
  });

  inputAdresse.addEventListener('change', () => {
    const selected = [...dataList.options].find(
      (opt) => opt.value === inputAdresse.value
    );
    if (selected) {
      inputVille.value = selected.dataset.city || '';
      inputCodePostal.value = selected.dataset.postcode || '';
    }
  });
}

// Handle la soumission du formulaire de livraison
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  // Validation HTML5 : si invalide, on arrête
  if (!form.checkValidity()) {
    // Montre les messages de validation
    form.reportValidity();
    return;
  }
  // Récupérer les valeurs
  const nom = form.nom.value.trim();
  const adresse = form.adresse.value.trim();
  const ville = form.ville.value.trim();
  const cp = form['code-postal'].value.trim();
  const email = form.email.value.trim();
  const telephone = form.telephone.value.trim();

  // On peut refaire vérifications spécifiques si besoin
  if (!nom || !adresse || !ville || !cp || !email || !telephone) {
    alert('Merci de remplir tous les champs obligatoires.');
    return;
  }

  // Préparer les lignes de commande pour Stripe
  const panier = getPanier();
  if (panier.length === 0) {
    alert('Votre panier est vide.');
    return;
  }
  const lignes = panier.map((p) => ({
    id: p._id,
    quantite: p.quantite || 1,
  }));
  // Préparer l’objet customer à envoyer au backend (le backend peut l’enregistrer ou l’ajouter à la session)
  const customer = { nom, adresse, ville, cp, email, telephone };

  try {
    // Désactiver le bouton pour éviter multi-submit
    const btnSubmit = document.getElementById('btn-submit-livraison');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Redirection…';
    const session = await createStripeCheckoutSession(lignes, customer);
    // Redirection vers Stripe
    window.location.href = session.url;
  } catch (err) {
    console.error('Erreur de paiement :', err);
    await verifierPanierAvecStock();

    const btnSubmit = document.getElementById('btn-submit-livraison');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Valider et payer';
    }
  }
}
async function verifierPanierAvecStock() {
  let panier = JSON.parse(localStorage.getItem('panier')) || [];
  const produitsSupprimes = [];

  try {
    const produits = await getAllProducts(); // récupère tous les produits depuis la base

    // Vérifier chaque produit du panier
    // Vérification chaque produit
    panier = panier.filter((item) => {
      const produit = produits.find((p) => p._id === item._id);
      if (!produit || produit.stock <= 0) {
        // Stocker nom et catégorie pour la modale
        produitsSupprimes.push({
          nom: item.nom,
          categorie: produit ? produit.categorie : '',
        });
        return false; // retirer du panier
      }
      return true;
    });

    // Sauvegarder le panier filtré
    localStorage.setItem('panier', JSON.stringify(panier));

    // Rafraîchir l'affichage panier
    renderPanier();

    // Si des produits supprimés, afficher la modale
    if (produitsSupprimes.length > 0) {
      afficherModalProduitsSupprimes(produitsSupprimes);
    }
  } catch (err) {
    console.error('Erreur lors de la synchro panier:', err);
  }
}

function afficherModalProduitsSupprimes(produitsSupprimes) {
  const modal = document.getElementById('error-modal');
  const ul = document.getElementById('error-products');
  const btn = document.getElementById('refresh-cart');

  if (!modal || !ul || !btn) return; // sécurité

  // Remplir la liste
  ul.innerHTML = '';
  produitsSupprimes.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = `${p.categorie} ${p.nom} a été supprimé du panier (stock épuisé).`;
    ul.appendChild(li);
  });

  // Afficher la modale
  modal.style.display = 'flex';

  // Bouton pour rafraîchir la page
  btn.onclick = () => {
    modal.style.display = 'none';
    window.location.reload(); // recharge la page pour que tout soit à jour
  };
}

function init() {
  renderPanier();
  updateFavorisCount();
  // Préparer autocomplétion si implémenté
  completeFormulaire();
  verifierPanierAvecStock();

  const btnCheckout = document.getElementById('btn-checkout');
  const formLivraison = document.getElementById('form-livraison');

  if (btnCheckout && formLivraison) {
    // Au clic sur “Passer à la caisse”, on révèle ou replie le formulaire
    btnCheckout.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = formLivraison.classList.toggle('open');
      // Optionnel : changer le texte du bouton
      if (isOpen) {
        btnCheckout.textContent = 'Masquer le formulaire';
        // Scroll vers le formulaire pour que l'utilisateur voit bien
        formLivraison.scrollIntoView({ behavior: 'smooth' });
      } else {
        btnCheckout.textContent = 'Finaliser la commande';
      }
    });

    // Soumission du formulaire
    formLivraison.addEventListener('submit', handleFormSubmit);
  }
}

document.addEventListener('DOMContentLoaded', init);
