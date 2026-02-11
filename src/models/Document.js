import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  uploaded_by: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  content_type: {
    type: String
  },
  uploaded_at: {
    type: Date,
    default: Date.now
  },
  doc_id: {
    type: String,
    required: true
  }
});

const Doc = mongoose.model('Document', DocumentSchema);

export default Doc;