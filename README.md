# Enterprise MERN Backend Engine

A professional, scalable, secure, and production-ready Node.js, Express, and MongoDB (Mongoose) backend engine. Built using modern ES Modules (import/export), this architecture incorporates enterprise-grade patterns (MVC, Soft Deletes, Connection Pooling, JWT Auth Rotation, RBAC, File Uploads, Security Guards, Background Cron Jobs, and Real-Time Sockets) suitable for large-scale SaaS, E-Commerce, CRM, and ERP systems.

---

## Key Architectural Highlights

*   **Clean MVC Architecture**: Strict segregation of models, controllers, routes, configurations, and validation layers.
*   **Security Safeguards**:
    *   **Helmet & CORS**: Hardened headers and configuration supporting dynamic, credentialed client origins.
    *   **NoSQL Injection Blocker**: Middleware sanitizing payload keys starting with `$` or containing `.`.
    *   **XSS Protection**: HTML-escaping strings inside JSON requests.
    *   **Secure Cookies**: JWT access and refresh tokens set with `HttpOnly`, `SameSite=Strict`, and `Secure` properties.
    *   **Strict Password Policies**: BCryptjs hashes passwords with validation requiring special characters, uppercase, lowercase, numbers, and minimum length.
*   **Mongoose Enhancements**:
    *   **Connection Pooling**: Limit connection sockets (max: 10) to prevent database resource starvation.
    *   **Soft Deletes**: Pre-query schema filter hooks automatically exclude documents marked `isDeleted: true`.
    *   **Pagination Utility**: High-performance paginated document retrieval with complete metadata response.
*   **Real-time Communication**: Integrated Socket.io bindings for push notifications and channels.
*   **Background Cron Job Engine**: Automates periodic cleanup procedures (e.g. purging expired unverified users).
*   **Optimized File Upload Pipeline**: Sharp image resizing transformations paired with direct Cloudinary storage streams to bypass local filesystem clutter.

---

## Detailed Directory Layout

```text
backend/
├── public/                 # Static asset server directory
├── tests/                  # Integration / Unit test specs folder
├── src/
│   ├── config/             # Database, Cloudinary, Sockets connection boots
│   ├── constants/          # User roles mapping and app-wide configurations
│   ├── controllers/        # Request handlers & response routers
│   ├── cron/               # Node-cron background jobs
│   ├── docs/               # API endpoint specifications and templates
│   ├── emails/             # HTML templates for system mailings
│   ├── helpers/            # Reusable paging and parsing helpers
│   ├── middleware/         # Auth guards, RBAC, Rate-limit, and security blockers
│   ├── models/             # Mongoose DB schema definitions
│   ├── repositories/       # Abstraction layer for data model querying
│   ├── routes/             # Versioned express routers
│   ├── services/           # Nodemailer, SMS, external API modules
│   ├── sockets/            # Real-time event communication controllers
│   ├── uploads/            # Temporary disk directories for upload buffers
│   ├── validators/         # Express-validator input checkers
│   ├── app.js              # Express middleware and security configuration setup
│   └── server.js           # Native HTTP server binder & error exception listeners
├── .env                    # Current configuration variables
├── .env.example            # Environment template schema
├── .gitignore              # Version control ignore lists
├── package.json            # Node module details and build scripts
└── README.md               # Enterprise system documentation
```

---

## Setup & Installations

### 1. Prerequisite Installations
*   Ensure **Node.js (v18+)** and **npm** are installed on your machine.
*   Setup a **MongoDB Atlas Cluster** (or local MongoDB database service).
*   Obtain a free **Cloudinary** cloud account for image hosting.
*   Configure an **SMTP** server account (e.g. Gmail App Passwords, Mailtrap, or Sendgrid).

### 2. Dependency Installation
Navigate to your project root folder and execute:
```bash
npm install
```

