# Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python main.py
```

The server will start at `http://localhost:3000`

### 3. Test the API
Visit `http://localhost:3000/docs` for interactive API documentation.

---

## What Was Added

### Image Upload Feature
- **Admin capability**: Upload images for inventory items
- **Endpoint**: `POST /api/items/{uid}/upload-image`
- **Supported formats**: JPG, JPEG, PNG, GIF, WEBP
- **Storage**: Images saved to `uploads/items/` directory
- **Serving**: Static files served at `/uploads/items/{filename}`

### Compartment-Based Item Listing
- **User view**: See items by compartment with availability filter
- **Endpoints**:
  - `GET /api/compartments/{locker_number}/items` - Items in specific compartment
  - `GET /api/compartments/floor/{floor}/items` - All items on a floor
  - `GET /api/items/by-location/{location}` - Items at specific location

### Database Changes
- Added `image_url` field to Item model
- Database will auto-migrate on first run

---

## Testing the Features

### Upload an Image (Admin)
```bash
# First, create an item
curl -X POST "http://localhost:3000/api/items" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "TEST001",
    "name": "Test Item",
    "location": "A1-001",
    "available": true
  }'

# Then upload an image
curl -X POST "http://localhost:3000/api/items/TEST001/upload-image" \
  -F "file=@path/to/image.jpg"
```

### View Items by Compartment (User)
```bash
# See all available items in compartment A1-001
curl "http://localhost:3000/api/compartments/A1-001/items?available_only=true"
```

---

## File Structure
```
backend/
├── uploads/              # Auto-created on first run
│   └── items/           # Item images stored here
├── app/
│   ├── models/
│   │   └── item.py      # Updated with image_url field
│   ├── schemas/
│   │   └── item.py      # Updated with image_url field
│   └── routes/
│       ├── items.py     # Added image upload endpoint
│       └── compartments.py  # Added item listing endpoints
├── main.py              # Updated with static file serving
└── requirements.txt     # Added python-multipart & Pillow
```

---

## Next Steps

### Frontend Integration
The frontend can now:
1. Display item images using the `image_url` field
2. Filter items by compartment and availability
3. Allow admins to upload images via file upload form

### Recommended Frontend Changes
- **User Dashboard**: Add compartment selector and item grid with images
- **Admin Dashboard**: Add image upload form to item management page

---

## Security Considerations

⚠️ **Before production deployment:**
1. Add authentication/authorization for admin endpoints
2. Implement file size limits for uploads
3. Add image compression/optimization
4. Restrict CORS origins
5. Add rate limiting for upload endpoints

---

## Troubleshooting

### Import Error: No module named 'PIL'
```bash
pip install Pillow
```

### Upload Directory Not Found
The directory is auto-created on startup. If issues persist:
```bash
mkdir -p uploads/items
```

### Database Schema Issues
Delete and recreate the database:
```bash
rm inventory.db
python main.py
```

---

## Full API Documentation
See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint reference.
