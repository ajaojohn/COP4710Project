-- Users Table
CREATE TABLE Users (
    UserID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    DOB Date NOT NULL,
    Password VARCHAR(50) NOT NULL
);

-- Buyers Table
CREATE TABLE Buyers (
    BuyerID UUID PRIMARY KEY,
    CONSTRAINT buyer_fk FOREIGN KEY (BuyerID) REFERENCES Users(UserID) ON DELETE CASCADE
);
-- Add buyer func
CREATE OR REPLACE FUNCTION add_user_to_buyers()
RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO Buyers (BuyerID) VALUES (NEW.UserID);
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;
-- Create trigger to add users to buyers
CREATE TRIGGER trigger_add_user_to_buyers
AFTER INSERT ON Users
FOR EACH ROW
EXECUTE FUNCTION add_user_to_buyers();

-- Sellers Table
CREATE TABLE Sellers (
    SellerID UUID PRIMARY KEY, 
    CONSTRAINT seller_fk FOREIGN KEY (SellerID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Shops Table
CREATE TABLE Shops (
    ShopID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ShopName VARCHAR(100),
    EstablishDate Date NOT NULL,
    Description TEXT,
    
    Owner UUID NOT NULL REFERENCES Sellers(SellerID)
);

-- Products Table
CREATE TABLE Products(
    ShopID UUID REFERENCES Shops(ShopID) ON DELETE CASCADE,
    ProductID UUID DEFAULT gen_random_uuid(),
    Price REAL NOT NULL,
    Name VARCHAR(100),
    Quantity INTEGER NOT NULL CHECK (Quantity >= 0),
    Description TEXT,
    CONSTRAINT products_pk PRIMARY KEY(ShopID, ProductID),
    CONSTRAINT shop_fkey FOREIGN KEY (ShopID) REFERENCES Shops(ShopID) ON DELETE CASCADE
);

-- Orders Table
CREATE TABLE Orders(
    OrderID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Buyer UUID NOT NULL REFERENCES Buyers(BuyerID),
    Shop UUID NOT NULL,
    Product UUID NOT NULL,
    Quantity INTEGER NOT NULL CHECK (Quantity >= 0),
    OrderTime TIMESTAMP NOT NULL,
    CONSTRAINT order_product_fkey FOREIGN KEY (Shop, Product) REFERENCES Products(ShopID, ProductID)
);

-- ShopInfoView View
CREATE VIEW ShopInfoView AS
SELECT
  shopid, shopname, description, establishdate,
  owner as ownerid, CONCAT(firstname, ' ', lastname) AS ownername, email AS owneremail, dob AS ownerdob,
  (SELECT COUNT(*) FROM Products WHERE Products.shopID = Shops.shopID) AS productcount
  FROM Shops
  INNER JOIN Sellers ON Shops.Owner = Sellers.SellerID
  INNER JOIN Users ON Shops.Owner = Users.UserID
  ORDER BY shopname;

-- Function to calculate total spent by a user
CREATE OR REPLACE FUNCTION calculate_total_spent_by_user(buyer_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_spent NUMERIC := 0;
BEGIN
    SELECT COALESCE(ROUND(SUM(CAST(p.Price * o.Quantity AS NUMERIC)),2), 0) INTO total_spent
    FROM Orders o
    JOIN Products p ON o.Product = p.ProductID
    WHERE o.Buyer = calculate_total_spent_by_user.buyer_id;

    RETURN total_spent;
END;
$$ LANGUAGE plpgsql;

-- UserInfoView View
CREATE VIEW UserInfoView AS
SELECT 
userid, firstname, lastname, email, dob, password, 
CASE WHEN EXISTS (
    SELECT 1 
    FROM Sellers 
    WHERE Users.userid = Sellers.sellerid
  ) THEN true ELSE false END AS isaseller,
  calculate_total_spent_by_user(userid) AS total_spent
FROM Users;

-- Create OrderInfoView
CREATE VIEW OrdersInfoView AS
SELECT
O.orderid, O.shop as shopid,
S.shopName, P.productID,
P.name as productname,
P.Price as productprice,
O.quantity,
(SELECT ROUND(CAST(O.quantity * P.Price AS NUMERIC) , 2)) as totalprice,
O.ordertime,
O.buyer
FROM Orders O
JOIN Shops S ON O.shop = S.shopID
JOIN Products P ON P.productID = O.product AND P.shopID = S.shopID
ORDER BY O.ordertime DESC;

-- Add a user and give the privilieges to the user
CREATE USER app_user WITH PASSWORD 'abc';
-- Grant database access
GRANT CONNECT ON DATABASE "storeDB" TO app_user;
-- Grant relation specific access
GRANT SELECT ON ShopInfoView TO app_user;
GRANT SELECT, UPDATE, INSERT ON Products TO app_user;
GRANT SELECT, INSERT, UPDATE ON Users TO app_user;
GRANT SELECT ON UserInfoView TO app_user;
GRANT SELECT, INSERT ON Shops TO app_user;
GRANT SELECT, INSERT ON Sellers TO app_user;
GRANT SELECT ON OrdersInfoView TO app_user;
GRANT SELECT, INSERT ON Orders TO app_user;

-- Add indexes
CREATE INDEX email_index ON Users (Email);
CREATE INDEX shop_index ON Shops (ShopName);
CREATE INDEX product_index ON Products (Name);
