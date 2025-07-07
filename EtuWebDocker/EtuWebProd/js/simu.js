// Simulation data (in memory only)
let simulationData = null;
let originalData = null;
let dataue = null;
const semestre = 'S4.json';

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSimulationData();
    
    // Ajouter l'événement pour le bouton reset
    document.getElementById('reset-btn').addEventListener('click', function() {
        resetSimulation();
    });
});

// Reset simulation to original data
function resetSimulation() {
    if (originalData) {
        simulationData = JSON.parse(JSON.stringify(originalData));
        renderSubjects();
        updateAverageDisplay();
        updateUEAverages(); // Mettre à jour les moyennes UE
    }
}

// Load simulation data
async function loadSimulationData() {
    try {
        const response = await fetch(`../notes/${semestre}`);

        if (!response.ok) {
            throw new Error('Erreur de chargement');
        }

        const data = await response.json();
        originalData = JSON.parse(JSON.stringify(data));
        simulationData = JSON.parse(JSON.stringify(data));

        // Charger les données UE
        await loadUeData();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('simulation-controls').classList.remove('hidden');
        document.getElementById('average-display').classList.remove('hidden');
        document.getElementById('subjects-container').classList.remove('hidden');

        renderSubjects();
        updateAverageDisplay();
        updateUEAverages(); // Calculer et afficher les moyennes UE

    } catch (error) {
        console.error('Erreur lors du chargement des notes :', error);
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
    }
}

async function loadUeData() {
    try {
        const response = await fetch(`../json/coeffUE${semestre}`);

        if (!response.ok) {
            throw new Error('Erreur de chargement des coefficients UE');
        }

        const data = await response.json();
        console.log('UE coefficients loaded:', data);
        dataue = JSON.parse(JSON.stringify(data));

    } catch (error) {
        console.error('Erreur lors du chargement des coefficients UE :', error);
        // Continuer même si les coefficients UE ne se chargent pas
        dataue = [];
    }
}

// Fonction pour calculer et afficher les moyennes UE
function updateUEAverages() {
    if (!dataue || !simulationData) {
        console.log('Données UE ou simulation manquantes');
        return;
    }

    const ueMoyennesContainer = document.getElementById("ue-moyennes");
    ueMoyennesContainer.innerHTML = '';

    // Calculer les moyennes par matière
    const prevision = [];
    simulationData.grades.forEach(subject => {
        const moyenne = parseFloat(calculateSubjectAverage(subject));
        prevision.push({
            Name: subject.name,
            Moyenne: isNaN(moyenne) ? NaN : moyenne
        });
    });

    console.log('Prévisions calculées:', prevision);

    // Associer les coefficients UE aux matières
    for (let m = 0; m < dataue.length; m++) {
        const matiere = dataue[m];
        const nom = matiere.nomRess;
        const coeffsUE = {};
        
        for (let key in matiere) {
            if (key.startsWith("Coeff UE")) {
                coeffsUE[key] = matiere[key];
            }
        }

        // Trouver la matière correspondante dans prevision
        const match = prevision.find(item => item.Name === nom);
        if (match) {
            match.CoeffsUE = coeffsUE;
        } else {
            console.log(`Matière non trouvée dans prevision: ${nom}`);
        }
    }

    // Calculer les moyennes UE
    const ueData = {};

    prevision.forEach(item => {
        const nom = item.Name;
        const moyenne = item.Moyenne;
        const coeffs = item.CoeffsUE;

        if (coeffs && !isNaN(moyenne)) {
            for (let ue in coeffs) {
                const coeff = parseFloat(coeffs[ue]);
                if (!isNaN(coeff) && coeff > 0) {
                    if (!ueData[ue]) {
                        ueData[ue] = { total: 0, poids: 0 };
                    }
                    ueData[ue].total += moyenne * coeff;
                    ueData[ue].poids += coeff;
                }
            }
        }
    });

    console.log('Données UE calculées:', ueData);

    // Afficher les moyennes UE dans l'ordre UE1, UE2, UE3, etc.
    const ueKeys = Object.keys(ueData).sort((a, b) => {
        // Extraire le numéro de l'UE (ex: "Coeff UE1" -> 1, "Coeff UE2" -> 2)
        const getUENumber = (ueKey) => {
            const match = ueKey.match(/UE(\d+)/);
            return match ? parseInt(match[1]) : 999; // 999 pour les UE sans numéro (à la fin)
        };
        
        return getUENumber(a) - getUENumber(b);
    });

    ueKeys.forEach(ue => {
        const { total, poids } = ueData[ue];
        const moyenneUE = poids > 0 ? (total / poids) : NaN;

        const ueLabel = ue.replace("Coeff", "Moyenne");
        const bgColorClass = (!isNaN(moyenneUE) && moyenneUE < 10) ? 
            "bg-red-100 border-red-400 text-red-800" : 
            "bg-indigo-100 border-indigo-300 text-indigo-800";

        const div = document.createElement("div");
        div.className = `${bgColorClass} rounded-lg shadow-md p-4 border text-center min-w-[120px]`;

        div.innerHTML = `
            <h2 class="text-sm font-semibold mb-1">${ueLabel}</h2>
            <p class="text-lg font-bold">${isNaN(moyenneUE) ? "N/A" : moyenneUE.toFixed(2)}</p>
        `;

        ueMoyennesContainer.appendChild(div);
    });
}

