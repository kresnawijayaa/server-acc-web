const { db, admin } = require('../config/firebase');
const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize NodeCache with a default TTL of 1 hour (3600 seconds)
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const googleMapApi = process.env.GOOGLE_MAP_API;

const createCustomer = async (req, res) => {
  const { 
    kota, 
    kecamatan, 
    alamat, 
    agreement, 
    namaCustomer, 
    merk, 
    type, 
    warna, 
    tahunMobil, 
    tenor, 
    handphone, 
    namaSales, 
    maxOvd, 
    tanggalValid 
  } = req.body;

  try {
    // Combine full address
    const fullAddress = `${alamat}, ${kecamatan}, ${kota}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
    
    // Request to Google Maps Geocoding API
    const response = await axios.get(geocodeUrl, {
      params: {
        address: fullAddress,
        key: googleMapApi
      }
    });

    if (response.data.status === 'OK') {
      const location = response.data.results[0].geometry.location;
      const { lat, lng } = location;

      const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

      const customerRef = db.collection('customers').doc();
      await customerRef.set({
        kota,
        kecamatan,
        alamat,
        agreement,
        namaCustomer,
        merk,
        type,
        warna,
        tahunMobil,
        tenor,
        handphone,
        namaSales,
        maxOvd,
        tanggalValid,
        lat,
        lng,
        googleMapsLink,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Invalidate cache after creating a customer
      myCache.flushAll();

      res.status(201).json({ message: 'Customer created successfully' });
    } else {
      res.status(400).json({ message: 'Failed to get location from address' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkCreateCustomer = async (req, res) => {
  const customers = req.body.customers;
  const batchSize = 100;

  try {
    let batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const customer of customers) {
      const { 
        kota, 
        kecamatan, 
        alamat, 
        agreement, 
        namaCustomer, 
        merk, 
        type, 
        warna, 
        tahunMobil, 
        tenor, 
        handphone, 
        namaSales, 
        maxOvd, 
        tanggalValid 
      } = customer;

      const fullAddress = `${alamat}, ${kecamatan}, ${kota}`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;

      try {
        const response = await axios.get(geocodeUrl, {
          params: {
            address: fullAddress,
            key: googleMapApi
          }
        });

        if (response.data.status === 'OK') {
          const location = response.data.results[0].geometry.location;
          const { lat, lng } = location;
          const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

          const customerRef = db.collection('customers').doc();
          const customerData = {
            kota,
            kecamatan,
            alamat,
            agreement,
            namaCustomer,
            merk,
            type,
            warna,
            tahunMobil,
            tenor,
            handphone,
            namaSales,
            maxOvd,
            tanggalValid,
            lat,
            lng,
            googleMapsLink,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          currentBatch.set(customerRef, customerData);
          batchCount++;

          if (batchCount === batchSize) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            batchCount = 0;
          }
        } else {
          console.error(`Failed to get location for address: ${fullAddress}`);
        }
      } catch (error) {
        console.error(`Error fetching geolocation: ${error.message}`);
      }
    }

    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    for (const batch of batches) {
      await batch.commit();
    }

    // Invalidate cache after bulk creation
    myCache.flushAll();

    res.status(201).json({ message: 'All customers created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomers = async (req, res) => {
  const { kecamatan, kota } = req.query;
  const cacheKey = `customers:${kecamatan || 'all'}:${kota || 'all'}`;

  // Try to get the data from cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key: ${cacheKey}`);
    return res.json(cachedData);
  }

  console.log(`Cache miss for key: ${cacheKey}, fetching from Firestore`);

  try {
    const customersSnapshot = await db.collection('customers').get();
    let customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (kecamatan) {
      customers = customers.filter(customer => customer.kecamatan === kecamatan.toUpperCase());
    }

    if (kota) {
      customers = customers.filter(customer => customer.kota === kota.toUpperCase());
    }

    // Cache the result
    myCache.set(cacheKey, customers);

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customerDoc = await db.collection('customers').doc(id).get();
    if (!customerDoc.exists) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ id: customerDoc.id, ...customerDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { 
    kota, 
    kecamatan, 
    alamat, 
    agreement, 
    namaCustomer, 
    merk, 
    type, 
    warna, 
    tahunMobil, 
    tenor, 
    handphone, 
    namaSales, 
    maxOvd, 
    tanggalValid,
    lat,
    lng 
  } = req.body;

  try {
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const customerRef = db.collection('customers').doc(id);
    await customerRef.update({
      kota,
      kecamatan,
      alamat,
      agreement,
      namaCustomer,
      merk,
      type,
      warna,
      tahunMobil,
      tenor,
      handphone,
      namaSales,
      maxOvd,
      tanggalValid,
      lat,
      lng,
      googleMapsLink,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Invalidate cache after updating a customer
    myCache.flushAll();

    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('customers').doc(id).delete();

    // Invalidate cache after deleting a customer
    myCache.flushAll();

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNearbyCustomers = async (req, res) => {
  const { lat, lng, radius, kecamatan, kota } = req.query;

  if (!lat || !lng || !radius) {
    return res.status(400).json({ message: 'Please provide lat, lng, and radius' });
  }

  const cacheKey = `nearbyCustomers:${lat}:${lng}:${radius}:${kecamatan || 'all'}:${kota || 'all'}`;

  // Try to get the data from cache
  const cachedData = myCache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for key: ${cacheKey}`);
    return res.json(cachedData);
  }

  console.log(`Cache miss for key: ${cacheKey}, fetching from Firestore`);

  try {
    const customersRef = db.collection('customers');
    let query = customersRef;

    if (kota) {
      query = query.where('kota', '==', kota.toUpperCase());
    }
    if (kecamatan) {
      query = query.where('kecamatan', '==', kecamatan.toUpperCase());
    }

    const customersSnapshot = await query.get();
    const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (customers.length === 0) {
      return res.json([]);
    }

    // Example: Apply your filtering logic here to only include customers within the specified radius
    // const nearbyCustomers = customers.filter(customer => calculateDistance(lat, lng, customer.lat, customer.lng) <= radius);

    // For this example, we are just returning all customers that match the query
    const nearbyCustomers = customers;

    // Cache the result
    myCache.set(cacheKey, nearbyCustomers);

    res.json(nearbyCustomers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserLocation = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Please provide lat and lng' });
  }

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;

    const response = await axios.get(geocodeUrl, {
      params: {
        latlng: `${lat},${lng}`,
        key: googleMapApi
      }
    });

    if (response.data.status === 'OK') {
      const address = response.data.results[0].formatted_address;
      const location = response.data.results[0].geometry.location;

      res.json({
        address,
        lat: location.lat,
        lng: location.lng
      });
    } else {
      res.status(400).json({ message: 'Failed to get location from coordinates' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAllCustomers = async (req, res) => {
  try {
    await db.collection('customers').get().then(snapshot => {
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    });

    // Invalidate cache after deleting all customers
    myCache.flushAll();

    res.status(200).json({ message: 'Semua customer berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus customer' });
  }
};

module.exports = {
  deleteAllCustomers,
  createCustomer,
  bulkCreateCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getNearbyCustomers,
  getUserLocation
};
