const selector = document.getElementById("file-selector");
const container = document.getElementById("modules-container");

function loadNotes(filename) {
fetch(`notes/${filename}`)
    .then(r => r.ok ? r.json() : Promise.reject("Erreur JSON"))
    .then(data => {
    container.innerHTML = "";

    if (!data || !Array.isArray(data.grades)) throw new Error("Format invalide");

    data.grades.forEach(module => {
        const card = document.createElement("div");
        card.className = "card bg-white p-6 rounded-lg shadow-md flex flex-col justify-between";

        const title = document.createElement("h2");
        title.className = "text-xl font-semibold mb-3 text-indigo-700";
        title.textContent = module.name.split(" ").slice(2).join(" ");
        card.appendChild(title);

        const teacher = document.createElement("p");
        teacher.className = "text-sm text-gray-500 mb-2";
        teacher.textContent = `Prof : ${module.teacher}`;
        card.appendChild(teacher);

        if (module.grades.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "mb-4 space-y-1";

        module.grades.forEach(entry => {
            const [comment, grade] = entry;
            const li = document.createElement("li");
            li.className = "flex justify-between text-gray-700";
            li.innerHTML = grade.length === 2
            ? `<span>Note : <strong>${parseFloat(grade[0]).toFixed(2)}</strong></span><span>Coeff : ${parseFloat(grade[1])}</span>`
            : `<span class="w-full"><em>${grade[0]}</em></span>`;
            ul.appendChild(li);
        });

        card.appendChild(ul);
        } else {
        const noNotes = document.createElement("p");
        noNotes.className = "italic text-gray-500";
        noNotes.textContent = "Aucune note pour ce module.";
        card.appendChild(noNotes);
        }

        const moyenne = document.createElement("p");
        moyenne.className = "text-right font-bold text-blue-700 mt-auto";
        moyenne.textContent = `Moyenne : ${module.average}`;
        card.appendChild(moyenne);

        container.appendChild(card);
    });
    })
    .catch(err => {
    console.error(err);
    container.innerHTML = `<p class="text-red-600">Erreur de chargement.</p>`;
    });
}

// Chargement de la liste des fichiers
fetch("notes/index.json")
.then(r => r.ok ? r.json() : Promise.reject("Erreur index.json"))
.then(files => {
    files.forEach(f => {
    const option = document.createElement("option");
    option.value = f;
    option.textContent = f.replace(".json", "");
    selector.appendChild(option);
    });
    if (files.length > 0) loadNotes(files[0]);
})
.catch(err => {
    console.error(err);
    selector.innerHTML = `<option disabled>Erreur chargement index</option>`;
});

selector.addEventListener("change", () => loadNotes(selector.value));