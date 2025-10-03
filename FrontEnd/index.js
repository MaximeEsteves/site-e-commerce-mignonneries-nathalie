import {
  getAllProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  avis,
  deleteAvis,
  validateAvis,
  commandeClient,
  ajoutCommandeClient,
  exportOrders,
  API_BASE,
} from './api/apiClient.js';
import {
  initPageListeFavoris,
  updateFavorisCount,
  initPageListePanier,
  mettreAJourBoutonsPanier,
} from './global/addFavorisPanier.js';
import { initCustomSwiper } from '../global/initCustomSwiper.js';
const baseURL = API_BASE + '/';
async function init() {
  try {
    const productsData = await getAllProducts();
    const isConnected = !!localStorage.getItem('token');

    if (isConnected) {
      displayConnectedView(productsData);
    } else {
      displayDisconnectedView(productsData);
    }

    mettreAJourBoutonsPanier();
    updateFavorisCount();
  } catch (error) {
    console.error('Erreur lors du chargement des produits :', error);
  }
}
function enterEditModeUI() {
  const userOpen = document.querySelector('.user-open');
  if (userOpen) {
    userOpen.textContent = 'log out';
    userOpen.style.fontWeight = '700';
    userOpen.style.cursor = 'pointer';
    userOpen.classList.add('mode-edition-logout');
  }
  if (!document.querySelector('.mode-edition')) {
    const body = document.body;
    const modeEdition = document.createElement('div');
    modeEdition.classList.add('mode-edition');
    modeEdition.innerHTML =
      '<i class="fa-solid fa-pen-to-square"></i><p>Mode édition</p>';
    body.style.marginTop = '59px';
    body.appendChild(modeEdition);
  }
}

// Ajoute le bouton "Ajouter un produit" dans la section titre
function addAddProductButton() {
  const h2 = document.querySelector('.titre-projet');
  if (h2 && !h2.querySelector('.div-modification')) {
    const btnAdd = document.createElement('button');
    const btnAvis = document.createElement('button');
    const btnCommande = document.createElement('button');
    btnAvis.classList.add('div-avis');
    btnAvis.innerHTML =
      '<i class="fa-solid fa-pen-to-square"></i><span>Voir les avis</span>';
    btnAvis.addEventListener('click', () => verifAvis());
    h2.appendChild(btnAvis);

    btnAdd.classList.add('div-modification');
    btnAdd.innerHTML =
      '<i class="fa-solid fa-pen-to-square"></i><span>Ajouter un produit</span>';
    btnAdd.addEventListener('click', () => initProductModal('add'));
    h2.appendChild(btnAdd);

    btnCommande.classList.add('div-commande');
    btnCommande.innerHTML =
      '<i class="fa-solid fa-pen-to-square"></i><span>Historique des ventes</span>';
    btnCommande.addEventListener('click', () => gestionArticle());
    h2.appendChild(btnCommande);
  }
}
// on transmet isConnected à totalProduits !
function displayConnectedView(productsData) {
  addAddProductButton();
  totalProduits(productsData, true);
  enterEditModeUI();
}

function displayDisconnectedView(productsData) {
  projets(productsData);
  filtres(productsData);
  initPageListeFavoris(productsData);
  initPageListePanier(productsData);
}

// Appel depuis init : totalProduits(productsData, isConnected);
function totalProduits(worksData, isConnected = false) {
  const portfolio = document.getElementById('portfolio');
  portfolio.classList.add('gallery');
  portfolio.innerHTML = '';

  // Observer pour lazy loading
  const imgObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    },
    { threshold: 0.1 }
  );

  worksData.forEach((produit) => {
    if (!produit._id) return;

    // Construction de la carte produit
    const figure = createProductFigure(produit, imgObserver);

    // Actions admin si connecté
    if (isConnected) {
      addAdminActions(figure, produit);
    }

    portfolio.appendChild(figure);
  });
}

function createProductFigure(produit, imgObserver) {
  const figure = document.createElement('figure');
  figure.dataset.id = produit._id;

  // Image + lazy-loading
  const divBg = document.createElement('div');
  divBg.classList.add('div-bg-card');
  const img = document.createElement('img');
  const raw = Array.isArray(produit.image)
    ? produit.image[0]
    : produit.image || '';
  img.dataset.src = baseURL + raw;
  img.alt = `image de ${produit.nom}`;
  img.classList.add('img-carousel');
  imgObserver.observe(img);
  divBg.appendChild(img);

  // Titre + prix
  const divPrix = document.createElement('div');
  divPrix.classList.add('div-titre-prix');
  divPrix.innerHTML = `<h3>${produit.nom}</h3><span>${produit.prix}€</span>`;

  // Description
  const description = document.createElement('p');
  description.classList.add('description-carte');
  description.textContent = produit.description;

  // Bouton favoris
  const btnFav = document.createElement('button');
  btnFav.classList.add('btn-fav-article');
  btnFav.dataset.id = produit._id;
  btnFav.innerHTML = '<i class="fa-regular fa-heart"></i>';
  btnFav.ariaLabel = 'Ajouter aux favoris';
  // Badge "Rupture de stock"
  if (produit.stock <= 0) {
    const badge = document.createElement('div');
    badge.classList.add('badge-rupture');
    badge.textContent = 'Rupture de stock';
    divBg.appendChild(badge);
  }

  // Clic sur l’image
  img.addEventListener('click', () => {
    window.location.href = `/produit/${produit.reference}`;
  });

  figure.append(divBg, divPrix, description, btnFav);
  return figure;
}

function addAdminActions(figure, produit) {
  // Supprimer
  const btnSupprimer = document.createElement('button');
  btnSupprimer.classList.add('icone-supprimer');
  btnSupprimer.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  btnSupprimer.addEventListener('click', () => deletePhoto(figure));

  // Modifier
  const btnModifier = document.createElement('button');
  btnModifier.classList.add('icone-modifier');
  btnModifier.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
  btnModifier.addEventListener('click', () =>
    initProductModal('edit', produit)
  );

  figure.append(btnSupprimer, btnModifier);
}

