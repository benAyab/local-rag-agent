import express from 'express';
const router = express.Router();
import * as fs from 'node:fs';

import upload from '../config/multer.js';
import Document from '../models/Document.js';
import { authenticateToken } from '../middleware/auth.js';

import documentService from "../services/documentService.js";

// Upload de document
router.post('/upload', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni'});
    }
    
    const username    =   req.user.sub;
    const file        =   req.file;

    console.log(`File save in: ${file.path}, original name: ${file.originalname}, file size: ${file.size}`);
    
    // To replace with RAG process
    const docId = await documentService.processDocument(file.path, file.filename)
    
    // Sauvegarder les métadonnées
    const document = new Document({
      filename: file.originalname,
      uploaded_by: username || "ben",
      file_size: file.size,
      content_type: file.mimetype,
      uploaded_at: new Date(),
      doc_id: docId
    });
    
    await document.save();
    
    // Clean temp files
    fs.unlink(file.path, (err) => {
      if (err) console.error('Erreur suppression fichier temporaire:', err);
    });
    
    res.json({
      success: true,
      message: 'Document téléversé avec succès',
      filename: file.originalname,
      size: file.size,
      document_id: docId
    });
    
  } catch (error) {
    //next(error);

    return res.status(500).json({ error: error.message, status: 'erreur' });  
  }
});

// List documents
router.get('/list', authenticateToken, async (req, res, next) => {
  try {
    const username = req.user.sub;
    
    const documents = await Document.find(
      { uploaded_by: username },
      { _id: 0, filename: 1, uploaded_at: 1, file_size: 1, content_type: 1 }
    ).sort({ uploaded_at: -1 });
    
    res.json({
      success: true,
      documents: documents.map(doc => ({
        ...doc.toObject(),
        uploaded_at: doc.uploaded_at.toISOString(),
        size_kb: Math.round((doc.file_size / 1024) * 100) / 100
      })),
      count: documents.length
    });
    
  } catch (error) {
    //next(error)
    return res.status(500).json({ error: error.message, status: 'erreur' });
  }
});


export default router;