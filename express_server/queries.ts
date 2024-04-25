// import sequlize object from database.ts file
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";
import {
  ICreateProductInfo,
  ICreateShopInfo,
  IShopInfoView,
  ISignUpInfo,
  IUserExistsResult,
  IUserInfoView,
  IProductInfo,
  IOrderInfoView,
  ICreateOrderInfo,
} from "./types";

/**
 * Gets all data for all shops in sequelize database
 * @returns A list of IShopInfoView entries
 */
const getAllShopsInfo = async () => {
  // Set query string
  const query = `SELECT * FROM ShopInfoView`;
  // Get query results using query string and sequelize
  const results: IShopInfoView[] = await sequelize.query(query, {
    type: QueryTypes.SELECT,
  });
  // Print out query results for debugging purposes
  console.log(results);
  // Return query results
  return results;
};

/**
 * Gets data for all products of a shop from sequelize database
 * @param ShopID id of shop to get products of
 * @returns A list of IProduct entries for the shop with the given ShopID
 */
const getAllProductsOfAShop = async (ShopID: string) => {
  // Set query string
  const query = `
  SELECT * FROM Products
  INNER JOIN Shops ON Products.ShopID = Shops.ShopID
  WHERE Shops.shopid = ?
  ORDER BY Products.name;
  `;
  // Get query results using query string and sequelize
  const results: IProductInfo[] = await sequelize.query(query, {
    replacements: [ShopID],
    type: QueryTypes.SELECT,
  });
  // Print out query results for debugging purposes
  console.log(results);
  // Return query results
  return results;
};

/**
 * Gets data for a specific shop from sequelize database
 * @param ShopID id of shop to get data of
 * @returns A list of IShopInfoView entries for the shop with the given ShopID
 */
const getShopInfo = async (ShopID: string) => {
  // Set query string
  const query = `SELECT * FROM ShopInfoView WHERE shopid = ?;`;
  // Get query results using query string and sequelize
  const results: IShopInfoView[] = await sequelize.query(query, {
    replacements: [ShopID],
    type: QueryTypes.SELECT,
  });
  // Print out query results for debugging purposes
  console.log(results);
  // Return query results
  return results;
};

/**
 * Checks if there is a user with the given email in the database
 * @param email email of user to check if exists in database
 * @returns true if there is a user with the given email, false otherwise.
 */
const checkIfUserExists = async (email: string) => {
  // Set query string
  const query =
    'SELECT EXISTS (SELECT * FROM users WHERE email = ?) AS "user_exists";';
  // Execute the query and specify the type of the result
  const results: IUserExistsResult[] = await sequelize.query(query, {
    replacements: [email],
    type: QueryTypes.SELECT,
  });
  // Print out results for debugging purposes
  console.log(results[0].user_exists);
  // Return the result to the caller of the function
  return results[0].user_exists;
};

/**
 * Adds a new user to the database with the given information
 * @param userInfo ISignUpInfo object containing new user info
 * @returns Insert query metadata
 */
const createUser = async (userInfo: ISignUpInfo) => {
  try {
    await sequelize.query('BEGIN;', { type: QueryTypes.RAW });
    // Lock the table
    await sequelize.query('LOCK TABLE Users IN ACCESS EXCLUSIVE MODE;', { type: QueryTypes.RAW });

    // Set query string
    const query = `
    INSERT INTO Users
    (Email, FirstName, LastName, DOB, Password)
    VALUES
    (?, ?, ?, ?, ?)`;

    // Get ouput from running query string
    const [results, metadata] = await sequelize.query(query, {
      replacements: [
        userInfo.email,
        userInfo.firstname,
        userInfo.lastname,
        userInfo.dob,
        userInfo.password,
      ],
      type: QueryTypes.INSERT,
    });
    await sequelize.query('COMMIT;', { type: QueryTypes.RAW });
    // Log query output
    console.log(results, metadata);
    // Return related metadata
    return metadata;
  } catch (error) {
    console.error('Failed to update product quantity:', error);
    await sequelize.query('ROLLBACK;', { type: QueryTypes.RAW });
  }
};

/**
 * Get user data from database by email
 * @param email Email of user to get data of
 * @returns An IUserInfo object of user data
 */
