const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const uploadBtn = document.getElementById('uploadBtn');
const result = document.getElementById('result');
const filesList = document.getElementById('filesList');

let selectedFile = null;

// Style pour les éléments de fichier
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .file-item {
            background: #f8fafc;
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 0.5rem;
            border-left: 4px solid #3a87ad;
            transition: all 0.3s ease;
        }
        .file-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .result {
            display: none;
        }
        .result.show {
            display: block;
        }
        .file-info.show {
            display: block;
        }
        .upload-btn.show {
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelection(files[0]);
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
});

function handleFileSelection(file) {
    if (file.type !== 'application/pdf') {
        showResult('Erreur: Seuls les fichiers PDF sont acceptés', 'error');
        return;
    }
    
    selectedFile = file;
    fileInfo.innerHTML = `
        <strong>Fichier sélectionné:</strong><br>
        📄 ${file.name}<br>
        📏 Taille: ${(file.size / 1024 / 1024).toFixed(2)} MB
    `;
    fileInfo.style.display = 'inline-block';
    uploadBtn.style.display = 'inline-block';
    result.style.display = 'none';
}

async function uploadFile() {
    if (!selectedFile) {
        showResult('Aucun fichier sélectionné', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    fileInfo.style.display = 'hidden';
    
    try {
        uploadBtn.textContent = '⏳ Upload en cours...';
        uploadBtn.disabled = true;
        
        const response = await fetch('/api/upload-pdf', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult(`✅ ${data.message}<br>Fichier: ${data.file.originalName}`, 'success');
            resetForm();
            loadFiles(); // Actualiser la liste
        } else {
            showResult(`❌ Erreur: ${data.error}`, 'error');
        }
        
    } catch (error) {
        showResult(`❌ Erreur de connexion: ${error.message}`, 'error');
    } finally {
        uploadBtn.textContent = '📤 Envoyer le PDF';
        uploadBtn.disabled = false;
    }
}

async function loadFiles() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        
        if (data.success) {
            if (data.files.length === 0) {
                filesList.innerHTML = '<p>Aucun fichier uploadé</p>';
            } else {
                filesList.innerHTML = data.files.map(file => `
                    <div class="file-item">
                        <strong>${file.filename}</strong><br>
                        <small>Taille: ${(file.size / 1024 / 1024).toFixed(2)} MB | 
                        Uploadé le: ${new Date(file.uploadDate).toLocaleString('fr-FR')}</small>
                        <button class="upload-btn text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transform transition-all duration-300" onclick="processPdf('${file.filename}')">📥 Traiter le PDF</button>
                    </div>
                `).join('');
            }
        } else {
            filesList.innerHTML = `<p style="color: red;">Erreur: ${data.error}</p>`;
        }
    } catch (error) {
        filesList.innerHTML = `<p style="color: red;">Erreur de connexion: ${error.message}</p>`;
    }
}

async function processPdf(filename) {
    // Envoie la requête au serveur API
    const response = await fetch('http://localhost:3000/process-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
    });
    
    const data = await response.json();
    
    // Affiche seulement le résultat dans l'interface
    // showResult(`✅ PDF traité avec succès. Résultat : <pre>${JSON.stringify(data.data, null, 2)}</pre>`, 'success');
    showResult(`✅ PDF traité avec succès. Résultat : <pre>OK</pre>`, 'success');
    
    // Ne sauvegarde pas le fichier localement
}

function showResult(message, type) {
    result.innerHTML = message;
    result.className = `result ${type} px-6 py-2 rounded-lg`;
    result.style.display = 'block';
}

function resetForm() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.innerHTML = '';
    fileInfo.style.display = 'none';
    uploadBtn.style.display = 'none';
}

// Charger les fichiers au démarrage
loadFiles();