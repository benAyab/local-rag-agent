import { v4 as uuidv4 } from 'uuid';
import  fs from 'node:fs';
import path from 'node:path';

import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
//import  { Document } from "@langchain/core/documents";

import vectorStroreManager from './vectoreStore.js';


class DocumentService {
    constructor() {
        this.vectorStoreManager =  vectorStroreManager;
        this.initialized = false;
    }
    
    async init() {
        if (!this.initialized) {
            this.initialized = true;
        }
        return this;
    }
    
    async processDocument(filePath, filename) {
        console.log(`Traitement du document: ${filename}`);
        
        try {
            // Vérifier l'existence du fichier
            fs.accessSync(filePath, fs.constants.F_OK);
            
            // Lire le fichier selon son type
            const fileExt = path.extname(filename).toLowerCase();
            let docs = '';
            
            if (fileExt === '.pdf') {
                docs = await this.processPDF(filePath);
            } else if (fileExt === '.docx') {
                docs = await this.processDOCX(filePath);
            } else if (fileExt === '.txt' || fileExt === '.md') {
                docs = await this.processText(filePath);
            } else {
                throw new Error(`Format non supporté: ${fileExt}`);
            }
            
            if (!docs || !docs.length || (docs.length === 0)) {
                throw new Error('Le document est vide');
            }
            
            const docId = uuidv4();
            
            // Divide docs 
            const documents = await this.vectorStoreManager.text_splitter.splitDocuments(docs) || [];

            console.log(`Total documents chunkés: ${documents.length}`);

            const chunkIds = documents.map((doc, index) => uuidv4());

            const refactoredDocs = documents.map((doc, index) => (
                {
                    pageContent: doc.pageContent, 
                    metadata: {
                    ...doc.metadata,
                        doc_id: docId,
                        filename: filename,
                        file_type: fileExt,
                        chunk_index: index,
                        total_chunks: documents.length
                    }
                }
            ));

            //console.log(Array.isArray(refactoredDocs) && refactoredDocs.length > 0 ? refactoredDocs[0]: "");

            // Ajouter au vector store
            await this.vectorStoreManager.addDocuments(refactoredDocs, chunkIds);

            console.log(`Document traité avec ID: ${docId || "0000-0000"}`);
            
            return docId;
        } catch (error) {
            console.error(`Erreur traitement document ${filename}:`, error);
            throw error;
        }
    }
    
    async processPDF(filePath) {
        try {
            const loader = new PDFLoader(filePath)
            const docs = await loader.load();

            return docs;

        } catch (error) {
            console.error('Erreur lecture PDF:', error);
            throw new Error(`Impossible de lire le PDF: ${error.message}`);
        }
    }
    
    async processDOCX(filePath) {
        // Implémentation DOCX avec mammoth
        try {
            /*
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
            */

            const loader = new DocxLoader(filePath);

            const docs = await loader.load();
            return docs;
        } catch (error) {
            console.error('Erreur lecture DOCX:', error);
            throw new Error(`Impossible de lire le DOCX: ${error.message}`);
        }
    }

    async processDOC(filePath) {
        // Implémentation DOC
        try {
            /*
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
            */

            const loader = new DocxLoader(
                filePath,
                {
                    type: "doc",
                }
            );

            const docs = await loader.load();

            return docs;
        } catch (error) {
            console.error('Erreur lecture DOCX:', error);
            throw new Error(`Impossible de lire le DOCX: ${error.message}`);
        }
    }
    
     processText(filePath) {
        try {
            const content  = fs.readFileSync(filePath, 'utf-8');

            return [
                {
                    pageContent: content, 
                    metadata: { source: path.basename(filePath) }
                }
            ]
        } catch (error) {
            console.error('Erreur lecture texte:', error);
            throw new Error(`Impossible de lire le fichier texte: ${error.message}`);
        }
    }
    
    async similaritySearch(query, k = 4) {
        return await this.vectorStoreManager.similaritySearch(query, k);
    }
    
    async deleteDocument(filterDict) {
        return await this.vectorStoreManager.deleteDocuments(filterDict);
    }
    
    async getStats() {
        try {
            
        } catch (error) {
            return { error: error.message, status: 'erreur' };
        }
    }
}

export default new DocumentService();