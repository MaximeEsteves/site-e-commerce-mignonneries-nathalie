// addFavorisPanier.js
export function updateFavorisCount() {
  const favoris = JSON.parse(localStorage.getItem('favoris')) || [];
  const panier = JSON.parse(localStorage.getItem('panier')) || [];

  // ✅ Tous les compteurs favoris (desktop + mobile)
  const compteursFavoris = document.querySelectorAll('.favoris-count');
  const iconesFavoris = document.querySelectorAll('.favoris i');

  compteursFavoris.forEach((compteur) => {
    compteur.textContent = favoris.length;
    compteur.style.display = favoris.length > 0 ? 'inline-block' : 'none';
  });

  iconesFavoris.forEach((icone) => {
    icone.classList.remove(favoris.length > 0 ? 'fa-regular' : 'fa-solid');
    icone.classList.add(favoris.length > 0 ? 'fa-solid' : 'fa-regular');
  });

  // ✅ Tous les compteurs panier (desktop + mobile)
  const compteursPanier = document.querySelectorAll('.panier-count');
  compteursPanier.forEach((compteurPanier) => {
    compteurPanier.textContent = panier.length;
    compteurPanier.style.display = panier.length > 0 ? 'inline-block' : 'none';
  });
}

let favorisListenerAjoute = false;

export function initPageListeFavoris(produits) {
  if (favorisListenerAjoute) return;
  favorisListenerAjoute = true;

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn-fav-article[data-id]');
    if (!btn) return;

    let favoris = JSON.parse(localStorage.getItem('favoris')) || [];
    const id = btn.dataset.id;
    const icon = btn.querySelector('i');
    const index = favoris.findIndex((f) => f._id === id);

    if (index === -1) {
      const produit = produits.find((p) => p._id === id);
      if (produit) {
        favoris.push(produit);
        icon.style.color = '#fce4da';
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
      }
    } else {
      favoris.splice(index, 1);
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    }

    localStorage.setItem('favoris', JSON.stringify(favoris));
    updateFavorisCount();
  });
}

let panierListenerAjoute = false;

export function initPageListePanier(produits) {
  if (panierListenerAjoute) return;
  panierListenerAjoute = true;

  document.addEventListener('click', (event) => {
    let panier = JSON.parse(localStorage.getItem('panier')) || [];

    // BTN "acheter"
    const btnAcheter = event.target.closest('.btn-acheter[data-id]');
    if (btnAcheter) {
      const id = btnAcheter.dataset.id;
      const index = panier.findIndex((p) => p._id === id);

      if (index === -1) {
        const produit = produits.find((p) => p._id === id);
        if (produit) {
          panier.push(produit);
          btnAcheter.textContent = 'Retirer du panier';
          btnAcheter.style.backgroundColor = 'transparent';
          btnAcheter.style.color = '#3a5151';
          btnAcheter.style.borderColor = '#3a5151';
        }
      } else {
        panier.splice(index, 1);
        btnAcheter.textContent = 'Ajouter';
        btnAcheter.style.backgroundColor = '';
        btnAcheter.style.color = '';
        btnAcheter.style.borderColor = '';
      }

      localStorage.setItem('panier', JSON.stringify(panier));
      updateFavorisCount();
      mettreAJourBoutonsPanier();
      return;
    }

    // BTN "ajout panier"
    const btnAjouterPanier = event.target.closest('.btn-ajout-panier[data-id]');
    if (btnAjouterPanier) {
      const stock = Number(btnAjouterPanier.dataset.stock || '0');

      if (stock <= 0 || btnAjouterPanier.disabled) {
        return; // 🚫 pas d’action en rupture
      }

      const id = btnAjouterPanier.dataset.id;
      const index = panier.findIndex((p) => p._id === id);

      if (index === -1) {
        const produit = produits.find((p) => p._id === id);
        if (produit) {
          panier.push(produit);
          btnAjouterPanier.textContent = 'Retirer du panier';
          btnAjouterPanier.style.backgroundColor = 'transparent';
          btnAjouterPanier.style.color = '#3a5151';
          btnAjouterPanier.style.borderColor = '#3a5151';
        }
      } else {
        panier.splice(index, 1);
        btnAjouterPanier.textContent = 'Ajouter au panier';
        btnAjouterPanier.style.backgroundColor = '';
        btnAjouterPanier.style.color = '';
        btnAjouterPanier.style.borderColor = '';
      }

      localStorage.setItem('panier', JSON.stringify(panier));
      updateFavorisCount();
      mettreAJourBoutonsPanier();
      return;
    }

    // BTN "ajout panier favoris"
    const btnAjouterPanierFavoris = event.target.closest(
      '.btn-ajout-panier-favoris[data-id]'
    );
    if (btnAjouterPanierFavoris) {
      const stock = Number(btnAjouterPanierFavoris.dataset.stock || '0');

      if (stock <= 0 || btnAjouterPanierFavoris.disabled) {
        return; // 🚫 pas d’action en rupture
      }
      const id = btnAjouterPanierFavoris.dataset.id;
      const index = panier.findIndex((p) => p._id === id);

      if (index === -1) {
        const produit = produits.find((p) => p._id === id);
        if (produit) {
          panier.push(produit);
          btnAjouterPanierFavoris.textContent = 'Retirer du panier';
          btnAjouterPanierFavoris.style.backgroundColor = 'green';
        }
      } else {
        panier.splice(index, 1);
        btnAjouterPanierFavoris.textContent = 'Ajouter au panier';
        btnAjouterPanierFavoris.style.backgroundColor = '';
      }

      localStorage.setItem('panier', JSON.stringify(panier));
      updateFavorisCount();
      mettreAJourBoutonsPanier();
      return;
    }
  });
}

