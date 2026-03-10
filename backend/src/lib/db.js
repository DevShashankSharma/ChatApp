import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Seed admin user if credentials provided
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminEmail && adminPassword) {
            const existing = await User.findOne({ email: adminEmail });
            if (!existing) {
                const salt = await bcrypt.genSalt(10);
                const hashed = await bcrypt.hash(adminPassword, salt);
                const adminUser = new User({ name: 'Admin', email: adminEmail, password: hashed });
                await adminUser.save();
                console.log(`Admin user created: ${adminEmail}`);
            } else {
                console.log(`Admin user already exists: ${adminEmail}`);
            }
        }

    } catch (error) {
        console.log(`MongoDB Connection Error: ${error}`);
        process.exit(1);
    }
};