// Fonction d'affichage des filtres (adaptée pour recevoir les données)
function filtres(worksData) {
  // Si l'utilisateur est connecté, on ne montre pas les filtres
  if (localStorage.getItem('token')) {
    return;
  }
  const titre = document.querySelector('.titre-projet');

  // Si un ancien conteneur existe, on le supprime
  let oldZoneBtn = document.querySelector('.zone-btn');
  if (oldZoneBtn) oldZoneBtn.remove();

  // Si un ancien bouton toggle existe, on le supprime aussi
  let oldToggle = document.querySelector('.btn-toggle-filtres');
  if (oldToggle) oldToggle.remove();

  // Création du bouton toggle
  const btnToggle = document.createElement('button');
  btnToggle.type = 'button';
  btnToggle.innerText = 'Filtres';
  btnToggle.classList.add('btn-toggle-filtres');
  btnToggle.ariaLabel = 'Afficher les filtres';
  // État initial non ouvert
  btnToggle.classList.remove('open');

  // Création du conteneur des boutons de catégories
  const zoneBtn = document.createElement('div');
  zoneBtn.classList.add('zone-btn');
  // Ne pas ajouter la classe 'open' => est caché

  // Récupérer les catégories uniques
  const categoriesSet = new Set();
  worksData.forEach((article) => {
    categoriesSet.add(article.categorie);
  });

  // Bouton "Tous"
  const btnTous = document.createElement('button');
  btnTous.type = 'button';
  btnTous.innerText = 'Tous';
  btnTous.ariaLabel = 'Afficher tous les articles';
  btnTous.classList.add('btn-categorie', 'click-btn');
  btnTous.addEventListener('click', function () {
    // Retirer l'état click de tous, ajouter sur celui-ci
    document
      .querySelectorAll('.btn-categorie')
      .forEach((b) => b.classList.remove('click-btn'));
    document.getElementById('portfolio').innerHTML = '';
    projets(worksData);
    mettreAJourBoutonsPanier();
    btnTous.classList.add('click-btn');
  });
  zoneBtn.appendChild(btnTous);

  // Création dynamique des boutons de filtre par catégorie
  categoriesSet.forEach((category) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerText = category;
    btn.classList.add('btn-categorie');
    btn.addEventListener('click', function () {
      document
        .querySelectorAll('.btn-categorie')
        .forEach((b) => b.classList.remove('click-btn'));
      document.getElementById('portfolio').innerHTML = '';
      const filtered = worksData.filter(
        (article) => article.categorie === category
      );
      totalProduits(filtered);
      mettreAJourBoutonsPanier();
      btn.classList.add('click-btn');
    });
    zoneBtn.appendChild(btn);
  });

  titre.appendChild(btnToggle);
  titre.appendChild(zoneBtn);

  // Gestion du clic sur toggle : afficher/masquer
  btnToggle.addEventListener('click', () => {
    const isOpen = zoneBtn.classList.toggle('open');
    if (isOpen) {
      btnToggle.classList.add('open');
    } else {
      btnToggle.classList.remove('open');
    }
  });
}

// Fonction d'affichage des projets avec lazy loading
function projets(worksData) {
  const portfolio = document.getElementById('portfolio');
  portfolio.classList.add('gallery');
  portfolio.innerHTML = ''; // Vide le conteneur

  // 1) Regrouper les produits valides par catégorie
  const produitsParCat = new Map();
  for (const produit of worksData) {
    if (!produit._id) continue; // <- on garde uniquement les produits valides, même stock 0
    const cat = produit.categorie;
    if (!produitsParCat.has(cat)) {
      produitsParCat.set(cat, [produit]);
    } else {
      produitsParCat.get(cat).push(produit);
    }
  }

  // 2) Pour chaque catégorie, créer la figure avec carousel Swiper
  for (const [cat, produits] of produitsParCat.entries()) {
    const urls = produits.map((prod) => {
      const raw = Array.isArray(prod.image) ? prod.image[0] : prod.image || '';
      return baseURL + raw;
    });

    const figure = document.createElement('figure');
    figure.dataset.id = produits[0]._id;

    // --- Swiper Container ---
    const swiperContainer = document.createElement('div');
    swiperContainer.classList.add('swiper');

    const swiperWrapper = document.createElement('div');
    swiperWrapper.classList.add('swiper-wrapper');

    // Slides
    produits.forEach((prod, i) => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');

      const divBg = document.createElement('div');
      divBg.classList.add('div-bg-card');

      const imgEl = document.createElement('img');
      imgEl.src = urls[i];
      imgEl.alt = `Image de ${prod.nom || cat}`;
      imgEl.classList.add('img-carousel');

      // Clic sur l'image => redirection produit
      imgEl.addEventListener('click', () => {
        if (prod.reference) {
          window.location.href = `/produit/${prod.reference}`;
        }
      });

      // Badge "Rupture de stock"
      if (prod.stock <= 0) {
        const badge = document.createElement('div');
        badge.classList.add('badge-rupture');
        badge.textContent = 'Rupture de stock';
        divBg.appendChild(badge);
      }
      divBg.appendChild(imgEl);
      slide.appendChild(divBg);
      swiperWrapper.appendChild(slide);
    });

    swiperContainer.appendChild(swiperWrapper);

    // Boutons Prev / Next
    if (urls.length > 1) {
      const btnPrev = document.createElement('div');
      btnPrev.classList.add('swiper-button-prev');
      const btnNext = document.createElement('div');
      btnNext.classList.add('swiper-button-next');
      swiperContainer.appendChild(btnPrev);
      swiperContainer.appendChild(btnNext);
    }

    figure.appendChild(swiperContainer);

    // --- Détails (titre, prix, desc, favoris) ---
    const divPrix = document.createElement('div');
    divPrix.classList.add('div-titre-prix');
    const figcaption = document.createElement('h3');
    figcaption.textContent = cat;
    const prix = document.createElement('span');
    prix.textContent = `${produits[0].prix}€`;

    divPrix.appendChild(figcaption);
    divPrix.appendChild(prix);
    figure.appendChild(divPrix);

    const description = document.createElement('p');
    description.classList.add('description-carte');
    description.textContent = produits[0].description;
    figure.appendChild(description);

    const btnFav = document.createElement('button');
    btnFav.classList.add('btn-fav-article');
    btnFav.dataset.id = produits[0]._id;
    btnFav.ariaLabel = 'Ajouter aux favoris';
    const iconFav = document.createElement('i');
    iconFav.classList.add('fa-regular', 'fa-heart');
    btnFav.appendChild(iconFav);
    figure.appendChild(btnFav);

    portfolio.appendChild(figure);

    // --- Initialisation Swiper ---
    const swiper = initCustomSwiper(
      swiperContainer,
      {
        navigation: {
          nextEl: swiperContainer.querySelector('.swiper-button-next'),
          prevEl: swiperContainer.querySelector('.swiper-button-prev'),
        },
      },
      produits,
      {
        onSlideChange: (prod) => {
          prix.textContent = `${prod.prix}€`;
          description.textContent = prod.description;
          btnFav.dataset.id = prod._id;
          // update favoris
          const favoris = JSON.parse(localStorage.getItem('favoris')) || [];
          const isFav = favoris.some((f) => f._id === prod._id);
          if (isFav) {
            iconFav.style.color = '#fce4da';
            iconFav.classList.replace('fa-regular', 'fa-solid');
          } else {
            iconFav.style.color = '';
            iconFav.classList.replace('fa-solid', 'fa-regular');
          }
        },
      }
    );
  }
}

