# Smart Inventory API Documentation

## Overview
Backend API for compartment-based inventory management with image upload support.

## Base URL
```
http://localhost:3000
```

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python -m app.main
```

The API will be available at `http://localhost:3000`

API Documentation: `http://localhost:3000/docs`

---

## Key Features

### For Normal Users
- View items by compartment/location
- Filter available items only
- See item details with images

### For Admin Users
- Upload item images
- Create/update/delete items
- Manage all compartments

---

## API Endpoints

### 📦 Items

#### Get All Items
```http
GET /api/items
```

**Query Parameters:**
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Max items to return (default: 100)
- `available` (bool): Filter by availability

**Response:**
```json
[
  {
    "id": 1,
    "uid": "RFID123456",
    "name": "Laptop",
    "description": "Dell XPS 15",
    "category": "Electronics",
    "quantity": 1,
    "available": true,
    "location": "A1-001",
    "image_url": "/uploads/items/RFID123456_20260216_143025.jpg",
    "created_at": "2026-02-16T14:30:25",
    "updated_at": "2026-02-16T14:30:25"
  }
]
```

#### Get Item by UID
```http
GET /api/items/{uid}
```

**Parameters:**
- `uid` (string): Item's RFID UID

#### Create Item
```http
POST /api/items
```

**Request Body:**
```json
{
  "uid": "RFID123456",
  "name": "Laptop",
  "description": "Dell XPS 15",
  "category": "Electronics",
  "quantity": 1,
  "available": true,
  "location": "A1-001",
  "image_url": null
}
```

#### Update Item
```http
PUT /api/items/{uid}
```

**Request Body:** Same as Create Item

#### Delete Item
```http
DELETE /api/items/{uid}
```

#### Upload Item Image (Admin)
```http
POST /api/items/{uid}/upload-image
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (image file)

**Supported Formats:** .jpg, .jpeg, .png, .gif, .webp

**Response:**
```json
{
  "id": 1,
  "uid": "RFID123456",
  "name": "Laptop",
  "image_url": "/uploads/items/RFID123456_20260216_143025.jpg",
  ...
}
```

**Example (curl):**
```bash
curl -X POST "http://localhost:3000/api/items/RFID123456/upload-image" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@laptop.jpg"
```

#### Get Items by Location
```http
GET /api/items/by-location/{location}
```

**Query Parameters:**
- `available_only` (bool): Show only available items (default: false)

**Example:**
```http
GET /api/items/by-location/A1-001?available_only=true
```

---

### 🏢 Compartments

#### Get All Compartments
```http
GET /api/compartments
```

**Query Parameters:**
- `floor` (int): Filter by floor (1 or 2)
- `status_filter` (string): Filter by status (available, occupied, overdue, maintenance)

#### Get Compartment by Locker Number
```http
GET /api/compartments/{locker_number}
```

#### Get Items in a Compartment
```http
GET /api/compartments/{locker_number}/items
```

**Query Parameters:**
- `available_only` (bool): Show only available items (default: false)

**Use Cases:**
- Normal users: Set `available_only=true` to see borrowable items
- Admin: Leave default to see all items in compartment

**Example:**
```http
GET /api/compartments/A1-001/items?available_only=true
```

**Response:**
```json
[
  {
    "id": 1,
    "uid": "RFID123456",
    "name": "Laptop",
    "available": true,
    "location": "A1-001",
    "image_url": "/uploads/items/RFID123456_20260216_143025.jpg",
    ...
  }
]
```

#### Get Items on a Floor
```http
GET /api/compartments/floor/{floor}/items
```

**Query Parameters:**
- `available_only` (bool): Show only available items

**Example:**
```http
GET /api/compartments/floor/1/items?available_only=true
```

#### Create Compartment
```http
POST /api/compartments
```

**Request Body:**
```json
{
  "floor": 1,
  "locker_number": "A1-001",
  "status": "available"
}
```

#### Update Compartment
```http
PUT /api/compartments/{locker_number}
```

#### Delete Compartment
```http
DELETE /api/compartments/{locker_number}
```

---

## Data Models

### Item
```typescript
{
  id: integer
  uid: string (unique, RFID UID)
  name: string
  description?: string
  category?: string
  quantity: integer (default: 1)
  available: boolean (default: true)
  location?: string (compartment/locker number)
  image_url?: string (path to uploaded image)
  created_at: datetime
  updated_at: datetime
}
```

### Compartment
```typescript
{
  id: integer
  floor: integer (1 or 2)
  locker_number: string (unique)
  status: string (available, occupied, overdue, maintenance)
  item_uid?: string
  user_uid?: string
  occupied_at?: datetime
  due_at?: datetime
}
```

---

## Usage Examples

### Frontend Integration

#### Display Items by Compartment (User View)
```javascript
// Fetch available items in compartment A1-001
const response = await fetch(
  'http://localhost:3000/api/compartments/A1-001/items?available_only=true'
);
const items = await response.json();

