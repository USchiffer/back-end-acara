import mongoose from 'mongoose';
import MongoUser from './models/user.model'; // Sesuaikan path ke model MongoDB kamu
// @ts-ignore
import dbMySQL from '../models'; // Naik satu tingkat ke root/models

async function migrate() {
  try {
    // 1. Koneksi ke MongoDB (Sesuaikan URI-nya)
    // Gunakan URI yang sama dengan yang ada di file .env atau database util kamu
    await mongoose.connect('mongodb://localhost:27017/db-acara');
    console.log('✅ Terhubung ke MongoDB...');

    // 2. Ambil semua data dari MongoDB
    const oldUsers = await MongoUser.find({});
    console.log(`📊 Ditemukan ${oldUsers.length} user di MongoDB.`);

    const SequelizeUser = (dbMySQL as any).User;

    // 3. Masukkan ke MySQL
    for (const user of oldUsers) {
      // Cek apakah user sudah ada di MySQL berdasarkan email agar tidak duplikat
      const exists = await SequelizeUser.findOne({
        where: { email: user.email },
      });

      if (!exists) {
        await SequelizeUser.create({
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          password: user.password,
          role: user.role || 'user',
          profilePicture: user.profilePicture || 'user.jpg',
          isActive: user.isActive ?? true,
          activationCode: user.activationCode || '',
        });
        console.log(`🚀 Berhasil memindahkan: ${user.email}`);
      } else {
        console.log(`⏩ Skip: ${user.email} sudah ada di MySQL.`);
      }
    }

    console.log('🏁 Migrasi Selesai!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migrasi Gagal:', error);
    process.exit(1);
  }
}

migrate();