// 1) Initialiser Quill (à faire une seule fois)
const editorDescriptionComplete = new Quill('#editor-descriptionComplete', {
  theme: 'snow',
});

// Placeholder for global validator
let validateCbGlobal;

// Écoute du Quill pour valider le formulaire lors de changements
editorDescriptionComplete.on('text-change', () => {
  if (typeof validateCbGlobal === 'function') validateCbGlobal();
});

// Validation du formulaire
function validateForm(
  form,
  gallery,
  coverErrorElem,
  multiErrorElem,
  btnSubmit,
  editor
) {
  const fields = [
    'categorie',
    'nom',
    'titreDescription',
    'description',
    'materiaux',
    'prix',
    'reference',
    'stock',
  ];
  let valid = fields.every(
    (name) => form.elements[name].value.trim().length > 0
  );
  // Vérifier contenu description complète
  const fullDesc = editor.root.innerText.trim();
  valid = valid && fullDesc.length > 0;
  // Vérifier qu'au moins une image multiple est présente
  valid = valid && gallery.querySelectorAll('img').length >= 1;
  // Aucune erreur sur les fichiers
  valid = valid && !coverErrorElem.textContent && !multiErrorElem.textContent;

  btnSubmit.disabled = !valid;
  if (valid) {
    btnSubmit.style.cssText =
      'background-color:#3a5151;cursor:pointer;border:1px solid white;color:white;';
  } else {
    btnSubmit.style.cssText =
      'background-color:gray;cursor:not-allowed;border:1px solid #3a5151;color:white;';
  }
}
let cropperInstance = null;
let cropperCallback = null;

function openCropper(file, callback) {
  const modal = document.getElementById('cropper-modal');
  const img = document.getElementById('cropper-image');
  const applyBtn = document.getElementById('cropper-apply');
  const cancelBtn = document.getElementById('cropper-cancel');

  cropperCallback = callback;
  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result;
    modal.style.display = 'flex';

    // Forcer la taille du cropper à celle du conteneur
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';

    if (cropperInstance) cropperInstance.destroy();
    cropperInstance = new Cropper(img, {
      aspectRatio: NaN,
      viewMode: 1,
      autoCropArea: 0.5,
      movable: true,
      zoomable: false,
      rotatable: true,
      scalable: true,
      background: true, // affiche la zone hors crop
      highlight: true, // met en évidence la zone crop
      cropBoxResizable: true,
      cropBoxMovable: true,
    });
  };

  reader.readAsDataURL(file);

  applyBtn.onclick = () => {
    if (!cropperInstance) return;
    cropperInstance.getCroppedCanvas().toBlob((blob) => {
      const croppedFile = new File([blob], file.name, { type: file.type });
      cropperCallback(croppedFile);
      modal.style.display = 'none';
      cropperInstance.destroy();
      cropperInstance = null;
    }, file.type);
  };

  cancelBtn.onclick = () => {
    modal.style.display = 'none';
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
  };
}

// Gestion preview couverture
function handleCoverUpload(
  couvertureInput,
  previewCover,
  coverErrorElem,
  validateCb
) {
  couvertureInput.value = '';
  couvertureInput.onchange = () => {
    coverErrorElem.textContent = '';
    const file = couvertureInput.files[0];
    if (!file) return validateCb();
    if (file.size > 4 * 1024 * 1024) {
      coverErrorElem.textContent = 'Le fichier dépasse 4 Mo.';
      return validateCb();
    }
    const types = ['image/jpeg', 'image/png', 'image/webp'];
    if (!types.includes(file.type)) {
      coverErrorElem.textContent = 'Seuls JPG, WEBP et PNG sont autorisés.';
      return validateCb();
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Ouvre cropper pour couverture
      openCropper(file, (croppedFile) => {
        const croppedReader = new FileReader();
        croppedReader.onload = () => {
          previewCover.src = croppedReader.result;
          previewCover.alt = croppedFile.name;
          previewCover.style.display = 'block';

          // Remplacer le fichier original
        };
        croppedReader.readAsDataURL(croppedFile);
        couvertureInput.files = new DataTransfer().files; // créer un DataTransfer pour remplacer
        const dt = new DataTransfer();
        dt.items.add(croppedFile);
        couvertureInput.files = dt.files;
        validateCb();
      });
    };

    reader.readAsDataURL(file);
  };
}

