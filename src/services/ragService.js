
import { ChatOllama, Ollama } from "@langchain/ollama"

import vectorStroreManager from './vectoreStore.js';

class RAGAgent {
    constructor() {
        this.vectorStore = vectorStroreManager;
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL?? "llama3.2:1b";
        this.temperature = 0;

        /*
        this.llm =  new ChatOllama({
            model: process.env.OLLAMA_MODEL || 'deepseek-r1:8b',
            temperature: 0,
            maxRetries: 2,
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
        });
        */

        this.llm =  new Ollama({
            model: this.model,
            temperature: this.temperature,
            baseUrl: this.ollamaBaseUrl
        });
        
        // Prompt template
        this.promptTemplate = ({ context, question }) => `
Vous êtes un assistant utile qui répond aux questions basées sur le contexte fourni.

Contexte:
${context}

Question: ${question}

Répondez en français de manière claire et concise. Si vous ne trouvez pas la réponse dans le contexte, dites-le honnêtement.

Réponse:
        `.trim();
        
        // Mémoire de conversation (simplifiée)
        this.memory = new ConversationBufferMemory();
        
        // Workflow graph
        this.workflow = this._buildWorkflow();
    }
    
    _buildWorkflow() {
        // Implémentation d'un workflow simple sans LangGraph
        return {
            async execute(initialState) {
                let state = { ...initialState };
                
                // Étape 1: Récupération des documents
                state = await this._retrieveDocuments(state);
                
                // Étape 2: Génération de la réponse
                state = await this._generateResponse(state);
                
                // Étape 3: Formatage de la réponse
                state = await this._formatResponse(state);
                
                return state;
            }
        };
    }
    
    async _retrieveDocuments(state) {
        try {
            console.log(`Récupération de documents pour: "${state.query.substring(0, 50)}..."`);
            const documents = await this.vectorStore.similaritySearch(state.query, 4);
            return { ...state, documents };
        } catch (error) {
            console.error('Erreur récupération documents:', error);
            return { ...state, documents: [] };
        }
    }
    
    async _generateResponse(state) {
        try {
            const { documents, query } = state;
            
            // Combiner les documents en contexte
            const context = documents
                .map(doc => doc.pageContent || '')
                .join('\n\n');
            
            console.log(`Génération de réponse avec ${documents.length} documents...`);
            
            // Appeler Ollama
            const response = await this._callOllama({
                context,
                question: query
            });
            
            return { ...state, response, rawDocuments: documents };
        } catch (error) {
            console.error('Erreur génération réponse:', error);
            return { 
                ...state, 
                response: "Désolé, je n'ai pas pu générer une réponse."
            };
        }
    }
    
    async _callOllama({ context, question }) {
        const prompt = this.promptTemplate({ context, question });
        
        try {
            /*
            const aiMsg = await this.llm.invoke([
                [
                    "system",
                    "Vous êtes un assistant utile qui répond aux questions basées sur le contexte fourni.",
                ],
                ["human", prompt],
            ])
            */
            
            return  await this.llm.invoke(prompt);
        } catch (error) {
            console.error('Erreur appel Ollama:', error.message);
            
            // Fallback: réponse simple
            return `Je suis votre assistant RAG. J'ai analysé les documents et je peux vous dire que la réponse se trouve dans le contexte fourni. Pour une réponse plus précise, assurez-vous que le service Ollama est démarré.`;
        }
    }
    
    _formatResponse(state) {
        const { response, rawDocuments = [] } = state;
        
        // Formater les sources
        const sources = rawDocuments.map(doc => ({
            content: (doc.pageContent ||  '').substring(0, 200) + 
                    ((doc.pageContent || '').length > 200 ? '...' : ''),
            metadata: doc.metadata || {}
        }));
        
        return {
            ...state,
            answer: response,
            sources,
            formatted: true
        };
    }
    
    async query(query, userContext = null) {
        try {
            console.log(`\n Requête RAG: "${query.substring(0, 100)}..."`);
            
            // État initial
            const initialState = {
                query,
                documents: [],
                response: '',
                sources: [],
                userContext: userContext || {}
            };
            
            // Exécuter le workflow
            const result = await this.workflow.execute.call(this, initialState);
            
            // Construire la réponse finale
            const response = {
                success: true,
                query,
                answer: result.answer || result.response || '',
                sources: result.sources || [],
                timestamp: new Date().toISOString()
            };
            
            // Ajouter le contexte utilisateur si fourni
            if (userContext) {
                response.user = userContext.sub || 'anonymous';
            }
            
            console.log(`Réponse générée (${response.answer.length} caractères)`);
            return response;
            
        } catch (error) {
            console.error('Erreur dans la requête RAG:', error);
            
            return {
                success: false,
                query,
                answer: `Désolé, une erreur s'est produite: ${error.message}`,
                sources: [],
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Mémoire de conversation simplifiée
class ConversationBufferMemory {
    constructor() {
        this.memory = [];
        this.maxSize = 10; // Garder les 10 derniers échanges
    }
    
    addMessage(role, content) {
        this.memory.push({ role, content, timestamp: new Date() });
        
        // Garder seulement les derniers messages
        if (this.memory.length > this.maxSize) {
            this.memory = this.memory.slice(-this.maxSize);
        }
    }
    
    getHistory() {
        return this.memory;
    }
    
    clear() {
        this.memory = [];
    }
}

export default new RAGAgent();