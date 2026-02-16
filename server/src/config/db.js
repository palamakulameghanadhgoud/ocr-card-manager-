import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/business-cards');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.warn('Server will continue - OCR will work, but card storage requires MongoDB.');
    // Don't exit - allow OCR and other non-DB routes to work
  }
};

export default connectDB;
