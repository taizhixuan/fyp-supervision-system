# Project 2: Implementation

## Chapter 5

*For Software Engineering OR Information Systems*

---

## Chapter 5: Implementation

The purpose of the implementation chapter is to give the reader a clear picture of how you developed your system.

---

## 5.1 Deployment

- Briefly summarize the implementation scope
- Mention the main modules and how they map to the system's objectives

---

## 5.2 Development Environment

### 5.2.1 Programming Languages Used
- e.g., Java, C#, Python, JavaScript

### 5.2.2 Frameworks and Libraries
- e.g., React, ASP.NET Core, Spring Boot

### 5.2.3 IDEs and Tools
- VS Code, IntelliJ IDEA, Android Studio

### 5.2.4 Version Control System
- e.g., Git/GitHub

### 5.2.5 Operating System Used

---

## 5.3 System Configuration and Setup

### 5.3.1 Backend Setup
- Server configuration (e.g., Apache, Node.js, IIS)
- Middleware setup (e.g., Express.js, Django middleware)
- Database server setup (e.g., MySQL, PostgreSQL, MongoDB)

### 5.3.2 Frontend Setup
- Web / mobile framework configurations (e.g., Vue CLI, React scripts)
- UI component integration (e.g., Bootstrap, Material UI)

### 5.3.3 Build Tools and Package Managers
- e.g., npm, Maven, Gradle

---

## 5.4 Database Implementation

### 5.4.1 Database Schema Design

### 5.4.2 SQL/NoSQL Database Tables / Collections

### 5.4.3 Stored Procedures or Triggers (if applicable)

### 5.4.4 Tools Used for Database Management
- e.g., phpMyAdmin, MySQL Workbench

---

## 5.5 Key Modules and Features Developed

For each module or subsystem, describe:
- Feature / functionality
- Screenshots or code snippets
- Algorithm or logic used or pseudo code
- Integration with other components

### 5.5.1 User Authentication Module

**Technologies used:** Firebase Auth

This validates user credentials, manages sessions.

**Pseudocode:**

```
BEGIN
IF (is admin) THEN
    INPUT ID, Password
    READ (ID, Password)
    IF (ID is Matched and Password is Matched)
        Go to Admin Page
ELSE IF (is user) THEN
    INPUT ID, Password AND SELECT TYPE
    READ (ID, Password, TYPE)
    IF (ID found in database AND Password found in database AND TYPE found in database) THEN
        go to homepage
    ELSE
        DISPLAY message "Invalid ID or password"
    END IF
ELSE
    Display Message "Please Identify Yourself"
END IF
END
```

**Integration:** Redirects to Dashboard on successful login

---

## 5.6 APIs and Integration

### 5.6.1 Description of Internal APIs or Third-Party APIs Used

### 5.6.2 API Endpoints Implemented

### 5.6.3 JSON / XML Payload Structure

### 5.6.4 Authentication Mechanisms
- e.g., JWT, OAuth2

---

## 5.7 Network Configuration (if applicable)

### 5.7.1 Hosting Setup
- e.g., localhost, cloud server

### 5.7.2 Port Configuration

### 5.7.3 Deployment to Server or Live Environment

---

## 5.8 Security Measures

### 5.8.1 Input Validation, Encryption, HTTPS Configuration

### 5.8.2 Role-Based Access Control (RBAC)

### 5.8.3 Error Handling and Logging

---

## 5.9 Challenges Encountered and Solutions

### 5.9.1 Challenges Encountered
Explain about the technical difficulties faced during implementation.

### 5.9.2 Solutions
How you overcame or mitigated those issues.

---

## 5.10 Summary

- Reflect on how the implementation aligns with initial design
- Mention any pending or future improvements

---

*THE END*
