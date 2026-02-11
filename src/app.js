import express from 'express';
import  cors from 'cors';

import connectDB from "./config/database.js";

//import * as fs from 'node:fs/promises';
import * as fs from 'node:fs';

const vectorStrore = process.env.VECTOR_INDEX_STORE_PATH || "vector_data" ;
const temp_dir = "temp_uploads"
  
try {
  if(!fs.existsSync(vectorStrore)){
    fs.mkdirSync(vectorStrore, {recursive: true});
  }

  if(!fs.existsSync(temp_dir)){
    fs.mkdirSync(temp_dir, {recursive: true});
  }
} catch (error) {
  process.exit(-1);
}

await connectDB();

// Import des routes
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import queryRoutes from './routes/query.js';

// Initialisation de l'app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:8001', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/query', queryRoutes);

// Route health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RAG Assistant API - Node.js',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'RAG Assistant API - Node.js',
    endpoints: {
      docs: '/api/docs',
      health: '/api/health',
      register: '/api/register [POST]',
      login: '/api/login [POST]',
      upload: '/api/documents/upload [POST]',
      query: '/api/query [POST]',
      documents: '/api/documents [GET]'
    }
  });
});

// Error manager
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

export default app;