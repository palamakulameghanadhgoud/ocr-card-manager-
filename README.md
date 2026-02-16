# Business Card Manager

A full-stack web application for managing business cards with OCR-based contact extraction.

## Features

- **Upload business cards** – Drag-and-drop or click to upload images
- **OCR extraction** – Extract contact info using Tesseract.js (name, company, job title, phone, email, website, address)
- **Manual editing** – Review and correct extracted data before saving
- **Categories** – Industry, Relationship Type, Priority (with custom tag support)
- **Search & filter** – Real-time search and category filters
- **CRUD operations** – Create, read, update, delete cards
- **Responsive UI** – Works on mobile and desktop
- **Grid/List views** – Toggle between card layouts
- **Sort options** – By name, company, or date added

## Tech Stack

- **Frontend:** React 18, React Router, Axios, react-dropzone, Material-UI
- **Backend:** Node.js, Express, Multer, Mongoose
- **Database:** MongoDB
- **OCR:** Tesseract.js (server-side)

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

1. **Install dependencies:**

   ```bash
   npm run install:all
   ```

2. **Configure environment (optional):**

   Create `server/.env`:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/business-cards
   NODE_ENV=development
   ```

3. **Start MongoDB** (if running locally).

4. **Run the app:**

   ```bash
   npm run dev
   ```

   This starts:
   - Backend at http://localhost:5000
   - Frontend at http://localhost:3000 (proxies API and uploads to backend)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/cards | Create card (multipart form with image) |
| GET | /api/cards | Get all cards (supports ?search, ?industry, ?relationshipType, ?priority, ?sortBy, ?sortOrder) |
| GET | /api/cards/:id | Get single card |
| PUT | /api/cards/:id | Update card |
| DELETE | /api/cards/:id | Delete card |
| POST | /api/ocr | Process image with OCR (multipart form) |
| GET | /api/categories | Get all categories |
| POST | /api/categories | Create category |

## Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   └── theme.js
│   └── ...
├── server/           # Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── uploads/      # Uploaded images (created automatically)
│   └── ...
└── README.md
```

## Production

- Set `NODE_ENV=production`
- Use MongoDB Atlas or a production MongoDB instance
- For image storage, consider AWS S3 or Cloudinary
- Build frontend: `npm run build` and serve the `client/dist` folder
- Update CORS and proxy configuration as needed
