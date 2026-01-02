import express from 'express';
import bodyParser from 'body-parser';
import router from './routes/api';
import dbMongo from './utils/database'; // Ini koneksi MongoDB lama kamu
import docs from './docs/route';
import cors from 'cors';

// @ts-ignore
import dbMySQL from '../models'; // BARU: Mengambil folder models (Sequelize)

async function init() {
  try {
    // 1. Koneksi MongoDB (Lama)
    const result = await dbMongo();
    console.log('MongoDB status:', result);

    // 2. Koneksi MySQL via Sequelize (BARU)
    // Kita jalankan sinkronisasi agar tabel siap digunakan
    await dbMySQL.sequelize.sync();
    console.log('MySQL (Sequelize) status: Connected & Synchronized');

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    const port = 3000;

    app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Server is running with MongoDB & MySQL',
        data: null,
      });
    });

    // Route testing untuk memastikan MySQL bisa diakses
    app.get('/test-mysql', async (req, res) => {
      try {
        const users = await dbMySQL.User.findAll();
        res.json({ message: 'Koneksi MySQL Oke!', data: users });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.use('/api', router);
    docs(app);

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log('Gagal inisialisasi server:', error);
  }
}

init();
