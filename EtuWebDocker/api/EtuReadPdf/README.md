# 📄 EtuReadPdf

[![Python Version](https://img.shields.io/badge/python-3.7%2B-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

EtuReadPdf est un outil Python permettant d'extraire et de traiter les informations des relevés de notes au format PDF de l'Université de Nice. Il vous permet de générer un *JSON* ou un *CSV* qui facilite le suivi de vos résultats.

## 📋 Fonctionnalités

- **Extraction des métadonnées** d'un fichier PDF
- **Nettoyage et lecture** du contenu textuel des PDF
- **Extraction structurée** des informations sur les ECUE et UE
- **Exportation des données** dans un format JSON facilement exploitable
- **Interface simple** en ligne de commande

## 🚀 Installation

### Prérequis

- Python 3.7 ou supérieur
- pip (gestionnaire de paquets Python)

### Installation via Git

```bash
# Cloner le dépôt
git clone https://github.com/votre-utilisateur/EtuReadPdf.git


# Installer les dépendances
pip install -r requirements.txt
```

## 📦 Dépendances

Le projet utilise les bibliothèques Python suivantes :

- `PyPDF2`: Pour la lecture et l'extraction des données des fichiers PDF
- `json`: Pour l'exportation des données au format JSON (module standard)
- `re`: Pour le traitement des expressions régulières (module standard)

## 🔧 Utilisation

### En ligne de commande

```bash
#Ce déplacer dans le répertoire
cd EtuReadPdf

#Générer le json
python3 main.py chemin/vers/votre/releve.pdf --format json --output output.json

#Générer le csv
python3 main.py chemin/vers/votre/releve.pdf --format csv --output output.csv
```

## 📊 Structure des données exportées

Le fichier JSON généré suit la structure suivante :

```json
[
    {
        "name": " TBRAE301 : SAÉ 3.01",
        "notes": [
            {
                "note": 15.0,
                "coeff": 0.6
            },
            {
                "note": 18.0,
                "coeff": 0.8
            },
            {
                "note": 16.561,
                "coeff": 0.5
            },
            {
                "note": 13.892,
                "coeff": 0.5
            }
        ],
        "moyennepdf": 16.113
    },
    {
        "name": " TBRAE302 : SAÉ 3.02",
        "notes": [
            {
                "note": 7.5,
                "coeff": 0.5
            },
            {
                "note": 7.5,
                "coeff": 0.5
            },
            {
                "note": 8.0,
                "coeff": 3.0
            }
        ],
        "moyennepdf": 7.875
    },
    {
        "name": " TBRAE303 : SAÉ 3.03",
        "notes": [
            {
                "note": 17.5,
                "coeff": 0.5
            }
        ],
        "moyennepdf": 17.5
    },
    {
        "name": " TBRAE304 : SAÉ 3.04",
        "notes": [
            {
                "note": 14.0,
                "coeff": 1.0
            },
            {
                "note": 8.0,
                "coeff": 1.0
            }
        ],
        "moyennepdf": 11.0
    }
]
```

## 🪪 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.