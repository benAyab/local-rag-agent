import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { FaissStore } from "@langchain/community/vectorstores/faiss";
import  * as fs from 'node:fs';

import path from "node:path";


//import  { Document } from "@langchain/core/documents";
const vectorStrorePath = process.env.VECTOR_INDEX_STORE_PATH || "vector_data";

class VectorStoreManager {
    constructor() {
        this.text_splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        this.embedding = new OllamaEmbeddings({
            model: process.env.EMBEDDING_MODEL || "nomic-embed-text-v2-moe:latest",
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            dimensions: 768
        });

        this.loadDirectory =  path.join(path.resolve(vectorStrorePath));
        
        //this.vectorStore = new FaissStore(this.embeddings, {});
        this.vectorStore =  null;
        this.initVect();
    }

    initVect(){
        (async() =>{
            await this.loadVector();
        })()
    }

    async loadVector(){
        try {
            if(!fs.existsSync(this.loadDirectory)){
                this.vectorStore = new FaissStore(this.embedding, {});
                return;
            }

            const indxVector = path.join(path.resolve(vectorStrorePath, "faiss.index"));

            const fd        = fs.openSync(indxVector, 'r');
            const stats     = fs.fstatSync(fd);

            if(stats.isFile() && (stats.size > 0)){
                this.vectorStore =  await FaissStore.load(this.loadDirectory, this.embedding);
                fs.closeSync(fd);
                return;
            }

            fs.closeSync(fd);

            this.vectorStore =  new FaissStore(this.embedding, {});
        } catch (error) {
            console.log("Error while loading: ", error);
        }
    }
    
    async similaritySearch(query, k = 4) {
        
        console.log(`Recherche vectorielle pour: "${query.substring(0, 50)}..."`);
            
        try {
            if(this.vectorStore){
                const results = await this.vectorStore.similaritySearch(query, k);

                /*
                    const embed = await this._generateEmbedding(query)
                    const results = await this.vectorStore.similaritySearch(embed, k);
                */
                
                // console.log(results[0]);
                /**
                 * Document {
                 *   pageContent: 'direct...',
                 *   metadata: {'page': 4, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 3125}
                 * }
                 */

                return results;
            }

            return [];
        } catch (error) {
            console.log('echec recherche vectorielle: ', error);
    
            return [];
        }
    }

    async similaritySearchWithScore(query, k = 4) {
        
        console.log(`Recherche vectorielle pour: "${query.substring(0, 50)}..."`);
            
        try {
            if(this.vectorStore){
                const results = await this.vectorStore.similaritySearchWithScore(query, k);
            
                // console.log(results[0]);
                // const embed = await this._generateEmbedding(query)
                // const results = await this.vectorStore.similaritySearchWithScore(embed, k);

                /**
                 * Document {
                 *  pageContent: 'direct...',
                 *   metadata: {'page': 4, 'source': '../example_data/nke-10k-2023.pdf', 'start_index': 3125}
                 *   }
                */

                return results;
            }

            return [];

        } catch (error) {
            
            console.log('echec recherche vectorielle: ', error);
            
            return [];
        }
    }
    
    async _generateEmbedding(text) {
        try {
            // generate query embedding
            // const vector1 = await this.embedding.embedQuery(allSplits[0].pageContent)
            return await this.embedding.embedQuery(text);
            
        } catch (error) {
            console.error('Erreur génération embedding:', error.message);
            
            // Fallback: embedding simulé
            const dimensions = 768;
            return (new Array(dimensions)).fill(0).map(() => Math.random() * 2 - 1);
        }
    }

    async _saveVector(){
        // Check if directory exists, create if not
        try {
            if(!fs.existsSync(this.loadDirectory)){
                fs.mkdirSync(this.loadDirectory);
            }

            if(this.vectorStore){
                // Save the index to the specified directory
                await this.vectorStore.save(this.loadDirectory);
                console.log("FAISS index saved locally to: ", this.loadDirectory);
            }
        } catch (e) {
           console.log("Error occured while saving vector: ", e);
           throw e;
        }
    }

    async spliteAndAddDocuments(docs, ids = []){
        try {
            const docIds = (ids && Array.isArray(ids) && (ids.length > 0))? {ids } : {}

           const documents = await this.text_splitter.splitDocuments(docs);

           await this.addDocuments(documents, docIds);
        } catch (error) {
            console.error('Erreur addDocuments:', error);
            throw error;
        }
    }
    
    async addDocuments(documents, ids = []) {
        try {
            /*
                new Document({
                    pageContent:
                    "Dogs are great companions, known for their loyalty and friendliness.",
                    metadata: { source: "mammal-pets-doc" },
                })
            */
           const docIds = (ids && Array.isArray(ids) && (ids.length > 0))? { ids: ids } : {}

           //const docs = [];
            
            if (documents.length > 0) {
                await this.vectorStore.addDocuments(documents, docIds);
                
                console.log(`${documents.length} documents ajoutés à la base de données vectorielles`);

                await this._saveVector();
            }
            
        } catch (error) {
            console.error('Erreur addDocuments:', error);
            throw error;
        }
    }
}


export default new VectorStoreManager();