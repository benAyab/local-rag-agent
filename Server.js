import app from "./src/app.js"
import http from  'node:http'
import dotenv from 'dotenv';

dotenv.config({path: "./.env", debug: true});

const PORT = process.env.PORT;

const Server = http.createServer(app);

// Server start
Server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('      RAG Assistant API - Node.js');
  console.log('='.repeat(60));
  console.log(`   - Serveur démarré sur: http://localhost:${PORT}`);
  // console.log(`   - Endpoints disponibles:`);
  // console.log(`   - POST  /api/register`);
  // console.log(`   - POST  /api/login`);
  // console.log(`   - POST  /api/documents/upload`);
  // console.log(`   - POST  /api/query`);
  // console.log(`   - GET   /api/documents`);
  // console.log(`   - GET   /api/health`);
  console.log('='.repeat(60) + '\n');
});