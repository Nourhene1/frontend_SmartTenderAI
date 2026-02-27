# Frontend - Plateforme de Recrutement Intelligent

Frontend de la plateforme de recrutement permettant :
- Consultation des offres d’emploi (public)
- Postuler à une offre (upload CV)
- Affichage des candidatures (recruteur)
- Visualisation des informations extraites depuis le CV
- Recherche + Pagination + UI moderne

---

## 🧰 Stack technique

- **Next.js (React)**
- **Tailwind CSS**
- **Axios** (API calls)
- **Lucide-react** (icônes)


## ⚙️ Installation

### 1) Cloner le projet
git clone https://github.com/joulek/PFE_Frontend.git
cd frontend


### 2) Installer les dépendances
npm install


### 3) 🔐 Configuration (.env.local)
Créer un fichier .env.local à la racine du frontend :
NEXT_PUBLIC_API_URL=http://localhost:5000
Le frontend utilise cette variable pour communiquer avec le backend.

### 4) ▶️ Lancer le projet
Mode développement : npm run dev
Le frontend sera accessible sur : http://localhost:3000
Mode production : npm run build
                  npm start


### ✨ Fonctionnalités principales
### 1) 👤 Côté candidat
- Voir la liste des offres disponibles
- Postuler à une offre via upload CV
- Envoi automatique vers le backend + extraction

### 2)🧑‍💼 Côté recruteur
- Voir la liste des candidatures reçues
- Consulter son dasboard 
- Page pour la gestion des offres d'emploi
- Interface de connexion

