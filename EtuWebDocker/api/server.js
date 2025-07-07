const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Conserve le nom d'origine
  }
});

// Filtre pour accepter seulement les PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF sont acceptés!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

// CORS - Permettre les requêtes depuis votre site web
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Middleware pour parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Route principale - message simple
app.get('/', (req, res) => {
  res.json({ 
    message: 'API EtuWeb - Service d\'upload PDF',
    timestamp: new Date().toISOString(),
    endpoints: {
      upload: 'POST /upload-pdf',
      files: 'GET /files'
    }
  });
});

// Route pour uploader un PDF
app.post('/upload-pdf', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier PDF fourni'
      });
    }

    console.log(`PDF uploadé: ${req.file.originalname} -> ${req.file.filename}`);
    
    res.json({
      success: true,
      message: 'PDF uploadé avec succès',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        uploadDate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload du PDF'
    });
  }
});

// Route pour lister les fichiers uploadés
app.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          uploadDate: stats.birthtime.toISOString()
        };
      });

    res.json({
      success: true,
      count: files.length,
      files: files
    });
    
  } catch (error) {
    console.error('Erreur lecture fichiers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la lecture des fichiers'
    });
  }
});

const { exec } = require('child_process');

app.post('/process-pdf', (req, res) => {
  const filename = req.body.filename;
  const uploadsPath = path.join(__dirname, 'uploads', filename);
  const dataPath = path.join(__dirname, 'EtuReadPdf', 'data', filename);

  try {
    fs.renameSync(uploadsPath, dataPath);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Déplacement échoué' });
  }

  const outputFile = `${filename.replace(/\.pdf$/i, '.json')}`;
  const command = `cd EtuReadPdf; python3 EtuReadPdfV2.py --output json/${outputFile} --format json data/${filename}`;

  exec(command, { cwd: path.join(__dirname, 'EtuReadPdf') }, (error, stdout, stderr) => {
    if (error) {
      console.error(stderr);
      return res.status(500).json({ success: false, error: 'Erreur exécution Python' });
    }

    const command2 = `mv /app/EtuReadPdf/json/${outputFile} /app/shared-notes/${outputFile}`;
    exec(command2, (error2, stdout2, stderr2) => {
      if (error2) {
        console.error(stderr2);
        return res.status(500).json({ success: false, error: 'Erreur déplacement JSON' });
      }

      res.json({
        success: true,
        message: 'PDF traité avec succès',
        outputFile: outputFile
      });
      console.log(`PDF traité: /app/EtuReadPdf/json/${outputFile} -> /app/shared-notes/${outputFile}`);
    });
  });
});

// Gestion des erreurs multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Fichier trop volumineux (max 10MB)'
      });
    }
  }
  
  if (error.message === 'Seuls les fichiers PDF sont acceptés!') {
    return res.status(400).json({
      success: false,
      error: 'Seuls les fichiers PDF sont acceptés'
    });
  }
  
  console.error('Erreur:', error);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} non trouvée`
  });
});

// Démarrage du serveur
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API PDF Upload démarrée sur le port ${port}`);
  console.log(`📁 Dossier uploads: ${uploadsDir}`);
  console.log(`📍 Test: http://localhost:${port}/`);
});
