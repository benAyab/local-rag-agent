import multer from 'multer';
import  path from 'node:path';


// Create temp dir for temps files storage
const uploadDir = path.resolve("temp_uploads")

// Storage Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter file  types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.txt', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file types, only: PDF, DOCX, DOC, TXT are supported'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

export default upload;