### 3. Environment Setup
Create a file named `.env` in the `backend/` directory, copying the structure from `.env.example`:
```ini
PORT=5000
NODE_ENV=development

# Database Connection (MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/urbasi?retryWrites=true&w=majority

# CORS Allowed Origins (Comma-separated)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# JWT Token Secrets (Create strong, random strings)
JWT_ACCESS_SECRET=your_super_long_and_secure_jwt_access_secret_13579
JWT_REFRESH_SECRET=your_super_long_and_secure_jwt_refresh_secret_24680
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# SMTP E-Mail configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="Urbasi Notifications" <noreply@urbasi.com>

# Cloudinary Storage configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Running the Project
*   **Development mode (auto-restart with Nodemon)**:
    ```bash
    npm run dev
    ```
*   **Production start**:
    ```bash
    npm start
    ```

---

## API Testing Workflow (Postman / Thunder Client)

All endpoints conform to the `/api/v1` namespace and deliver standard JSON responses.

### Successful Response Format (2xx):
```json
{
  "success": true,
  "message": "User logged in successfully.",
  "data": {
    "user": {
      "username": "john_doe",
      "email": "john@example.com",
      "role": "Customer"
    },
    "accessToken": "ey...",
    "refreshToken": "ey..."
  }
}
```

### Error Response Format (4xx / 5xx):
```json
{
  "success": false,
  "message": "Request input validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    }
  ]
}
```

### Workflow Execution Guide:

1.  **Register account**: `POST /api/v1/auth/register`
    *   Payload: `username`, `email`, `password`, `role` (Optional, defaults to `"Customer"`).
2.  **Verify OTP**: `POST /api/v1/auth/verify-otp`
    *   Payload: `email`, `otp` (sent to recipient's email address).
3.  **Resend OTP (If Expired)**: `POST /api/v1/auth/resend-otp`
    *   Payload: `email`.
4.  **Login User**: `POST /api/v1/auth/login`
    *   Payload: `email`, `password`. Sets secure HTTP cookies.
5.  **Access Authenticated Profile**: `GET /api/v1/auth/me`
    *   Requires JWT access token inside the `Authorization` header (`Bearer <token>`) or `accessToken` cookie.
6.  **Upload User Avatar**: `POST /api/v1/auth/upload-avatar`
    *   Content-Type: `multipart/form-data`.
    *   Field key: `avatar` (Attach an image file).
7.  **Verify RBAC Rights (Admin Only)**: `GET /api/v1/auth/admin-only`
    *   Requires user session role to be `"Super Admin"` or `"Admin"`. Returns `403 Forbidden` for standard `"Customer"` roles.

---

## Multi-Platform Hosting & Deployment Guide

### A. Render Setup
1.  Connect your GitHub repository to [Render](https://render.com/).
2.  Create a new **Web Service**.
3.  Set settings:
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node src/server.js`
4.  Add all variables from `.env` under **Environment Variables** (except `PORT`, Render injects this automatically).

### B. Railway Setup
1.  Create a project on [Railway](https://railway.app/).
2.  Link your repository.
3.  Railway automatically reads `package.json` scripts and fires `npm run build` (if configured) followed by `npm start`.
4.  Bind all environment variables in Railway's service settings tab.

### C. AWS (Elastic Beanstalk or ECS / Docker)
1.  Containerize the app with a simple `Dockerfile`:
    ```dockerfile
    FROM node:18-alpine
    WORKDIR /usr/src/app
    COPY package*.json ./
    RUN npm install --only=production
    COPY . .
    EXPOSE 5000
    CMD ["node", "src/server.js"]
    ```
2.  Deploy the container utilizing **AWS Elastic Container Service (ECS)** with AWS Fargate.
3.  Inject database and connection secrets securely using **AWS Systems Manager (SSM) Parameter Store** or **Secrets Manager**.

### D. DigitalOcean (App Platform or Droplet)
*   **App Platform (PaaS)**:
    1. Connect GitHub and choose Node.js builder.
    2. Add environment configurations.
    3. Specify port `8080` (or host defaults) and define start command as `node src/server.js`.
*   **Droplet (IaaS VM)**:
    1. Spin up an Ubuntu server droplet.
    2. Install Node.js, Git, and Nginx.
    3. Install Process Manager 2 (PM2) to manage process state: `npm install -g pm2`.
    4. Fire process instance: `pm2 start src/server.js --name "mern-backend"`.
    5. Setup Nginx reverse proxy routing traffic from port `80` to your app port `5000`.
