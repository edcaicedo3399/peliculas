import express, { Router } from 'express';
import path from 'path';

const webRouter = Router();

// Servir archivos estáticos desde la carpeta "web"
webRouter.use(express.static(path.join(path.resolve(), 'web')));

// Ruta raíz: devolver el archivo index.html
webRouter.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'web', 'index.html'));
});

export { webRouter };