// Gestion preview images multiples
let selectedMultiFiles = [];

function handleMultiUpload(multiInput, gallery, multiErrorElem, validateCb) {
  multiInput.onchange = () => {
    multiErrorElem.textContent = '';
    const files = Array.from(multiInput.files);

    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) {
        multiErrorElem.textContent = 'Chaque fichier doit être <4 Mo.';
        multiInput.value = '';
        return validateCb();
      }
      const types = ['image/jpeg', 'image/png', 'image/webp'];
      if (!types.includes(file.type)) {
        multiErrorElem.textContent = 'Seuls JPG, WEBP et PNG sont autorisés.';
        multiInput.value = '';
        return validateCb();
      }
    }

    // Pour chaque fichier, on ouvre le cropper puis on l'ajoute seulement à selectedMultiFiles après crop
    files.forEach((file) => {
      openCropper(file, (croppedFile) => {
        const reader = new FileReader();
        reader.onload = () => {
          const figure = document.createElement('figure');
          figure.classList.add('image-wrapper');
          figure.innerHTML = `
            <button type="button" class="icone-supprimer-modal">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <img src="${reader.result}" alt="${croppedFile.name}" class="image-preview" />
          `;
          figure.querySelector('button').onclick = () => {
            figure.remove();
            selectedMultiFiles = selectedMultiFiles.filter(
              (f) => f !== croppedFile
            );
            validateCb();
          };
          gallery.appendChild(figure);
          // On ajoute le fichier cropper **UNE SEULE FOIS**
          selectedMultiFiles.push(croppedFile);
          validateCb();
        };
        reader.readAsDataURL(croppedFile);
      });
    });

    multiInput.value = ''; // reset pour permettre reupload
  };
}

// === Fonction principale ===
async function initProductModal(mode, produit = {}) {
  const overlay = document.querySelector('.modal-content');
  const modal = document.querySelector('.modal');
  const form = modal.querySelector('#product-form');
  const btnSubmit = form.querySelector('button[type=submit]');
  const couvertureInput = document.getElementById('file-upload-couverture');
  const multiInput = document.getElementById('file-upload-images');
  const previewCover = document.getElementById('preview-couverture');
  const gallery = document.getElementById('preview-multi-images');
  const hiddenDescInput = document.getElementById('input-descriptionComplete');
  // 🟢 IMPORTANT : reset des fichiers sélectionnés pour éviter les doublons
  selectedMultiFiles = [];

  // Setup initial button state
  btnSubmit.disabled = true;
  btnSubmit.style.cssText =
    'background-color:gray;cursor:not-allowed;border:1px solid #3a5151;color:white;';

  // Normalisation des URLs
  if (produit.imageCouverture)
    produit.imageCouverture = produit.imageCouverture.replace(
      /^https?:\/\/[^/]+\//,
      ''
    );
  if (Array.isArray(produit.image))
    produit.image = produit.image.map((img) =>
      img.replace(/^https?:\/\/[^/]+\//, '')
    );

  // Titre et texte du bouton
  const titreModal = modal.querySelector('.titre-modal');
  if (mode === 'add') {
    titreModal.textContent = 'Ajouter un produit';
    btnSubmit.textContent = 'Créer';
  } else {
    titreModal.textContent = 'Modifier le produit';
    btnSubmit.textContent = 'Mettre à jour';
  }

  // Images à supprimer
  const imagesASupprimer = [];

  // Afficher image de couverture existante en mode edit
  if (mode === 'edit' && produit.imageCouverture) {
    previewCover.src = baseURL + produit.imageCouverture;
    previewCover.alt = 'Image de couverture';
    previewCover.style.display = 'block';
  } else {
    previewCover.style.display = 'none';
  }

  // Remplissage autres champs
  if (mode === 'edit') {
    Object.entries({
      categorie: produit.categorie,
      nom: produit.nom,
      titreDescription: produit.titreDescription,
      description: produit.description,
      materiaux: produit.materiaux,
      prix: produit.prix,
      reference: produit.reference,
      stock: produit.stock,
    }).forEach(([key, val]) => (form.elements[key].value = val || ''));
    editorDescriptionComplete.clipboard.dangerouslyPasteHTML(
      produit.descriptionComplete || ''
    );
  } else {
    form.reset();
    editorDescriptionComplete.setContents([]);
  }

  // Galerie initiale
  gallery.innerHTML = '';
  if (mode === 'edit' && Array.isArray(produit.image)) {
    produit.image.forEach((relPath, idx) => {
      const figure = document.createElement('figure');
      figure.classList.add('image-wrapper');
      figure.innerHTML = `
        <button type="button" class="icone-supprimer-modal">
          <i class="fa-solid fa-trash-can"></i>
        </button>
        <img src="${baseURL + relPath}" alt="Image ${
        produit.categorie +
        ' ' +
        produit.nom +
        ' ' +
        produit.reference +
        ' ' +
        (idx + 1)
      }" class="image-preview" />
      `;
      figure.querySelector('button').onclick = () => {
        imagesASupprimer.push(relPath);
        figure.remove();
        selectedMultiFiles = selectedMultiFiles.filter(
          (f) => f.name !== relPath && f.name !== relPath.split('/').pop()
        );
        validateCbGlobal();
      };
      gallery.appendChild(figure);
    });
  }

  // Élément d'erreur
  const coverErrorElem = couvertureInput
    .closest('.custom-file-upload')
    .querySelector('.text-error-add-photo');
  const multiErrorElem = multiInput
    .closest('.custom-file-upload')
    .querySelector('.text-error-add-photo');

  // Init handlers & validation callback
  const validateCb = () =>
    validateForm(
      form,
      gallery,
      coverErrorElem,
      multiErrorElem,
      btnSubmit,
      editorDescriptionComplete
    );
  validateCbGlobal = validateCb;

  handleCoverUpload(couvertureInput, previewCover, coverErrorElem, validateCb);
  handleMultiUpload(multiInput, gallery, multiErrorElem, validateCb);

  // Écouteurs
  form.addEventListener('input', validateCb);

  // Affichage modal
  modal.style.display = 'flex';
  overlay.style.display = 'flex';
  // Soumission
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (btnSubmit.disabled) return;

    const token = localStorage.getItem('token');
    if (!token) return alert('Vous devez être connecté.');

    hiddenDescInput.value = editorDescriptionComplete.root.innerHTML;
    const formData = new FormData(form);

    // Ajouter les fichiers multiples stockés
    for (const file of selectedMultiFiles) {
      formData.append('image', file);
    }

    // Ajouter les images supprimées
    imagesASupprimer.forEach((path) =>
      formData.append('imagesASupprimer', path)
    );

    try {
      mode === 'add'
        ? await createProduct(formData, token)
        : await updateProduct(produit._id, formData, token);

      overlay.style.display = 'none';
      modal.style.display = 'none';

      const data = await getAllProducts();
      totalProduits(data, !!token);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };
}

// //* Fonction fermeture de la modale */
function closeModal() {
  const modal = document.querySelector('.modal');
  const modalContent = document.querySelector('.modal-content');
  modal.style.display = 'none';
  modalContent.style.display = 'none';

  const modalavis = document.querySelector('.modal-content-avis');
  const modalContentavis = document.querySelector('.modal-avis');
  modalavis.style.display = 'none';
  modalContentavis.style.display = 'none';

  const modalCommande = document.querySelector('.modal-content-gestion');
  const modalContentCommande = document.querySelector('.modal-gestion');
  modalCommande.style.display = 'none';
  modalContentCommande.style.display = 'none';

  // Réinitialiser le formulaire
  const form = document.querySelector('#product-form');
  if (form) form.reset();

  // Réinitialiser le bouton
  const btnSubmit = form?.querySelector('button[type=submit]');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.style.cssText =
      'background-color:gray;cursor:not-allowed;border:1px solid #3a5151;color:white;';
  }

  // Réinitialiser les variables globales liées aux images
  selectedMultiFiles = [];
  validateCbGlobal = null;

  // Réinitialiser le contenu des prévisualisations
  const gallery = document.getElementById('preview-multi-images');
  if (gallery) gallery.innerHTML = '';
  const previewCover = document.getElementById('preview-couverture');
  if (previewCover) {
    previewCover.src = '';
    previewCover.style.display = 'none';
  }

  // Réinitialiser l'éditeur Quill
  if (window.editorDescriptionComplete) {
    editorDescriptionComplete.setContents([]);
  }
}