const getUserInfoByEmail = async (email: string) => {
  // Set query string
  const query = `SELECT * FROM UserInfoView WHERE email = ?;`;
  // Get query results from using query string and sequelize
  const results: IUserInfoView[] = await sequelize.query(query, {
    replacements: [email],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Get user data from database by userID
 * @param userid ID of user to get data of
 * @returns An IUserInfo object of user data
 */
const getUserInfoByID = async (userid: string) => {
  // Set query string
  const query = `SELECT * FROM UserInfoView WHERE userid = ?;`;
  // Get query results from using query string and sequelize
  const results: IUserInfoView[] = await sequelize.query(query, {
    replacements: [userid],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Get user data from database by email and password
 * @param email Email of user to get data of
 * @param password Password of user to get data of
 * @returns An IUserInfo object of user data
 */
const getUserByEmailAndPassword = async (email: string, password: string) => {
  // Set query string
  const query = `SELECT * FROM UserInfoView WHERE email = ? AND password = ?;`;
  // Get query results from using query string and sequelize
  const results: IUserInfoView[] = await sequelize.query(query, {
    replacements: [email, password],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Get all shops owned by a user
 * @param userid of user to get data of
 * @returns An list of IShopInfo object owned by user
 */
const getShopsOwnedByUser = async (userid: string) => {
  // Set query string
  const query = `SELECT * FROM ShopInfoView WHERE ownerid = ?;`;
  // Get query results from using query string and sequelize
  const results: IShopInfoView[] = await sequelize.query(query, {
    replacements: [userid],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Create shop owned by a user
 * @param shopInfo ICreateShopInfo object containing shop info
 * @returns An list of IShopInfo object owned by user
 */
const createShop = async (shopInfo: ICreateShopInfo) => {
  try {
    await sequelize.query('BEGIN;', { type: QueryTypes.RAW });

    // Lock the table
    await sequelize.query('LOCK TABLE Shops IN ACCESS EXCLUSIVE MODE;', { type: QueryTypes.RAW });
    // Set query string
    const query = `
    INSERT INTO Shops (ShopName, EstablishDate, Description, Owner)
    VALUES (?, CURRENT_DATE, ?, ?);
    `;
    // Get query results from using query string and sequelize
    const [results, metadata] = await sequelize.query(query, {
      replacements: [shopInfo.shopname, shopInfo.description, shopInfo.ownerid],
      type: QueryTypes.INSERT,
    });
    await sequelize.query('COMMIT;', { type: QueryTypes.RAW });
    // Print out for debugging purposes
    console.log(results);
    // Return results to caller
    return results;
  } catch (error) {
    console.error('Failed to update product quantity:', error);
    await sequelize.query('ROLLBACK;', { type: QueryTypes.RAW });
  }
};

/**
 * Create product for a shop
 * @param productInfo ICreateProductInfo object containing shop info
 */
const makeSeller = async (userID: string) => {
  try {
    await sequelize.query('BEGIN;', { type: QueryTypes.RAW });
    // Lock the table
    await sequelize.query('LOCK TABLE Sellers IN ACCESS EXCLUSIVE MODE;', { type: QueryTypes.RAW });
    // Set query string
    const query = `
    INSERT INTO Sellers (sellerid)
    VALUES (?);
    `;
    // Get query results from using query string and sequelize
    const [results, metadata] = await sequelize.query(query, {
      replacements: [userID],
      type: QueryTypes.INSERT,
    });
    await sequelize.query('COMMIT;', { type: QueryTypes.RAW });
    // Print out for debugging purposes
    console.log(results);
    // Return results to caller
    return results;
  } catch (error) {
    console.error('Failed to update product quantity:', error);
    await sequelize.query('ROLLBACK;', { type: QueryTypes.RAW });
  }
};

/**
 * Add user to seller table
 * @param userID ID of user
 */
const createProduct = async (productInfo: ICreateProductInfo) => {
  try {
    await sequelize.query('BEGIN;', { type: QueryTypes.RAW });

    // Lock the table
    await sequelize.query('LOCK TABLE Products IN ACCESS EXCLUSIVE MODE;', { type: QueryTypes.RAW });
    // Set query string
    const query = `
    INSERT INTO Products (shopid, price, name, quantity, description)
    VALUES (?, ?, ?, ?, ?);
    `;
    // Get query results from using query string and sequelize
    const [results, metadata] = await sequelize.query(query, {
      replacements: [
        productInfo.shopid,
        productInfo.price,
        productInfo.name,
        productInfo.quantity,
        productInfo.description,
      ],
      type: QueryTypes.INSERT,
    });
    await sequelize.query('COMMIT;', { type: QueryTypes.RAW });
    // Print out for debugging purposes
    console.log(results);
    // Return results to caller
    return results;
  } catch (error) {
    console.error('Failed to update product quantity:', error);
    await sequelize.query('ROLLBACK;', { type: QueryTypes.RAW });
  }
};

/**
 * Get all orders made by a user
 * @param userID ID of user
 */
const getUsersOrders = async (userid: string) => {
  // Set query string
  const query = `SELECT * FROM OrdersInfoView WHERE buyer = ?`;
  // Get query results from using query string and sequelize
  const results: IOrderInfoView[] = await sequelize.query(query, {
    replacements: [userid],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Create order on database
 * @param createOrderInfo
 */
const createOrder = async (createOrderInfo: ICreateOrderInfo) => {
  try {
    await sequelize.query('BEGIN;', { type: QueryTypes.RAW });

    // Lock the table
    await sequelize.query('LOCK TABLE Orders IN ACCESS EXCLUSIVE MODE;', { type: QueryTypes.RAW });
    // Set query string
    const query = `
    INSERT INTO Orders (Buyer, Shop, Product, Quantity, OrderTime) VALUES
    (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    // Get query results from using query string and sequelize
    const [results, metadata] = await sequelize.query(query, {
      replacements: [
        createOrderInfo.userid,
        createOrderInfo.shopid,
        createOrderInfo.productid,
        createOrderInfo.quantity,
      ],
      type: QueryTypes.INSERT,
    });
    await sequelize.query('COMMIT;', { type: QueryTypes.RAW });
    // Print out for debugging purposes
    console.log(results);
    // Return results to caller
    return results;
  } catch (error){
    console.error('Failed to update product quantity:', error);
    await sequelize.query('ROLLBACK;', { type: QueryTypes.RAW });
  }
};

/**
 * Change quantity of product by an amount
 * @param shopid ID of product's shop
 * @param productid ID of product
 * @param amount Amount to add to product quantity
 */
const setProductQuantity = async (
  shopid: string,
  productid: string,
  newQuantity: number
) => {
  // Set query string
  const query = `
  UPDATE Products
  SET quantity = ?
  WHERE shopid = ? AND productid = ?;
  `;
  // Get query results from using query string and sequelize
  const [results, metadata] = await sequelize.query(query, {
    replacements: [newQuantity, shopid, productid],
    type: QueryTypes.UPDATE,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Get product info

 * @param productid ID of product
 */
const getProduct = async (shopid: string, productid: string) => {
  // Set query string
  const query = `SELECT * FROM Products WHERE shopid = ? AND productid = ?;`;
  // Get query results from using query string and sequelize
  const results: IProductInfo[] = await sequelize.query(query, {
    replacements: [shopid, productid],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Get products in shop named like a string
 * @param shopid shop to search
 * @param searchStr search query
 */
const getProductsOfShopLike = async (shopid: string, searchStr: string) => {
  // Set query string
  const query = `
  SELECT * FROM Products
  INNER JOIN Shops ON Products.ShopID = Shops.ShopID
  WHERE Shops.shopid = ? AND LOWER(name) LIKE ?
  ORDER BY Products.name;
  `;
  // Get query results from using query string and sequelize
  const results: IProductInfo[] = await sequelize.query(query, {
    replacements: [shopid, `%${searchStr}%`],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Get Shops named like a search query
 * @param searchStr search query
 */
const getShopsLike = async (searchStr: string) => {
  // Set query string
  const query = `
  SELECT * FROM ShopInfoView WHERE LOWER(shopname) LIKE ?;
  `;
  // Get query results from using query string and sequelize
  const results: IShopInfoView[] = await sequelize.query(query, {
    replacements: [`%${searchStr}%`],
    type: QueryTypes.SELECT,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

/**
 * Update user info in database
 * @param newUserInfo new user information to update database with
 */
const updateUserData = async (newUserInfo: IUserInfoView) => {
  // Set query string
  const query = `
  UPDATE Users
  SET (userid, firstname, lastname, email, dob, password)
  = (?, ?, ?, ?, ?, ?)
  WHERE userid = ?;
  `;
  // Get query results from using query string and sequelize
  const [results, metadata] = await sequelize.query(query, {
    replacements: [
      newUserInfo.userid,
      newUserInfo.firstname,
      newUserInfo.lastname,
      newUserInfo.email,
      newUserInfo.dob,
      newUserInfo.password,
      newUserInfo.userid,
    ],
    type: QueryTypes.UPDATE,
  });
  // Print out for debugging purposes
  console.log(results);
  // Return results to caller
  return results;
};

// Define default export
const queries = {
  getUserInfoByEmail,
  getUserInfoByID,
  getAllShopsInfo,
  getAllProductsOfAShop,
  getShopInfo,
  checkIfUserExists,
  createUser,
  getUserByEmailAndPassword,
  getShopsOwnedByUser,
  createShop,
  createProduct,
  makeSeller,
  getUsersOrders,
  createOrder,
  setProductQuantity,
  getProduct,
  getProductsOfShopLike,
  getShopsLike,
  updateUserData,
};
// Export object
export default queries;
