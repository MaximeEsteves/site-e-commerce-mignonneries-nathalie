// routes/avis.js
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const express = require('express');
const router = express.Router();
const Avis = require('../models/Avis');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const {
  RecaptchaEnterpriseServiceClient,
} = require('@google-cloud/recaptcha-enterprise');
const {
  verifierToken,
  verifierAdmin,
} = require('../middleware/authMiddleware');

// ⚡ Client reCAPTCHA Enterprise via variable d'environnement
const keyJson = JSON.parse(process.env.RECAPTCHA_JSON);
const recaptchaClient = new RecaptchaEnterpriseServiceClient({
  credentials: keyJson,
});
const projectID = process.env.GCP_PROJECT_ID;
const siteKey = process.env.RECAPTCHA_SITE_KEY;

// ======================
// GET /api/avis
// ======================
router.get('/', async (req, res) => {
  try {
    const { productRef, limit = 200 } = req.query;

    // Détection admin via token
    const token = req.headers['authorization']?.split(' ')[1];
    let isAdmin = false;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isAdmin = !!decoded.isAdmin;
      } catch {}
    }

    let query = {};
    if (productRef) {
      query = mongoose.Types.ObjectId.isValid(productRef)
        ? {
            $or: [
              { productRef },
              { productRef: mongoose.Types.ObjectId(productRef) },
            ],
          }
        : { productRef };
    }

    if (!isAdmin) query.validated = true;

    const list = await Avis.find(query).sort({ date: -1 }).limit(Number(limit));
    res.json(list);
  } catch (err) {
    console.error('GET /api/avis error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ======================
// POST /api/avis
// ======================
router.post('/', async (req, res) => {
  try {
    const { productRef, nom, note, commentaire, recaptchaToken } = req.body;
    if (!recaptchaToken)
      return res.status(400).json({ error: 'reCAPTCHA manquant' });

    // ⚡ Créer l'évaluation reCAPTCHA
    const [assessment] = await recaptchaClient.createAssessment({
      parent: `projects/${projectID}`,
      assessment: {
        event: { token: recaptchaToken, siteKey },
      },
    });

    if (!assessment.tokenProperties.valid) {
      return res
        .status(400)
        .json({
          error: `Token invalide: ${assessment.tokenProperties.invalidReason}`,
        });
    }
    if (assessment.tokenProperties.action !== 'submit_review') {
      return res.status(400).json({ error: 'Action reCAPTCHA incorrecte' });
    }

    console.log(
      'Score reCAPTCHA:',
      assessment.riskAnalysis?.score,
      'Reasons:',
      assessment.riskAnalysis?.reasons
    );

    // Vérification produit
    const produitExiste = await Product.findOne({ reference: productRef });
    if (!produitExiste)
      return res.status(400).json({ error: 'Produit inexistant' });

    // Nettoyage du commentaire
    const commentairePropre = sanitizeHtml(commentaire, {
      allowedTags: [],
      allowedAttributes: {},
    });

    // Limitation anti-spam : 1 avis/min par produit et nom
    const lastAvis = await Avis.findOne({ productRef, nom }).sort({ date: -1 });
    if (lastAvis && Date.now() - new Date(lastAvis.date) < 60_000) {
      return res
        .status(429)
        .json({ error: "Merci d'attendre avant de poster un nouvel avis" });
    }

    // Création de l'avis
    const nouvel = new Avis({
      productRef: String(productRef),
      nom: nom.trim(),
      note: Math.round(Number(note)),
      commentaire: commentairePropre,
      date: new Date(),
      validated: false,
    });

    await nouvel.save();
    res.status(201).json(nouvel);
  } catch (err) {
    console.error('POST /api/avis error:', err);
    res.status(500).json({ error: 'Impossible d’enregistrer l’avis' });
  }
});

// ======================
// DELETE /api/avis/:id
// ======================
router.delete('/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Avis.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Avis non trouvé' });
    res.json({ message: 'Avis supprimé avec succès' });
  } catch (err) {
    console.error('DELETE /api/avis/:id error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ======================
// PATCH /api/avis/:id/validate
// ======================
router.patch(
  '/:id/validate',
  verifierToken,
  verifierAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Avis.findByIdAndUpdate(
        id,
        { validated: true },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Avis non trouvé' });
      res.json(updated);
    } catch (err) {
      console.error('PATCH /api/avis/:id/validate error:', err);
      res.status(500).json({ error: 'Erreur lors de la validation' });
    }
  }
);

module.exports = router;
