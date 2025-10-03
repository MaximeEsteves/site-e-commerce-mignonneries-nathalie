// Coordonnées GPS du magasin (exemple : Paris)
const latitude = 43.49783087158392;
const longitude = 2.3918769131068096;

const map = L.map('map').setView([latitude, longitude], 15);

// Tuile gratuite de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
}).addTo(map);

// Ajoute un marqueur
L.marker([latitude, longitude])
  .addTo(map)
  .bindPopup('Notre magasin<br>📍 12 Av. de la Richarde<br> 81200 Mazamet')
  .openPopup();