// Display items with images
items.forEach(item => {
  console.log(`${item.name} - ${item.available ? 'Available' : 'Not Available'}`);
  if (item.image_url) {
    // Image URL: http://localhost:3000/uploads/items/...
    const imageUrl = `http://localhost:3000${item.image_url}`;
  }
});
```

#### Upload Item Image (Admin)
```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);

const response = await fetch(
  `http://localhost:3000/api/items/${itemUid}/upload-image`,
  {
    method: 'POST',
    body: formData
  }
);

const updatedItem = await response.json();
console.log('Image uploaded:', updatedItem.image_url);
```

#### Create New Item Listing (Admin)
```javascript
const newItem = {
  uid: 'RFID789012',
  name: 'Arduino Kit',
  description: 'Complete Arduino starter kit',
  category: 'Electronics',
  quantity: 5,
  available: true,
  location: 'A1-002'
};

const response = await fetch('http://localhost:3000/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newItem)
});

const createdItem = await response.json();

// Then upload image
const formData = new FormData();
formData.append('file', imageFile);

await fetch(
  `http://localhost:3000/api/items/${createdItem.uid}/upload-image`,
  {
    method: 'POST',
    body: formData
  }
);
```

---

## File Storage

### Image Storage
- Location: `backend/uploads/items/`
- Format: `{uid}_{timestamp}.{ext}`
- Example: `RFID123456_20260216_143025.jpg`

### Accessing Images
Images are served as static files:
```
http://localhost:3000/uploads/items/RFID123456_20260216_143025.jpg
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Item with UID RFID123456 already exists"
}
```

### 404 Not Found
```json
{
  "detail": "Item with UID RFID999999 not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to save image: [error details]"
}
```

---

## Security Notes

### Future Enhancements
1. **Authentication**: Add JWT tokens for admin endpoints
2. **Authorization**: Separate user/admin permissions
3. **Rate Limiting**: Prevent abuse of image uploads
4. **Image Validation**: Check file size limits
5. **CORS**: Restrict origins in production

### Current CORS Settings
Currently allows all origins (`*`) for development. Update in production:
```python
origins = [
    "https://yourdomain.com",
    "https://admin.yourdomain.com"
]
```

---

## Database Migration

After adding the `image_url` field, the database will auto-update on restart.

To manually reset the database:
```bash
rm inventory.db  # Delete old database
python -m app.main   # Recreate with new schema
python ../scripts/seed/seed_data.py  # Optional: Add sample data
```

---

## Testing

### Interactive API Docs
Visit `http://localhost:3000/docs` for Swagger UI to test all endpoints interactively.

### Sample Workflow

1. **Create a compartment:**
   ```bash
   curl -X POST "http://localhost:3000/api/compartments" \
     -H "Content-Type: application/json" \
     -d '{"floor": 1, "locker_number": "A1-001", "status": "available"}'
   ```

2. **Create an item in that compartment:**
   ```bash
   curl -X POST "http://localhost:3000/api/items" \
     -H "Content-Type: application/json" \
     -d '{"uid": "RFID001", "name": "Test Item", "location": "A1-001", "available": true}'
   ```

3. **Upload image for the item:**
   ```bash
   curl -X POST "http://localhost:3000/api/items/RFID001/upload-image" \
     -F "file=@item.jpg"
   ```

4. **View items in compartment:**
   ```bash
   curl "http://localhost:3000/api/compartments/A1-001/items?available_only=true"
   ```

---

## Support

For issues or questions, check:
- API Docs: `http://localhost:3000/docs`
- Health Check: `http://localhost:3000/health`
