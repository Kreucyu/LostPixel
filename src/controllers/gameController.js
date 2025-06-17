const Game = require('../models/Game');
const User = require('../models/User');

//puxando todos os jogos
exports.getAllGames = async (req, res) => {
    try {
        const games = await Game.find();
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// puxando apenas um jogo
exports.getGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//adicionando novo jogo
exports.createGame = async (req, res) => {
    try {
        //check de admin
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
        if (!token) return res.status(403).json({ message: 'Acesso negado.' });
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';
        const decoded = jwt.verify(token, JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        if (!user || !user.isAdmin) return res.status(403).json({ message: 'Apenas administradores podem adicionar jogos.' });
        const game = new Game(req.body);
        const newGame = await game.save();
        res.status(201).json(newGame);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//atualiza os dados de um jogo
exports.updateGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        
        Object.assign(game, req.body);
        const updatedGame = await game.save();
        res.json(updatedGame);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//deletar um jogo
exports.deleteGame = async (req, res) => {
    try {
       //check de admin
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
        if (!token) return res.status(403).json({ message: 'Acesso negado.' });
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';
        const decoded = jwt.verify(token, JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        if (!user || !user.isAdmin) return res.status(403).json({ message: 'Apenas administradores podem excluir jogos.' });
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        // remove jogos de todas as wishlist
        await User.updateMany(
            { wishlist: game._id },
            { $pull: { wishlist: game._id } }
        );
        await Game.deleteOne({ _id: game._id });
        res.json({ message: 'Game deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//procurar um jogo
exports.searchGames = async (req, res) => {
    try {
        const { title, platform, releaseYear, genre } = req.query;
        const query = {};

        if (title) query.title = { $regex: title, $options: 'i' };
        if (platform) query.platform = { $regex: platform, $options: 'i' };
        if (releaseYear) query.releaseYear = releaseYear;
        if (genre) query.genre = { $regex: genre, $options: 'i' };

        const games = await Game.find(query);
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 