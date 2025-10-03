import { searchProducts } from '../api/apiClient.js';
document.addEventListener('DOMContentLoaded', async () => {
  window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  // Gère l'ajout du listener scroll pour le header, une seule fois
  function handleHeaderScroll() {
    const header = document.querySelector('header');
    if (!header._hasScrollListener) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
      });
      header._hasScrollListener = true; // flag pour éviter les doublons
    }
  }
  const mobileNav = document.querySelector('nav.mobile');
  const burger = mobileNav.querySelector('.burger');
  const closeBtn = mobileNav.querySelector('.close-menu');
  const closeBtnBis = mobileNav.querySelector('.mobile-menu-overlay');

  burger.addEventListener('click', () => {
    mobileNav.classList.add('open');
  });

  closeBtn.addEventListener('click', () => {
    mobileNav.classList.remove('open');
  });

  closeBtnBis.addEventListener('click', () => {
    mobileNav.classList.remove('open');
  });

  handleHeaderScroll();

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');

  // variables pour pagination locale
  let currentResults = [];
  let renderedCount = 0;
  const PAGE_SIZE = 99;
  let searchDebounce = null;

  // ✅ Helper pour corriger le chemin des images
  function getImagePath(src) {
    if (!src) return '';

    // si déjà un lien complet (http/https)
    if (src.startsWith('http')) return src;

    const path = window.location.pathname;

    // cas page produit
    if (path.includes('/produit/')) {
      return `../${src}`;
    }

    // cas dossier plus profond (par ex. /pages/ ou /src/)
    if (path.includes('/pages/') || path.includes('/src/')) {
      return `../../${src}`;
    }

    // cas par défaut (ex: home page)
    return src;
  }

  // render d'un lot de résultats
  function renderNextBatch() {
    const start = renderedCount;
    const slice = currentResults.slice(start, start + PAGE_SIZE);

    slice.forEach((p) => {
      const imageSrc = getImagePath(p.image?.[0] || p.imageCouverture);

      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
      <img src="${imageSrc}" alt="${p.nom || ''}"
        style="width:64px;height:64px;object-fit:cover;border-radius:6px;" />
      <div style="display:flex;flex-direction:column;">
        <strong style="font-size:14px;color:#3a5151">${
          p.nom || 'Produit'
        }</strong>
        <span style="font-size:13px;color:#666">${
          p.prix ? p.prix + '€' : ''
        }</span>
      </div>
    `;

      item.addEventListener('click', () => {
        const ref = p.reference || p._id || p.id;
        if (ref) {
          window.location.href = `/produit/${ref}`;
        } else {
          console.warn('Produit sans référence:', p);
        }
      });

      resultsContainer.appendChild(item);
    });

    renderedCount += slice.length;
  }

  function clearResults() {
    resultsContainer.innerHTML = '';
    currentResults = [];
    renderedCount = 0;
    resultsContainer.style.display = 'none';
  }

  function showResults(products) {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'block';
    // style d'affichage si non présent en CSS
    resultsContainer.style.position = 'absolute';
    resultsContainer.style.top = '100%';
    resultsContainer.style.left = '0';
    resultsContainer.style.right = '0';
    resultsContainer.style.maxHeight = '300px';
    resultsContainer.style.overflowY = 'auto';
    resultsContainer.style.background = 'white';
    resultsContainer.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    resultsContainer.style.zIndex = '2000';
    resultsContainer.style.borderRadius = '0px 0px 10px 10px';
    resultsContainer.style.padding = '6px';
    currentResults = products;
    renderedCount = 0;
    renderNextBatch();
  }

  // pagination par scroll interne du conteneur
  resultsContainer.addEventListener('scroll', () => {
    if (
      resultsContainer.scrollTop + resultsContainer.clientHeight >=
      resultsContainer.scrollHeight - 8
    ) {
      if (renderedCount < currentResults.length) {
        renderNextBatch();
      }
    }
  });

  // close on click outside
  document.addEventListener('click', (e) => {
    if (!resultsContainer.contains(e.target) && e.target !== searchInput) {
      resultsContainer.style.display = 'none';
    }
  });

  // gestion input avec debounce
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const query = searchInput.value.trim();

    if (!query) {
      clearResults();
      return;
    }

    searchDebounce = setTimeout(async () => {
      try {
        const products = await searchProducts(query);
        if (!products || !products.length) {
          resultsContainer.innerHTML =
            '<div style="padding:12px;color:#666">Aucun résultat</div>';
          resultsContainer.style.display = 'block';
          return;
        }
        // montrer d'abord 3 items, le reste via scroll
        showResults(products);
      } catch (err) {
        console.error('Erreur recherche:', err);
        resultsContainer.innerHTML =
          '<div style="padding:12px;color:#c00">Erreur lors de la recherche</div>';
        resultsContainer.style.display = 'block';
      }
    }, 250);
  });
});
