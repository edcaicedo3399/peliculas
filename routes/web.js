const { Router } = require('express');
const path = require('path');

const webRouter = Router();

// Servir archivos estáticos desde la carpeta "web"
webRouter.use('/', (req, res, next) => {
    express.static(path.join(__dirname, '../web'))(req, res, next);
});

// Ruta raíz: devolver el archivo index.html
webRouter.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web', 'index.html'));
});

module.exports = webRouter;