require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const routesApp = require('./routes/routes.js');

const app = express();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connexion à MongoDB réussie !')
    })
    .catch(() => console.log('Connexion à MongoDB échouée !'));

const originesAutorisees = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.1.24:3000',
    'http://192.168.1.24:3001',
];

app.use((req, res, next) => {
    const origine = req.headers.origin;
    if (originesAutorisees.includes(origine)) {
        res.setHeader('Access-Control-Allow-Origin', origine);
    }
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(express.json({ limit: '1mb' }));

app.use('/finances', routesApp);

app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            message: "Le fichier est trop volumineux pour être traité.",
            details: ["La taille maximale autorisée est de 1 Mo. Essayez d'importer votre fichier en deux fois."]
        });
    }
    next(err);
});

module.exports = app;