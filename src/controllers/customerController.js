const { db, admin } = require('../config/firebase');
const axios = require('axios');
const googleMapApi = process.env.GOOGLE_MAP_API

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
    // Menggabungkan alamat lengkap
    const fullAddress = `${alamat}, ${kecamatan}, ${kota}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
    
    // Permintaan ke Google Maps Geocoding API
    const response = await axios.get(geocodeUrl, {
      params: {
        address: fullAddress,
        key: googleMapApi // Gantilah dengan API Key Anda
      }
    });

    // Memeriksa apakah permintaan berhasil dan mendapatkan hasil
    if (response.data.status === 'OK') {
      const location = response.data.results[0].geometry.location;
      const { lat, lng } = location;

      // Membuat link ke Google Maps
      const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

      // Menyimpan data customer ke Firestore
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

      res.status(201).json({ message: 'Customer created successfully' });
    } else {
      res.status(400).json({ message: 'Failed to get location from address' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkCreateCustomer = async (req, res) => {
  const customers = req.body.customers; // Mengharapkan array data customer

  try {
    const promises = customers.map(async customer => {
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

      // Menggabungkan alamat lengkap
      const fullAddress = `${alamat}, ${kecamatan}, ${kota}`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;

      // Permintaan ke Google Maps Geocoding API
      const response = await axios.get(geocodeUrl, {
        params: {
          address: fullAddress,
          key: googleMapApi // Gantilah dengan API Key Anda
        }
      });

      // Memeriksa apakah permintaan berhasil dan mendapatkan hasil
      if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        const { lat, lng } = location;

        // Membuat link ke Google Maps
        const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

        // Menyimpan data customer ke Firestore
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
      } else {
        throw new Error(`Failed to get location for address: ${fullAddress}`);
      }
    });

    await Promise.all(promises);

    res.status(201).json({ message: 'All customers created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomers = async (req, res) => {
  const { kecamatan, kota } = req.query;
  
  try {
    const customersSnapshot = await db.collection('customers').get();
    let customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (kecamatan) {
      customers = customers.filter(customer => customer.kecamatan === kecamatan.toUpperCase());
    }

    if (kota) {
      customers = customers.filter(customer => customer.kota === kota.toUpperCase());
    }

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
    tanggalValid 
  } = req.body;

  try {
    const fullAddress = `${alamat}, ${kecamatan}, ${kota}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;

    // Permintaan ke Google Maps Geocoding API
    const response = await axios.get(geocodeUrl, {
      params: {
        address: fullAddress,
        key: googleMapApi // Gantilah dengan API Key Anda
      }
    });

    // Memeriksa apakah permintaan berhasil dan mendapatkan hasil
    if (response.data.status === 'OK') {
      const location = response.data.results[0].geometry.location;
      const { lat, lng } = location;

      // Membuat link ke Google Maps
      const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

      // Memperbarui data customer di Firestore
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

      res.json({ message: 'Customer updated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to get location from address' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('customers').doc(id).delete();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const getNearbyCustomers = async (req, res) => {
//   const { lat, lng, radius, kecamatan, kota } = req.query;

//   if (!lat || !lng || !radius) {
//     return res.status(400).json({ message: 'Please provide lat, lng and radius' });
//   }

//   try {
//     const customersRef = db.collection('customers');
//     let query = customersRef;

//     console.log(kota, kecamatan, "ini kota & kecamatan")
//     // Tambahkan filter berdasarkan kecamatan dan kota jika disediakan
//     if (kota) {
//       console.log("masuk kota <<<")
//       query = query.where('kota', '==', kota.toUpperCase());
//     }
//     if (kecamatan) {
//       console.log("masuk kecamatan <<<")
//       query = query.where('kecamatan', '==', kecamatan.toUpperCase());
//     }

//     const customersSnapshot = await query.get();
//     const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//     if (customers.length === 0) {
//       return res.json([]); // Jika tidak ada pelanggan, kembalikan array kosong
//     }

//     const destinations = customers.map(customer => `${customer.lat},${customer.lng}`).join('|');
//     const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json`;

//     const response = await axios.get(distanceMatrixUrl, {
//       params: {
//         origins: `${lat},${lng}`,
//         destinations: destinations,
//         key: googleMapApi // Gantilah dengan API Key Anda
//       }
//     });

//     // Logging respons API
//     console.log('Google Maps API Response:', response.data.rows[0].elements);

//     if (response.data.status !== 'OK') {
//       return res.status(500).json({ message: 'Failed to get distance matrix from Google Maps API', details: response.data });
//     }

//     const elements = response.data.rows[0].elements;

//     const nearbyCustomers = customers
//       .map((customer, index) => {
//         const distanceInMeters = elements[index].distance.value;
//         const distanceInKilometers = distanceInMeters / 1000;
//         const durationInSeconds = elements[index].duration.value;
//         const durationInMinutes = Math.ceil(durationInSeconds / 60);
//         return {
//           ...customer,
//           distance: distanceInKilometers,
//           duration: durationInMinutes
//         };
//       })
//       .filter(customer => customer.distance <= parseFloat(radius))
//       .sort((a, b) => a.distance - b.distance);

//     res.json(nearbyCustomers);
//   } catch (error) {
//     console.error('Error fetching distance matrix:', error); // Logging error
//     res.status(500).json({ message: error.message });
//   }
// };

const getNearbyCustomers = async (req, res) => {
  const { lat, lng, radius, kecamatan, kota } = req.query;

  if (!lat || !lng || !radius) {
    return res.status(400).json({ message: 'Please provide lat, lng and radius' });
  }

  try {
    const customersRef = db.collection('customers');
    let query = customersRef;

    console.log(kota, kecamatan, "ini kota & kecamatan")
    // Tambahkan filter berdasarkan kecamatan dan kota jika disediakan
    if (kota) {
      console.log("masuk kota <<<")
      query = query.where('kota', '==', kota.toUpperCase());
    }
    if (kecamatan) {
      console.log("masuk kecamatan <<<")
      query = query.where('kecamatan', '==', kecamatan.toUpperCase());
    }

    const customersSnapshot = await query.get();
    const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (customers.length === 0) {
      return res.json([]); // Jika tidak ada pelanggan, kembalikan array kosong
    }

    const batchSize = 5;
    const allResults = [];

    // Fungsi untuk mendapatkan distance matrix untuk batch tertentu
    const getDistanceMatrix = async (batch) => {
      const destinations = batch.map(customer => `${customer.lat},${customer.lng}`).join('|');
      const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json`;

      const response = await axios.get(distanceMatrixUrl, {
        params: {
          origins: `${lat},${lng}`,
          destinations: destinations,
          key: googleMapApi // Gantilah dengan API Key Anda
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error('Failed to get distance matrix from Google Maps API');
      }

      const elements = response.data.rows[0].elements;

      return batch.map((customer, index) => {
        const distanceInMeters = elements[index].distance.value;
        const distanceInKilometers = distanceInMeters / 1000;
        const durationInSeconds = elements[index].duration.value;
        const durationInMinutes = Math.ceil(durationInSeconds / 60);
        return {
          ...customer,
          distance: distanceInKilometers,
          duration: durationInMinutes
        };
      });
    };

    // Proses semua batch
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      const batchResults = await getDistanceMatrix(batch);
      allResults.push(...batchResults);
    }

    // Filter dan urutkan hasil
    const nearbyCustomers = allResults
      .filter(customer => customer.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyCustomers);
  } catch (error) {
    console.error('Error fetching distance matrix:', error); // Logging error
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

module.exports = { createCustomer, bulkCreateCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer, getNearbyCustomers };
