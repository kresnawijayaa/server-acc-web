const express = require('express');
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', [verifyToken, isAdmin], getUsers);
router.get('/:id', [verifyToken, isAdmin], getUser);
router.put('/:id', [verifyToken, isAdmin], updateUser);
router.delete('/:id', [verifyToken, isAdmin], deleteUser);

module.exports = router;
