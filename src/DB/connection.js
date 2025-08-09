import mongoose from "mongoose";

export const database_Connection = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ DB Connected");
  } catch (error) {
    console.error("❌ Failed to connect to DB:", error.message);
    process.exit(1); // Optional: Exit app on DB failure
  }
};

export default database_Connection;
