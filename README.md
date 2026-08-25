# 🏦 Digital Banking System

🌐 **Live Website:** https://digital-banking-system-dd918.web.app

## 📌 About the Project

The **Digital Banking System** is a web-based banking application designed to provide users with a simple and convenient way to manage their banking activities online.

Instead of visiting a bank for basic operations, users can create an account, log in securely, check their balance, send and receive money, deposit or withdraw virtual money, and view their transaction history through the website.

The project also includes a separate **Administration Panel** that allows administrators to monitor customers, manage accounts, and keep track of banking transactions.

I developed this project to understand how a real-world digital banking system can be designed using frontend technologies together with Firebase services.

## 🎯 Main Objective

The main objective of this project is to create a **simple, interactive, and user-friendly digital banking platform**.

The system allows users to:

- Create a banking account online.
- Log in securely.
- Check their account balance.
- Send money to other users.
- Deposit virtual money.
- Withdraw virtual money.
- View transaction history.
- Manage their account information.

The administration panel provides additional tools for monitoring and managing the banking system.

## ✨ Features

### 👤 User

- Create a new account
- User registration
- Secure login
- User dashboard
- View account balance
- Send money
- Deposit money
- Withdraw money
- View transaction history
- View account information
- Report banking issues
- Logout

### 👨‍💼 Administrator

- Secure administrator login
- Administrator dashboard
- Monitor registered users
- View customer accounts
- Monitor transactions
- View account balances
- Manage user accounts
- Check active and blocked accounts
- View banking statistics
- Monitor total virtual money
- Manage customer status
- Logout

## 💳 Banking Operations

The system provides several basic banking operations through the user dashboard.

### 💰 Deposit

Users can add virtual money to their account balance.

### 💸 Withdraw

Users can withdraw virtual money from their available balance.

### ↔️ Send Money

Users can transfer money to another registered user using their account details.

### 📊 Transaction History

Users can view their previous banking activities and transactions from the transaction section.

## 📊 Administration Dashboard

The administration panel provides an overview of the banking system.

Administrators can monitor:

- Total users
- Active users
- Blocked users
- Total virtual money
- Customer accounts
- Banking transactions
- Account status

The dashboard also uses visual statistics and interactive elements to make it easier to understand the current state of the banking system.

## 🔐 Authentication

**Firebase Authentication** is used to manage user accounts and login.

The system provides separate access for:

**User**

- Create account
- Login
- Access personal banking dashboard
- Perform banking operations

**Administrator**

- Administrator login
- Access administration dashboard
- Monitor users
- Manage accounts
- Monitor transactions

Only users with administrator privileges can access the administration panel.

## 🗄️ Database

**Cloud Firestore** is used to store and manage application data.

The database contains information related to:

- User accounts
- Customer information
- Account numbers
- Account balances
- User roles
- Account status
- Transactions
- Transaction amounts
- Transaction dates

The system uses different roles such as:

- `user`
- `admin`

to control access to different parts of the application.

## 🛠️ Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend and Cloud Services

- Firebase Authentication
- Cloud Firestore
- GitHub Pages

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Firebase Console

## 📁 Project Structure

```text
DIGITAL_BANK/
│
├── index.html
├── admin-login.html
├── admin.html
├── style.css
├── app.js
├── pritam.jpeg
│
└── README.md
