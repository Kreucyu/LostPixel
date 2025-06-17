const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Token não fornecido.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token inválido.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido.' });
    }
}

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/wishlist', authMiddleware, userController.getWishlist);
router.post('/wishlist/add', authMiddleware, userController.addToWishlist);
router.post('/wishlist/remove', authMiddleware, userController.removeFromWishlist);

router.get('/me', authMiddleware, userController.me);

module.exports = router; 