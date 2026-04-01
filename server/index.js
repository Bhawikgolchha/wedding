import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Set up directory for storing images and the database JSON
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'db.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Ensure db exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp + random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Helper to read and write DB
const getDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const saveDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// API Endpoints

// GET /api/images - fetch all globally shared images
app.get('/api/images', (req, res) => {
  try {
    const images = getDb();
    // Sort descending by timestamp (newest first)
    images.sort((a, b) => b.timestamp - a.timestamp);
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// POST /api/upload - upload a new image
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { guestId } = req.body;
    
    if (!guestId) {
      // Cleanup the uploaded file if missing required metadata
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing guestId' });
    }

    const newImage = {
      id: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      timestamp: Date.now(),
      guestId: guestId // Who uploaded it
    };

    const images = getDb();
    images.push(newImage);
    saveDb(images);

    res.status(201).json(newImage);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// DELETE /api/images/:id - delete an image if guestId matches
app.delete('/api/images/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { guestId } = req.body; // guestId must be provided in the request body
    
    if (!guestId) {
      return res.status(400).json({ error: 'Missing guestId for deletion' });
    }

    const images = getDb();
    const imageIndex = images.findIndex(img => img.id === id);

    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Verify ownership
    if (images[imageIndex].guestId !== guestId) {
      return res.status(403).json({ error: 'Forbidden: You did not upload this image.' });
    }

    // Remove from DB
    const [deletedImage] = images.splice(imageIndex, 1);
    saveDb(images);

    // Delete actual file
    const filePath = path.join(UPLOADS_DIR, deletedImage.id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Global backend server running on http://localhost:${PORT}`);
});
