import { Sequelize } from "sequelize";

// Create sequelize instance with database name, username, password, and host details
const sequelize = new Sequelize("storeDB", "app_user", "abc", {
  host: "localhost",
  dialect: "postgres",
});

// Connect to sequelize database
const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

// Export connect function and sequlize instance
export { connectToDatabase, sequelize };
