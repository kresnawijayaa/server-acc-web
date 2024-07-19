const { db, admin } = require('../config/firebase');
const bcrypt = require('bcryptjs');

// Fungsi untuk mendapatkan daftar pengguna
const getUsers = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fungsi untuk mendapatkan data pengguna berdasarkan ID
const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fungsi untuk memperbarui data pengguna berdasarkan ID
const updateUser = async (req, res) => {
    const { id } = req.params;
  
    try {
      const userRef = db.collection('users').doc(id);
  
      // Memperbarui verified_date
      const updateData = {
        verified_date: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
  
      await userRef.update(updateData);
      res.json({ message: 'User verified_date updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Fungsi untuk menghapus data pengguna berdasarkan ID
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('users').doc(id).delete();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser };
