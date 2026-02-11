# Un Agent RAG local

## Fonctionnalites

- Pour l'ajout de document dans la base de données, 
- une interface utilisateur permet de se connecter et téléverser un fichier pdf ou doc, docx. 

Ajouter un document dans la base de données:
- L'utilisateur accede à la page de connexion
- L'utilisateur renseigne son nom utilisateur et mot de passe
- L'utilisateur accede à la page d'ajout de document
- L'utilisateur clique sur le bouton d'ajout de document et selection un fichier pdf ou docx et clique sur envoyer 

Outils et technlogies

Framework: LangChain et Langraph
Base de données vectorielles: Mongodb
LLM provider: Ollama 

Architecture:
Frontend (HTML/JS) ↔ Backend (FastAPI) ↔ Agent RAG (LangChain/LangGraph) ↔ MongoDB Vector Store ↔ Ollama

## RUN
- cloner ce repo puis executer les commandes suivantes
```bash
  npm install
  node Server
```
