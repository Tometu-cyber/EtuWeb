fetch('notes/SExemple.json')
    .then(response => response.json())
    .then(data => {
        var prevision = [];
        for (let matiere = 0; matiere < data.grades.length; matiere++) {
            let numerateur = 0;
            let denominateur = 0;
            let name = data.grades[matiere].name;
            let tmp = {};
            if (name.split(" ")[1] != "UE") {
                for (let i = 0; i < data.grades[matiere].grades.length; i++) {
                    let notes = data.grades[matiere].grades[i][1];
                    if (notes.length == 2) {
                        let note = parseFloat(notes[0]);
                        let coeff = parseFloat(notes[1]);
                        numerateur += note * coeff;
                        denominateur += coeff;
                    }
                }
                tmp["Name"] = name;
                tmp["Moyenne"] = denominateur > 0 ? numerateur / denominateur : NaN;
                prevision.push(tmp);
            }
        }

        console.log(prevision);
        fetch('coeffUESExemple.json')
            .then(response => response.json())
            .then(coeffUE => {
                for (let m = 0; m < coeffUE.length; m++) {
                    const matiere = coeffUE[m];
                    const nom = matiere.nomRess;
                    const coeffsUE = {};
                    
                    for (let key in matiere) {
                        if (key.startsWith("Coeff UE")) {
                            coeffsUE[key] = matiere[key];
                        }
                    }
                    for (let i = 0; i < prevision.length; i++) {
                        if (prevision[i].Name === nom) {
                            prevision[i]["CoeffsUE"] = coeffsUE;
                        }
                        // const match = prevision.find(item => item.Name === nom);

                        // if (match) {
                        //     match.CoeffsUE = coeffsUE;
                        // } else {
                        //     console.log(nom); // nom pas trouvé dans prevision
                        // }
                    }
                }

                const listeContainer = document.getElementById("prevision-liste");
                const ueMoyennesContainer = document.getElementById("ue-moyennes");

                const ueData = {};

                prevision.forEach(item => {
                    const nom = item.Name;
                    const moyenne = item.Moyenne;
                    const coeffs = item.CoeffsUE;

                    const div = document.createElement("div");
                    const bgColorClass = (!isNaN(moyenne) && moyenne < 10) ? "div-moy-red bg-red-100 border-red-400" : "div-moy bg-white border-gray-200";
                    div.className = `${bgColorClass} rounded-lg shadow-md p-4 border`;
                    div.innerHTML = `
                        <h2 class="text-lg font-semibold text-gray-800 mb-2">${nom}</h2>
                        <p class="text-gray-700">${isNaN(moyenne) ? "Aucune note" : moyenne.toFixed(2)}</p>
                    `;
                    listeContainer.appendChild(div);

                    if (coeffs) {
                        for (let ue in coeffs) {
                            const coeff = parseFloat(coeffs[ue]);
                            if (!ueData[ue]) {
                                ueData[ue] = { total: 0, poids: 0 };
                            }
                            if (!isNaN(moyenne)) {
                                ueData[ue].total += moyenne * coeff;
                                ueData[ue].poids += coeff;
                            }
                        }
                    }
                });

                for (let ue in ueData) {
                    const { total, poids } = ueData[ue];
                    const moyenneUE = poids > 0 ? (total / poids) : NaN;

                    ue = ue.replace("Coeff", "Moyenne");
                    console.log(ue);

                    const bgColorClass = (!isNaN(moyenneUE) && moyenneUE < 10) ? "div-moy-red bg-red-100 border-red-400" : "div-moy-blue bg-indigo-100 border-indigo-300";

                    const div = document.createElement("div");
                    div.className = `${bgColorClass} rounded-lg shadow-md p-4 border text-center`;

                    div.innerHTML = `
                        <h2 class="text-lg font-semibold text-indigo-800 mb-1">${ue}</h2>
                        <p class="text-gray-700">${isNaN(moyenneUE) ? "Non calculable" : moyenneUE.toFixed(2)}</p>
                    `;

                    ueMoyennesContainer.appendChild(div);
                }
            });
    })
    .catch(error => {
        console.error('Erreur lors du chargement du fichier JSON :', error);
    });