// Render subjects
function renderSubjects() {
    const container = document.getElementById('subjects-container');
    container.innerHTML = '';

    simulationData.grades.forEach((subject, subjectIndex) => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'bg-white rounded-lg shadow-md p-6';

        const subjectAverage = calculateSubjectAverage(subject);

        subjectDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${subject.name}</h3>
                    <p class="text-gray-600">${subject.teacher}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-blue-600">${subjectAverage}</p>
                    <p class="text-sm text-gray-500">Moyenne</p>
                </div>
            </div>

            <div class="space-y-3">
                ${subject.grades.map((grade, gradeIndex) => `
                    <div class="bg-gray-50 rounded p-4">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium text-gray-800">${grade[0]}</h4>
                            <button onclick="addGradeToSession(${subjectIndex}, ${gradeIndex})" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                ${grade[1].length >= 2 ? 'Modifier note' : 'Ajouter note'}
                            </button>
                        </div>
                        <div class="flex flex-wrap gap-4">
                            ${(() => {
                                const gradePairs = [];
                                const values = grade[1];
                                for (let i = 0; i < values.length; i += 2) {
                                    const note = values[i];
                                    const coeff = values[i + 1];
                                    const isNew = i >= (originalData.grades[subjectIndex]?.grades[gradeIndex]?.[1]?.length || 0);
                                    gradePairs.push(`
                                        <div class="flex flex-col items-center">
                                            <span class="inline-block bg-white px-3 py-1 rounded border ${isNew ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200'}">${note}</span>
                                            <span class="text-xs text-gray-500">Coeff: ${coeff}</span>
                                        </div>
                                    `);
                                }
                                return gradePairs.join('');
                            })()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.appendChild(subjectDiv);
    });
}

// Calculate subject average
function calculateSubjectAverage(subject) {
    let totalPoints = 0;
    let totalCoeff = 0;

    subject.grades.forEach(gradeSession => {
        const grades = gradeSession[1];
        for (let i = 0; i < grades.length; i += 2) {
            const grade = parseFloat(grades[i]);
            const coeff = parseFloat(grades[i + 1]);

            if (!isNaN(grade) && !isNaN(coeff)) {
                totalPoints += grade * coeff;
                totalCoeff += coeff;
            }
        }
    });

    return totalCoeff > 0 ? (totalPoints / totalCoeff).toFixed(2) : 'N/A';
}

// Update average display
function updateAverageDisplay() {
    const average = calculateOverallAverage();
    
    // Calculer les changements par rapport aux données originales
    const originalAvg = parseFloat(originalData.average || '0');
    const newAvg = parseFloat(average || '0');
    const avgDifference = newAvg - originalAvg;
    
    // Estimation plus réaliste de la position
    const originalPosition = parseInt(originalData.position.split('/')[0]);
    const totalStudents = parseInt(originalData.position.split('/')[1]);
    
    let estimatedPosition;
    if (avgDifference > 0) {
        // Moyenne améliorée = position potentiellement meilleure
        // Estimation : chaque point de moyenne = ~5% d'amélioration de position
        const improvementRate = Math.min(avgDifference * 0.05, 0.3); // Max 30% d'amélioration
        const positionsGained = Math.floor(originalPosition * improvementRate);
        estimatedPosition = Math.max(1, originalPosition - positionsGained);
    } else if (avgDifference < 0) {
        // Moyenne dégradée = position potentiellement moins bonne
        const degradationRate = Math.min(Math.abs(avgDifference) * 0.05, 0.3); // Max 30% de dégradation
        const positionsLost = Math.floor(originalPosition * degradationRate);
        estimatedPosition = Math.min(totalStudents, originalPosition + positionsLost);
    } else {
        // Pas de changement
        estimatedPosition = originalPosition;
    }

    console.log(`Moyenne: ${average} (était ${originalAvg}, ${avgDifference >= 0 ? '+' : ''}${avgDifference.toFixed(2)})`);
    console.log(`Position estimée: ${estimatedPosition}/${totalStudents} (était ${originalPosition}/${totalStudents})`);
    
    // Optionnel : afficher dans l'interface
    displayPositionInfo(average, estimatedPosition, totalStudents, avgDifference);
}

// Fonction pour afficher les informations de position (optionnelle)
function displayPositionInfo(average, position, total, difference) {
    // Vous pouvez décommenter et adapter selon votre interface
    /*
    const positionElement = document.getElementById('position-display');
    if (positionElement) {
        const changeText = difference > 0.1 ? ' 📈' : difference < -0.1 ? ' 📉' : ' ➡️';
        positionElement.innerHTML = `
            <p class="text-lg font-bold">Moyenne: ${average}${changeText}</p>
            <p class="text-sm">Position estimée: ${position}/${total}</p>
        `;
    }
    */
}

// Calculer la moyenne globale
function calculateOverallAverage() {
    let totalPoints = 0;
    let totalCoeff = 0;

    simulationData.grades.forEach(subject => {
        subject.grades.forEach(gradeSession => {
            const grades = gradeSession[1];
            for (let i = 0; i < grades.length; i += 2) {
                const grade = parseFloat(grades[i]);
                const coeff = parseFloat(grades[i + 1]);

                if (!isNaN(grade) && !isNaN(coeff)) {
                    totalPoints += grade * coeff;
                    totalCoeff += coeff;
                }
            }
        });
    });

    return totalCoeff > 0 ? (totalPoints / totalCoeff).toFixed(2) : 'N/A';
}

// Ajouter ou modifier une note pour une session
function addGradeToSession(subjectIndex, gradeIndex) {
    const grade = prompt('Entrez la note (0-20):');
    const coefficient = prompt('Entrez le coefficient (ex: 1, 0.5, 2):');

    if (grade !== null && coefficient !== null) {
        const gradeValue = parseFloat(grade.replace(',', '.'));
        const coeffValue = parseFloat(coefficient.replace(',', '.'));

        if (!isNaN(gradeValue) && !isNaN(coeffValue) && gradeValue >= 0 && gradeValue <= 20 && coeffValue > 0) {
            const session = simulationData.grades[subjectIndex].grades[gradeIndex];
            session[1] = [gradeValue, coeffValue];
            
            // Recalculer la moyenne de la matière
            simulationData.grades[subjectIndex].average = calculateSubjectAverage(simulationData.grades[subjectIndex]);

            // Mettre à jour l'affichage
            renderSubjects();
            updateAverageDisplay();
            updateUEAverages(); // Mettre à jour les moyennes UE

        } else {
            alert('Veuillez entrer des valeurs valides (note: 0-20, coefficient > 0)');
        }
    }
}