// ✅ Met à jour aussi les boutons + icônes
export function mettreAJourBoutonsPanier() {
  const panier = JSON.parse(localStorage.getItem('panier')) || [];

  // Tous les boutons "ajout panier"
  const boutons = document.querySelectorAll('.btn-ajout-panier[data-id]');
  boutons.forEach((btn) => {
    const id = btn.dataset.id;
    const stock = Number(btn.dataset.stock ?? '0');
    // 🔒 Cas rupture : on fige le bouton et on n’écrase pas son texte ensuite
    if (stock <= 0) {
      btn.disabled = true;
      btn.classList.add('is-rupture');
      btn.innerHTML = '<span>Rupture de stock</span>';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.style.borderColor = '';

      return; // 👈 IMPORTANT : ne pas exécuter la suite qui change le texte
    }

    // Cas normal : bouton activé, on met le texte selon présence dans le panier
    btn.disabled = false;

    btn.classList.remove('is-rupture');

    const estDansPanier = panier.some((p) => p._id === id);

    if (estDansPanier) {
      btn.textContent = 'Retirer du panier';
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#3a5151';
      btn.style.borderColor = '#3a5151';
    } else {
      btn.textContent = 'Ajouter au panier';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }
  });

  // Tous les boutons "acheter"
  const boutonsAcheter = document.querySelectorAll('.btn-acheter[data-id]');
  boutonsAcheter.forEach((btn) => {
    const id = btn.dataset.id;
    const estDansPanier = panier.some((p) => p._id === id);

    if (estDansPanier) {
      btn.textContent = 'Retirer du panier';
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#3a5151';
      btn.style.borderColor = '#3a5151';
    } else {
      btn.textContent = 'Ajouter';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }
  });

  // Tous les boutons "ajout panier depuis favoris"
  const boutonsPanier = document.querySelectorAll(
    '.btn-ajout-panier-favoris[data-id]'
  );
  boutonsPanier.forEach((btn) => {
    const id = btn.dataset.id;
    const stock = Number(btn.dataset.stock ?? '0');
    // 🔒 Cas rupture : on fige le bouton et on n’écrase pas son texte ensuite
    if (stock <= 0) {
      btn.disabled = true;
      btn.classList.add('is-rupture');
      btn.innerHTML = '<span>Rupture de stock</span>';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.style.borderColor = '';

      return; // 👈 IMPORTANT : ne pas exécuter la suite qui change le texte
    }

    // Cas normal : bouton activé, on met le texte selon présence dans le panier
    btn.disabled = false;

    btn.classList.remove('is-rupture');
    const estDansPanier = panier.some((p) => p._id === id);

    if (estDansPanier) {
      btn.textContent = 'Retirer du panier';
      btn.style.backgroundColor = '#fce4da';
      btn.style.color = '#3a5151';
    } else {
      btn.textContent = 'Ajouter au panier';
      btn.style.backgroundColor = '#3a5151';
      btn.style.color = '';
    }
  });

  // ✅ Mettre à jour aussi les icônes favoris
  const favoris = JSON.parse(localStorage.getItem('favoris')) || [];
  const btnFavs = document.querySelectorAll('.btn-fav-article[data-id]');
  btnFavs.forEach((btn) => {
    const id = btn.dataset.id;
    const icon = btn.querySelector('i');
    if (favoris.find((f) => f._id === id)) {
      icon.style.color = '#fce4da';
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
    } else {
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    }
  });
}
