const express = require('express');
const { createCustomer, bulkCreateCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer, getNearbyCustomers } = require('../controllers/customerController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', [verifyToken, isAdmin], createCustomer);
router.post('/bulk', [verifyToken, isAdmin], bulkCreateCustomer);
router.get('/', verifyToken, getCustomers);
router.get('/nearby', verifyToken, getNearbyCustomers);
router.get('/:id', verifyToken, getCustomer);
router.put('/:id', [verifyToken, isAdmin], updateCustomer);
router.delete('/:id', [verifyToken, isAdmin], deleteCustomer);

module.exports = router;
