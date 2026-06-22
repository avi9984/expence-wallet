-- Active: 1781946984709@@127.0.0.1@5432@expense_wallet



CREATE TABLE Departments(
    ID SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Users(
    ID SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id)
);

CREATE TABLE Wallets(
    ID SERIAL PRIMARY KEY,
    department_id INTEGER UNIQUE REFERENCES departments(id),
    balance NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE Transactions(
    ID SERIAL PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id),
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(12,2) NOT NULL,
    vendor_name VARCHAR(100),
    status VARCHAR(100),
    createdAt TIMESTAMP DEFAULT NOW()
);


--CREATE DATABASE expense_wallet;


SELECT * FROM departments;

SELECT * FROM users;

-- DROP TABLE departments;

-- DROP TABLE users;
-- DROP TABLE wallets;

-- DROP TABLE transactions;


SELECT * FROM wallets;

