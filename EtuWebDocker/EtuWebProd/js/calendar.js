document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek', // Vue par jour sur mobile
    firstDay: 1,
    locale: 'fr',
    locales: ['fr'],
    buttonText: {
        today: 'Aujourd\'hui',
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour'
    },
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    weekends: false,
    headerToolbar: {
        left: 'prev,next,today', // Virgule ajoutée après next pour améliorer l'alignement
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    eventDidMount: function(info) {
        if (info.event.extendedProps.location) {
            // Ajoute le lieu en dessous du titre
            const locationEl = document.createElement('div');
            locationEl.className = 'text-xs mt-1 italic';
            locationEl.innerText = info.event.extendedProps.location;
            info.el.querySelector('.fc-event-title')?.appendChild(locationEl);
        }
    },
    // Ajout d'options responsive
    height: 'auto',
    windowResize: function(view) {
        // Change la vue en fonction de la taille d'écran
        if (window.innerWidth < 768) {
        calendar.changeView('timeGridDay');
        } else {
        calendar.changeView('timeGridWeek');
        }
    }
    });
    calendar.render();

    // Fonction pour gérer la taille du calendrier
    function handleCalendarSize() {
    const width = window.innerWidth;
    if (width < 640) {
        calendarEl.classList.add('fc-small-screen');
    } else {
        calendarEl.classList.remove('fc-small-screen');
    }
    }
    
    // Appliquer le redimensionnement au chargement et au resize
    handleCalendarSize();
    window.addEventListener('resize', handleCalendarSize);

    fetch("https://edtweb.univ-cotedazur.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=15866&projectId=4&calType=ical&firstDate=2024-07-01&lastDate=2025-08-01")
    .then(response => response.text())
    .then(data => {
        const jcalData = ICAL.parse(data);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");

        const events = vevents.map(evt => {
        const e = new ICAL.Event(evt);
        return {
            title: e.summary,
            start: e.startDate.toJSDate(),
            end: e.endDate.toJSDate(),
            location: e.location
        };
        });

        calendar.addEventSource(events);
    })
    .catch(error => {
        console.error("Erreur lors du chargement du calendrier:", error);
        // Afficher un message d'erreur à l'utilisateur
        const errorMsg = document.createElement('div');
        errorMsg.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4';
        errorMsg.innerHTML = '<strong>Erreur:</strong> Impossible de charger les données du calendrier.';
        calendarEl.parentNode.insertBefore(errorMsg, calendarEl.nextSibling);
    });
});