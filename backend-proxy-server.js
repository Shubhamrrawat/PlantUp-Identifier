const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/');
}

const upload = multer({ storage });

// Enable CORS
app.use(cors());

// Serve static files from the current directory
app.use(express.static('.'));

// API endpoint to handle plant identification
app.post('/api/identify-plant', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // PlantNet API key
    const apiKey = process.env.PLANTNET_API_KEY || '2b10ufqQnl0X7DNIauyWjTske';
    
    // Create FormData for PlantNet API
    const formData = new FormData();
    formData.append('images', fs.createReadStream(req.file.path));
    
    // Make request to PlantNet API
    const response = await axios.post(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );

    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
    
    // Return the response from PlantNet
    res.json(response.data);
  } catch (error) {
    console.error('Error identifying plant:', error);
    
    // Send appropriate error response
    if (error.response) {
      return res.status(error.response.status).json({
        error: `PlantNet API error: ${error.response.status}`,
        message: error.response.data
      });
    }
    
    res.status(500).json({ error: 'Failed to identify plant' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});