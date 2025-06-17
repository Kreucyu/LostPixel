const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/', gameController.getAllGames);

router.get('/search', gameController.searchGames);

router.get('/:id', gameController.getGame);

router.post('/', gameController.createGame);

router.put('/:id', gameController.updateGame);

router.delete('/:id', gameController.deleteGame);

module.exports = router; 