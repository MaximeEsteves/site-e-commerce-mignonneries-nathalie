import { getGalerie } from '../../api/apiClient.js';

async function chargerGalerieVideos() {
  const data = await getGalerie();

  const container = document.querySelector('.video');
  container.innerHTML = '';

  data.forEach((galerie) => {
    galerie.videos.forEach((url) => {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      );
      container.appendChild(iframe);
    });
  });
}

document.addEventListener('DOMContentLoaded', chargerGalerieVideos);
