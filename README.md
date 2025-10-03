# Mignonneries de Nathalie

Projet fullstack (Frontend + Backend) d’une boutique artisanale en ligne.

---

## 🖼️ Déploiement

**Frontend** : Netlify (HTML / CSS / Javascript)
**Backend** : Node.js / MongoDB Atlas

### Stack & dépendances

- **HTML5**, **CSS3**, **JavaScript **
- Librairies : [Swiper](https://swiperjs.com/), [FontAwesome](https://fontawesome.com/)
- Hébergement statique : **Netlify**
- API REST légère pour la gestion des produits, du panier et des paiements.
- Stockage MongoDB via **Mongoose**.
- Paiement sécurisé avec **Stripe** + webhook.
- Envoi d’emails via **Nodemailer**.

### Fonctionnalités

- Interface responsive.
- Navigation produit + recherche côté client.
- Galerie produit avec zoom, navigation (chevrons + Swiper).
- Connexion admin avec possibilité d'ajout/modification/suppression de produit.

### Architecture & fichiers clés

- `index.html`
- `api/` — appels API.
- `global/` — styles et scripts partagés.
- `pages/` — toutes les pages spécifiques du site.
- `assets/` — images, icônes et logos.

### Démarrage

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Mise à jour des fichiers dans le backend
   `.env.example`
   `.galerie.example.json`
   `.produits.example.json`

2.b Création d'un compte admin via POSTMAN par exemple

```bash
   POST http://localhost:3000/api/auth/register
```

```bash
   BODY
   {
   "email": "admin@exemple.com",
   "motDePasse": "superpassword",
   }
```

Indiquer en BDD si il s'agit d'un admin en modifiant `"isAdmin" : true` car `"isAdmin" = false` de base.

2.c Ajouts des produits et vidéos
Remplir le fichier produits.example.json
Remplir le fichier galerie.example.json
Utiliser le fichier `/utils/import.js`

3. Lancer le serveur :

- Développement : npm run dev

- Production : npm start