// /* fonction de suppression de la photo, reçoit la figure à supprimer */
async function deletePhoto(figure) {
  const id = figure.dataset.id;
  if (!id) {
    console.error("Aucun ID n'est associé à ce produit.");
    return;
  }

  const token = window.localStorage.getItem('token');
  try {
    deleteProduct(id, token);
    figure.remove();
  } catch (error) {
    console.error('Erreur pendant la suppression :', error);
  }
}

// eventListener "click"
document.body.addEventListener('click', function (e) {
  if (e.target.closest('.btn-close')) {
    closeModal();
  }
  const modalContent = document.querySelector('.modal-content-avis');
  if (e.target === modalContent) {
    // au clic en dehors de la modale, ferme la modale
    closeModal();
  }
  if (e.target.closest('.div-modification')) {
    initProductModal('add');
  }
});

async function verifAvis() {
  const divAvis = document.querySelector('.modal-content-avis');
  const divAvisOverlay = document.querySelector('.modal-avis');
  divAvis.style.display = 'flex';
  divAvisOverlay.style.display = 'flex';

  const container = document.getElementById('table-container');
  container.innerHTML = '<p>Chargement des avis...</p>';

  try {
    const avisList = await avis();

    if (!avisList || avisList.length === 0) {
      container.innerHTML = '<p>Aucun avis trouvé.</p>';
      return;
    }

    let html = `
      <table class="avis-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Nom</th>
            <th>Note</th>
            <th>Commentaire</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    avisList.forEach((a) => {
      const date = new Date(a.date).toLocaleDateString('fr-FR');
      html += `
<tr data-id="${a._id}">
  <td>${a.productRef}</td>
  <td>${a.nom}</td>
  <td>${'⭐'.repeat(a.note)}</td>
  <td>
    <div class="comment-cell">${a.commentaire}</div>
  </td>
  <td>${date}</td>
  <td>
    ${
      a.validated
        ? ''
        : `<button class="btn-validate" data-id="${a._id}">✔</button>`
    }
    <button class="btn-delete" data-id="${a._id}">🗑️</button>
  </td>
</tr>
`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Ajout des listeners sur les boutons "Supprimer"
    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        try {
          await deleteAvis(id);
          // Retire la ligne supprimée du tableau
          document.querySelector(`tr[data-id="${id}"]`).remove();
        } catch (err) {
          alert('Erreur lors de la suppression de l’avis.');
          console.error(err);
        }
      });
    });
    document.querySelectorAll('.btn-validate').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        try {
          await validateAvis(id);
          // Supprime le bouton valider pour refléter le changement
          e.target.remove();
        } catch (err) {
          alert('Erreur lors de la validation de l’avis.');
          console.error(err);
        }
      });
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Erreur lors du chargement des avis.</p>';
  }
}

// Modal de gestion //
async function gestionArticle() {
  const divAvis = document.querySelector('.modal-content-gestion');
  const divAvisOverlay = document.querySelector('.modal-gestion');
  const tableGestion = document.querySelector(
    '.modal-gestion-filtres .gestion-table'
  );

  const selectAnnee = document.getElementById('select-gestion-annee');
  const selectMois = document.getElementById('select-gestion-mois');

  divAvis.style.display = 'flex';
  divAvisOverlay.style.display = 'flex';

  try {
    const orders = await commandeClient();

    // ==== Remplir sélecteur Année ====
    const startYear = 2023;
    const currentYear = new Date().getFullYear();

    const annees = [];
    for (let y = currentYear; y >= startYear; y--) {
      annees.push(y);
    }

    selectAnnee.innerHTML = annees
      .map((year) => `<option value="${year}">${year}</option>`)
      .join('');

    // ==== Remplir sélecteur Mois ====
    const moisNoms = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];

    selectMois.innerHTML = moisNoms
      .map((mois, i) => `<option value="${i + 1}">${mois}</option>`)
      .join('');

    // ==== Afficher le détail commandes filtrées ====
    function renderTable() {
      const selectedYear = parseInt(selectAnnee.value, 10);
      const selectedMonth = parseInt(selectMois.value, 10);

      tableGestion.innerHTML = '';

      orders.forEach((order) => {
        const date = new Date(order.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (year === selectedYear && month === selectedMonth) {
          order.articles.forEach((a) => {
            const revenu = a.quantite * a.prixUnitaire;
            const html = `
              <tr data-id="${order._id}">
                <td>${date.toLocaleDateString('fr-FR')}</td>
                <td>${a.categorie} ${a.nom}</td>
                <td style="text-align:center;">${a.reference}</td>
                <td style="text-align:center;">${a.quantite}</td>
                <td style="text-align:center;">${revenu} €</td>
                <td style="text-align:center;">${order.internet ? 'X' : ''}</td>
                <td style="text-align:center;">${order.internet ? '' : 'X'}</td>
              </tr>
            `;
            tableGestion.insertAdjacentHTML('beforeend', html);
          });
        }
      });
    }

    // ==== Afficher le résumé mensuel ====
    function renderResume() {
      const selectedYear = parseInt(selectAnnee.value, 10);

      // Initialisation des totaux
      const resume = Array.from({ length: 12 }, () => ({
        revenu: 0,
        qte: 0,
      }));

      // Parcourir les commandes de l'année sélectionnée
      orders.forEach((order) => {
        const date = new Date(order.date);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11

        if (year === selectedYear) {
          order.articles.forEach((a) => {
            resume[month].revenu += a.quantite * a.prixUnitaire;
            resume[month].qte += a.quantite;
          });
        }
      });

      // Mise à jour du tableau HTML
      const moisClasses = [
        'janvier',
        'fevrier',
        'mars',
        'avril',
        'mai',
        'juin',
        'juillet',
        'aout',
        'septembre',
        'octobre',
        'novembre',
        'decembre',
      ];

      moisClasses.forEach((m, i) => {
        document.querySelector(`.revenu-${m}`).textContent =
          resume[i].revenu.toFixed(2) + ' €';
        document.querySelector(`.qte-vente-${m}`).textContent = resume[i].qte;
      });

      // Met à jour l'entête avec l'année choisie
      document.querySelector(
        '.modal-gestion-charges-mensuel-table thead th:first-child'
      ).textContent = selectedYear;
    }

    // ==== Événements ====
    selectAnnee.addEventListener('change', () => {
      renderTable();
      renderResume();
      renderTrimestre(orders, parseInt(selectAnnee.value, 10));
      renderAnnuel(orders, parseInt(selectAnnee.value, 10));
    });
    selectMois.addEventListener('change', renderTable);

    // ==== Affichage initial ====
    renderTable();
    renderResume();
    renderTrimestre(orders, parseInt(selectAnnee.value, 10));
    renderAnnuel(orders, parseInt(selectAnnee.value, 10));
  } catch (err) {
    console.error('Erreur lors du chargement des commandes:', err);
  }
}

function renderTrimestre(orders, selectedYear) {
  // Initialisation des trimestres
  const trimestres = [0, 0, 0, 0]; // [Q1, Q2, Q3, Q4]

  // Regrouper par trimestre
  orders.forEach((order) => {
    const date = new Date(order.date);
    const year = date.getFullYear();

    if (year === selectedYear) {
      // Calcul du total de la commande
      let totalCommande = 0;

      order.articles.forEach((a) => {
        totalCommande += a.quantite * a.prixUnitaire;
      });

      const month = date.getMonth(); // 0-11
      const trimestreIndex = Math.floor(month / 3); // 0 à 3

      if (order.internet) {
        // Appliquer frais Mollie : 1.2% + 0.25€ fixe
        const commission = totalCommande * 0.012 + 0.25;
        trimestres[trimestreIndex] += totalCommande - commission;
      } else {
        trimestres[trimestreIndex] += totalCommande;
      }
    }
  });

  // URSSAF et progression
  trimestres.forEach((revenu, i) => {
    const urssaf = revenu * 0.128;
    const revenuCell = document.querySelector(
      `.revenu-trimestre-${['un', 'deux', 'trois', 'quatre'][i]}`
    );
    const urssafCell = document.querySelector(
      `.ursaff-trimestre-${['un', 'deux', 'trois', 'quatre'][i]}`
    );
    const progressionCell = document.querySelector(
      `.progression-trimestre-${['un', 'deux', 'trois', 'quatre'][i]}`
    );

    // Mise à jour du revenu et URSSAF
    revenuCell.textContent = revenu.toFixed(2) + ' €';
    urssafCell.textContent = urssaf.toFixed(2) + ' €';

    // Progression (sauf pour le T1 qui n'a pas de référence précédente)
    if (i === 0) {
      progressionCell.textContent = '-';
    } else {
      const prev = trimestres[i - 1];
      if (prev > 0) {
        const progression = ((revenu - prev) / prev) * 100;
        const signe = progression >= 0 ? '+' : '';
        progressionCell.textContent = signe + progression.toFixed(1) + ' %';
      } else {
        progressionCell.textContent = '0 %';
      }
    }
  });
}

function renderAnnuel(orders, selectedYear) {
  let qteTotal = 0;
  let revenuMagasin = 0;
  let revenuInternetNet = 0;
  let totalCommissionMollie = 0;
  orders.forEach((order) => {
    const date = new Date(order.date);
    const year = date.getFullYear();

    if (year === selectedYear) {
      // Revenu total de la commande
      let totalCommande = 0;

      order.articles.forEach((a) => {
        const revenu = a.quantite * a.prixUnitaire;
        qteTotal += a.quantite;
        totalCommande += revenu;
      });

      if (order.internet) {
        // Commission Mollie : 1.2% + 0.25€ fixe
        const commission = totalCommande * 0.012 + 0.25;
        totalCommissionMollie += commission;

        // Net après Mollie
        revenuInternetNet += totalCommande - commission;
      } else {
        revenuMagasin += totalCommande;
      }
    }
  });

  // Revenu brut annuel
  const revenuBrut = revenuMagasin + revenuInternetNet;

  // URSSAF 12.8%
  const ursaff = revenuBrut * 0.128;

  // Revenu net annuel
  const revenuNet = revenuBrut - ursaff;

  // === Mise à jour des cellules HTML ===
  document.querySelector('.qte-total-vente-annuel').textContent = qteTotal;

  document.querySelectorAll('.revenu-total-magasin').textContent =
    revenuMagasin.toFixed(2) + ' €';
  document.querySelectorAll('.revenu-total-internet').textContent =
    revenuInternetNet.toFixed(2) + ' €';
  document.querySelector('.revenu-total-ursaff').textContent =
    revenuBrut.toFixed(2) + ' €';
  document.querySelector('.revenu-total-net').textContent =
    revenuNet.toFixed(2) + ' €';
}

// === Sélecteurs DOM ===
const modalAjout = document.querySelector('.modal-content-ajout-commande');
const btnAjouter = document.querySelector('.modal-gestion-ajout-article');
const btnCancel = document.getElementById('cancel-article');

const selectCategorie = document.getElementById('select-categorie');
const selectNom = document.getElementById('select-nom');
const selectReference = document.getElementById('select-reference');
const inputPrix = document.getElementById('article-prix');
const inputDate = document.querySelectorAll('.article-date');
const inputQuantite = document.getElementById('article-quantite');
const btnAjouterArticle = document.getElementById('btn-ajouter-article');
const submitCommande = document.getElementById('submit-commande');
const listeArticles = document.getElementById('liste-articles-selectionnes');

const manualFields = document.querySelector('.manual-article-fields');
const btnAjouterManuel = document.getElementById('btn-ajouter-manuel');

// === Variables globales ===
let products = [];
let commandeTemp = [];

// === Fonctions ===

// Charger les produits depuis l’API
async function chargerProduits() {
  products = await getAllProducts();
  const categories = [...new Set(products.map((p) => p.categorie))];
  selectCategorie.innerHTML =
    `<option value="">--Choisir une catégorie--</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join('');
}

// Ouvrir la modale
async function ouvrirModal() {
  modalAjout.style.display = 'flex';
  try {
    await chargerProduits();
  } catch (err) {
    console.error('Erreur lors du chargement du stock:', err);
  }
}

// Fermer la modale
function fermerModal() {
  modalAjout.style.display = 'none';
  commandeTemp = [];
  listeArticles.innerHTML = '';
}

// Mettre à jour les noms en fonction de la catégorie
function majNoms() {
  const nomOptions = products
    .filter((p) => p.categorie === selectCategorie.value)
    .map((p) => p.nom);
  const nomsUniques = [...new Set(nomOptions)];

  selectNom.innerHTML =
    `<option value="">--Choisir un nom--</option>` +
    nomsUniques.map((n) => `<option value="${n}">${n}</option>`).join('');

  selectNom.disabled = false;
  selectReference.innerHTML = `<option value="">--Choisir une référence--</option>`;
  selectReference.disabled = true;
  inputPrix.value = '';
  inputPrix.disabled = true;
}

// Mettre à jour les références en fonction du nom
function majReferences() {
  const refOptions = products.filter(
    (p) => p.categorie === selectCategorie.value && p.nom === selectNom.value
  );

  selectReference.innerHTML =
    `<option value="">--Choisir une référence--</option>` +
    refOptions
      .map(
        (r) =>
          `<option value="${r._id}" data-prix="${r.prixUnitaire}">${r.reference}</option>`
      )
      .join('');

  selectReference.disabled = false;
  inputPrix.value = '';
  inputPrix.disabled = true;
}

// Mettre à jour le prix quand on choisit une référence
function majPrix() {
  const selected = selectReference.selectedOptions[0];
  if (selected) {
    inputPrix.value = selected.dataset.prix;
    inputPrix.disabled = false;
  }
}

// === Ajouter un article du stock avec vérif stock ===
function ajouterArticleStock() {
  const selected = selectReference.selectedOptions[0];
  if (!selected) {
    alert('Veuillez choisir une référence.');
    return;
  }

  const produitId = selected.value;
  const produit = products.find((p) => p._id === produitId);
  const dateValue = inputDate[0].value; // premier champ date

  const article = {
    produitId,
    date: dateValue ? new Date(dateValue).toISOString() : null, // ⚡ undefined => mongoose applique default
    categorie: selectCategorie.value,
    nom: selectNom.value,
    reference: selected.textContent,
    prixUnitaire: parseFloat(inputPrix.value),
    quantite: parseInt(inputQuantite.value, 10),
  };

  // Validation des champs
  if (
    !article.categorie ||
    !article.nom ||
    !article.reference ||
    !article.prixUnitaire ||
    isNaN(article.quantite)
  ) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  if (article.quantite <= 0) {
    alert('La quantité doit être supérieure à 0.');
    return;
  }

  // Vérifier le stock disponible
  if (
    produit &&
    produit.stock !== undefined &&
    article.quantite > produit.stock
  ) {
    alert(`Stock insuffisant ! Disponible : ${produit.stock}`);
    return;
  }

  commandeTemp.push(article);

  const li = document.createElement('li');
  const affichageDate = article.date
    ? new Date(article.date).toLocaleDateString()
    : 'Non défini';
  li.textContent = `${article.categorie} - ${article.nom} (${article.reference}) x${article.quantite} à ${article.prixUnitaire} € [${affichageDate}]`;
  listeArticles.appendChild(li);

  // Reset
  selectNom.value = '';
  selectReference.innerHTML = `<option value="">--Choisir une référence--</option>`;
  inputPrix.value = '';
  inputQuantite.value = '';
}

// === Ajouter un article manuel avec quantité >= 0 ===
function ajouterArticleManuel() {
  const categorie = document.getElementById('manual-categorie').value.trim();
  const nom = document.getElementById('manual-nom').value.trim();
  const reference = document.getElementById('manual-reference').value.trim();
  const prixUnitaire = parseFloat(document.getElementById('manual-prix').value);
  const quantite = parseInt(
    document.getElementById('manual-quantite').value,
    10
  );

  if (!categorie || !nom || !reference || !prixUnitaire || isNaN(quantite)) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  if (quantite < 0) {
    alert('La quantité ne peut pas être négative.');
    return;
  }

  const dateValue = inputDate[1].value; // deuxième champ date
  const article = {
    categorie,
    nom,
    reference,
    prixUnitaire,
    quantite,
    date: dateValue ? new Date(dateValue).toISOString() : null, // ⚡ undefined => mongoose applique default
  };
  commandeTemp.push(article);

  const li = document.createElement('li');
  const affichageDate = article.date
    ? new Date(article.date).toLocaleDateString()
    : 'Non défini';
  li.textContent = `${categorie} - ${nom} (${reference}) x${quantite} à ${prixUnitaire} € (manuel) [${affichageDate}]`;
  listeArticles.appendChild(li);

  // Reset
  document.getElementById('manual-categorie').value = '';
  document.getElementById('manual-nom').value = '';
  document.getElementById('manual-reference').value = '';
  document.getElementById('manual-prix').value = '';
  document.getElementById('manual-quantite').value = '';

  manualFields.style.display = 'none';
}

// Envoyer la commande
async function envoyerCommande() {
  if (commandeTemp.length === 0) {
    alert('Aucun article à ajouter.');
    return;
  }

  const token = localStorage.getItem('token');

  try {
    for (const article of commandeTemp) {
      const formData = {
        produitId: article.produitId || null,
        date: article.date,
        categorie: article.categorie,
        nom: article.nom,
        reference: article.reference,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
      };
      await ajoutCommandeClient(formData, token);
    }

    alert('Commande(s) ajoutée(s) avec succès !');
    fermerModal();
    gestionArticle(); // refresh table principale
  } catch (err) {
    console.error(err);
    alert('Erreur lors de l’ajout de la commande.');
  }
}

// === Event Listeners ===
btnAjouter.addEventListener('click', ouvrirModal);
btnCancel.addEventListener('click', fermerModal);

selectCategorie.addEventListener('change', majNoms);
selectNom.addEventListener('change', majReferences);
selectReference.addEventListener('change', majPrix);

btnAjouterArticle.addEventListener('click', ajouterArticleStock);
btnAjouterManuel.addEventListener('click', ajouterArticleManuel);

submitCommande.addEventListener('click', envoyerCommande);

const btnExport = document.querySelector('.modal-gestion-export');
const modalExport = document.querySelector('.modal-content-export');
const btnCancelExport = document.getElementById('cancel-export');
const selectPeriode = document.getElementById('export-periode');
const selectAnnee = document.getElementById('export-annee');

// --- Remplissage dynamique du select des années ---
(function remplirAnnees() {
  const anneeCourante = new Date().getFullYear();
  const anneeDebut = 2020; // change si nécessaire
  for (let y = anneeCourante; y >= anneeDebut; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    selectAnnee.appendChild(opt);
  }
})();

btnExport.addEventListener('click', () => {
  modalExport.style.display = 'flex';
});

btnCancelExport.addEventListener('click', () => {
  modalExport.style.display = 'none';
});

// === Export ===
document.getElementById('submit-export').addEventListener('click', async () => {
  const format = document.getElementById('export-format').value;
  const periode = document.getElementById('export-periode').value;

  let mois = null;
  let annee = null;

  if (periode === 'month') {
    mois = document.getElementById('export-mois').value;
    annee = document.getElementById('export-annee').value;
  } else if (periode === 'year') {
    annee = document.getElementById('export-annee').value;
  }

  const token = localStorage.getItem('token');

  try {
    const blob = await exportOrders(format, periode, mois, annee, token);

    // Création du téléchargement
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'pdf' ? 'rapport.pdf' : 'rapport.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    modalExport.style.display = 'none';
  } catch (err) {
    console.error(err);
    alert('Erreur lors de l’export.');
  }
});

// --- Affichage dynamique des sélecteurs ---
selectPeriode.addEventListener('change', function () {
  const periode = this.value;
  document.getElementById('export-year-select').style.display =
    periode === 'year' || periode === 'month' ? 'block' : 'none';
  document.getElementById('export-month-select').style.display =
    periode === 'month' ? 'block' : 'none';
});

// Lancement de l'init au chargement du DOM
document.addEventListener('DOMContentLoaded', init);
