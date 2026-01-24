const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Ensure uploads dir exists
const fs = require('fs');
if (!fs.existsSync('uploads')){
    fs.mkdirSync('uploads');
}

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return a URL that can be accessed (need to serve static files)
    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.json({ file_url: fileUrl });
});

module.exports = router;
