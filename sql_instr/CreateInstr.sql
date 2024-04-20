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

-- Reviews Table
CREATE TABLE Reviews(
    ReviewID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Shop UUID NOT NULL,
    Product UUID NOT NULL,
    DatePosted Date,
    Comment TEXT,
    Reviewer UUID NOT NULL REFERENCES Buyers(BuyerID),
    Rating INTEGER NOT NULL,
    CONSTRAINT review_product_fkey FOREIGN KEY (Shop, Product) REFERENCES Products(ShopID, ProductID) ON DELETE CASCADE
);

-- ShopInfoView View
CREATE VIEW ShopInfoView AS
SELECT
  shopid, shopname, description, establishdate,
  owner as ownerid, CONCAT(firstname, ' ', lastname) AS ownername, email AS owneremail, dob AS ownerdob
  FROM Shops
  INNER JOIN Sellers ON Shops.Owner = Sellers.SellerID
  INNER JOIN Users ON Shops.Owner = Users.UserID
  ORDER BY shopname;

-- UserInfoView View
CREATE VIEW UserInfoView AS
SELECT 
userid, firstname, lastname, email, dob, password, 
EXISTS(SELECT * FROM Sellers WHERE Users.userid = Sellers.sellerid) AS isaseller
FROM Users;

-- Create OrderInfoView
CREATE VIEW OrdersInfoView AS
SELECT O.orderid, O.shop as shopid, S.shopName, P.productID, P.name as productname, O.quantity, O.ordertime, O.buyer
FROM Orders O
JOIN Shops S ON O.shop = S.shopID
JOIN Products P ON P.productID = O.product AND P.shopID = S.shopID
ORDER BY O.ordertime DESC;
