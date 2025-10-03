//initCustomSwiper.js
// ==== permet le swip version tablette et mobile des images dans la galerie de la page principale et de la page produit
export function initCustomSwiper(
  container,
  options = {},
  produits = null,
  callbacks = {}
) {
  if (!(container instanceof HTMLElement)) {
    console.error(
      "initCustomSwiper: container n'est pas un élément DOM",
      container
    );
    return null;
  }

  const slidesCount = container.querySelectorAll('.swiper-slide').length;

  const swiper = new Swiper(container, {
    loop: slidesCount > 1, // ⚡ évite le warning
    grabCursor: true,
    simulateTouch: true,
    spaceBetween: 10,
    ...options, // surcharge d’options selon la page
  });

  // Gestion slideChange personnalisée si produits (cas index.js)
  if (produits && callbacks.onSlideChange) {
    swiper.on('slideChange', () => {
      const activeIndex = swiper.realIndex;
      const prod = produits[activeIndex];
      callbacks.onSlideChange(prod, activeIndex);
    });
  }

  return swiper;
}
