# 🚀 Dict-o-Day Startup Guide

This guide explains how to start and run the complete Dict-o-Day application stack locally.

---

## 🛠 Prerequisites

Before starting the services, ensure you have the following installed and running:

1. **Java Development Kit (JDK)**: Version 21 or higher.
2. **Node.js & npm**: For running the React frontend.
3. **Python 3.10+**: For running the FastAPI middleware.
4. **PostgreSQL**: Running on port `5432` with a database named `dictoday` created (Username: `postgres`, Password: `postgres`).
5. **Redis**: Running on port `6379` (used for rate-limiting and streaking/caching).

---

## 🚦 Startup Instructions

To run the application, you need to start three separate services. It is recommended to open three separate terminal windows or run them in the background:

### 1. Spring Boot Backend (Port 8080)
From the root directory:
```powershell
# Windows
.\mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```
*The backend will automatically compile the code, update the database schema, and seed the initial vocabulary words.*

---

### 2. FastAPI Middleware (Port 8000)
From the `middleware` directory:
```powershell
cd middleware

# Activate the virtual environment
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# Windows (CMD)
.\venv\Scripts\activate.bat
# macOS / Linux
source venv/bin/activate

# Start the uvicorn server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 3. React Frontend (Port 3000)
From the `frontend` directory:
```powershell
cd frontend
npm start
```
*This will start the development server and open http://localhost:3000 in your browser.*

---

## 🔗 Port Mappings & Access

- **React Frontend**: `http://localhost:3000` (User Interface)
- **FastAPI Middleware Gateway**: `http://localhost:8000` (API routes proxied to backend, AI tutor features, health checks)
- **Spring Boot Backend**: `http://localhost:8080` (Core business logic, REST APIs, WebSockets)
- **Database (PostgreSQL)**: `localhost:5432`
- **Cache (Redis)**: `localhost:6379`
