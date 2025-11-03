
document.addEventListener('DOMContentLoaded', () => {
    const SERVER_URL = 'https://pawfessional-api-server.onrender.com';
    const socket = io(SERVER_URL);

    socket.on("events_update", () => {
        console.log("Received events update from server. Refetching...");
        loadEvents();
    });

    function formatDateTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function filterEvents(allEvents) {
      const today = new Date(); 
      today.setHours(0, 0, 0, 0);
      const todayString = today.toDateString();
      const todaysEvents = allEvents.filter(e => new Date(e.start).toDateString() === todayString);
      
      const upcomingEvents = allEvents
        .filter(e => {
            const eventDate = new Date(e.start);
            eventDate.setHours(0, 0, 0, 0); // Normalize event date to the start of its day
            return eventDate > today; // Check if the event's day is after today
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 3);
      return { todaysEvents, upcomingEvents };
    }

    function renderEvents(containerId, events) {
      const list = document.getElementById(containerId.replace('events', 'list'));
      const empty = document.getElementById(containerId.replace('events', 'empty'));
      if (!list || !empty) return;
      list.innerHTML = '';
      if (events.length === 0) {
        empty.style.display = 'block';
        return; 
      }
      empty.style.display = 'none';
      events.forEach(e => {
        const li = document.createElement('li');
        li.className = 'event-item';
        const description = e.extendedProps?.notes || "No details provided.";
        li.innerHTML = `<div class="event-title">${e.title}</div>
                        <div class="event-date">${formatDateTime(e.start)}</div>
                        <div class="event-description">${description}</div>`;
        list.appendChild(li);
      });
    }

    async function loadEvents() {
        try {
            // CORRECTED URL: Fetch events from the live server's public API endpoint
            const response = await fetch(`${SERVER_URL}/api/public/events`);
            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.statusText}`);
            }
            const allEvents = await response.json();
            const { todaysEvents, upcomingEvents } = filterEvents(allEvents);
            renderEvents('todays-events', todaysEvents);
            renderEvents('upcoming-events', upcomingEvents);
        } catch (error) {
            console.error("Error loading events:", error);
            const todaysList = document.getElementById('todays-list');
            if (todaysList) todaysList.innerHTML = `<li class="error-message" style="color: red;">Could not load events.</li>`;
            const upcomingList = document.getElementById('upcoming-list');
            if (upcomingList) upcomingList.innerHTML = `<li class="error-message" style="color: red;">Could not load events.</li>`;
        }
    }

    loadEvents();
});