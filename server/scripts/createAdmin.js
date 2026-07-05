const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const adminData = {
  name: 'Open Care Admin',
  email: 'opencarefoundation2026@gmail.com',
  phone: 'admin-2026',
  password: '123456',
};

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    let adminUser = await User.findOne({
      $or: [{ email: adminData.email }, { phone: adminData.phone }],
    });

    if (adminUser) {
      adminUser.name = adminData.name;
      adminUser.email = adminData.email;
      adminUser.phone = adminData.phone;
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';

      await adminUser.save();

      console.log('Existing user updated as admin successfully');
    } else {
      adminUser = await User.create({
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone,
        password: hashedPassword,
        role: 'admin',
      });

      console.log('New admin user created successfully');
    }

    console.log('Admin Email:', adminData.email);
    console.log('Admin Password:', adminData.password);

    await mongoose.disconnect();

    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.log('Admin create failed:', error.message);
    process.exit(1);
  }
};

createAdmin();