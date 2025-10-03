// favoris.js
import {
  updateFavorisCount,
  mettreAJourBoutonsPanier,
  initPageListePanier,
} from '../../global/addFavorisPanier.js';
import { getAllProducts, API_BASE } from '../../api/apiClient.js';

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  const productsData = await getAllProducts();
  getProduitFavoris(productsData);
  initPageListePanier(productsData);
  mettreAJourBoutonsPanier();
  updateFavorisCount();
});

const baseURL = API_BASE + '/';

// Fonction principale d'affichage des favoris
function getProduitFavoris(productsData) {
  const container = document.querySelector('.favoris-container');
  const messageVide = document.getElementById('message-vide');
  const favoris = JSON.parse(localStorage.getItem('favoris')) || [];

  container.innerHTML = ''; // Vide le conteneur avant de reconstruire

  if (favoris.length === 0) {
    messageVide.style.display = 'block';
    return;
  } else {
    messageVide.style.display = 'none';
  }

  favoris.forEach((fav) => {
    // Cherche le produit dans les données à jour
    const produit = productsData.find((p) => p._id === fav._id);
    if (!produit) return; // Produit supprimé de la base ?

    const card = document.createElement('div');
    card.classList.add('favori-card');

    const divInfoCard = document.createElement('div');
    divInfoCard.classList.add('div-info-card');

    const image = document.createElement('img');
    image.src = baseURL + produit.image[0];
    image.alt = produit.nom;
    image.addEventListener('click', () => {
      window.location.href = `/produit/${encodeURIComponent(
        produit.reference
      )}`;
    });

    const divTextCard = document.createElement('div');
    divTextCard.classList.add('div-text-card');

    const nom = document.createElement('h2');
    nom.textContent = produit.nom;

    const description = document.createElement('p');
    description.textContent = produit.description;

    const prix = document.createElement('p');
    prix.textContent = `Prix : ${produit.prix} €`;

    divTextCard.append(nom, description, prix);

    // Boutons
    const divBtn = document.createElement('div');
    divBtn.classList.add('div-btn');

    const btnAjouter = document.createElement('button');
    btnAjouter.dataset.id = produit._id;
    btnAjouter.dataset.stock = produit.stock;

    const btnSupprimer = document.createElement('button');
    btnSupprimer.textContent = 'Supprimer';
    btnSupprimer.classList.add('btn-supprimer-panier-favoris');
    btnSupprimer.onclick = () => supprimerFavoris(produit, card, messageVide);

    // Gestion du stock
    if (produit.stock <= 0) {
      // Stock épuisé
      const textRupture = document.createElement('p');
      textRupture.classList.add('text-rupture');
      textRupture.textContent = 'Rupture de stock';
      textRupture.style.right = 'initial';
      textRupture.style.left = '8px';
      textRupture.style.bottom = '0px';
      divInfoCard.style.position = 'relative';
      divInfoCard.appendChild(textRupture);

      btnAjouter.textContent = 'Rupture de stock';
      btnAjouter.disabled = true;
      btnAjouter.classList.add('is-rupture');
    } else {
      // Stock disponible
      btnAjouter.textContent = 'Ajouter au panier';
      btnAjouter.classList.add('btn-ajout-panier-favoris');
      btnAjouter.disabled = false;
    }

    divInfoCard.appendChild(image);
    divInfoCard.appendChild(divTextCard);
    divBtn.append(btnAjouter, btnSupprimer);
    card.append(divInfoCard, divBtn);
    container.appendChild(card);
  });
}

// Supprime un produit des favoris
function supprimerFavoris(produit, card, messageVide) {
  let favoris = JSON.parse(localStorage.getItem('favoris')) || [];
  favoris = favoris.filter((fav) => fav._id !== produit._id);
  localStorage.setItem('favoris', JSON.stringify(favoris));
  card.remove();
  updateFavorisCount();
  if (favoris.length === 0) {
    messageVide.style.display = 'block';
  }
}
