const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const filename = 'exemple.pdf';
const notesPath = path.join(__dirname, '../notes', filename.replace(/\.pdf$/i, '.json'));

fetch('http://api:3000/process-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename })
})
  .then(res => res.json())
  .then(json => {
    if (json.success) {
      // Cette partie écrit explicitement le fichier dans /notes
      fs.writeFileSync(notesPath, JSON.stringify(json.data, null, 2));
      console.log('✅ Fichier JSON enregistré dans notes/');
    }
  });
