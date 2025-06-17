const User = require('../models/User');
const Game = require('../models/Game');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Preencha todos os campos.' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'E-mail já cadastrado.' });
        }
        const user = new User({ name, email, password });
        await user.save();
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('wishlist');
        res.json(user.wishlist);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar wishlist.' });
    }
};

exports.addToWishlist = async (req, res) => {
    try {
        const { gameId } = req.body;
        const user = await User.findById(req.userId);
        if (!user.wishlist.includes(gameId)) {
            user.wishlist.push(gameId);
            await user.save();
        }
        res.json({ message: 'Jogo adicionado à wishlist.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao adicionar à wishlist.' });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const { gameId } = req.body;
        const user = await User.findById(req.userId);
        user.wishlist = user.wishlist.filter(id => id.toString() !== gameId);
        await user.save();
        res.json({ message: 'Jogo removido da wishlist.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao remover da wishlist.' });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
        res.json({ name: user.name, email: user.email, isAdmin: user.isAdmin });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar usuário.' });
    }
}; 