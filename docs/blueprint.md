# **App Name**: Blabberbox

## Core Features:

- Instant Chat Pairing: Allow users to instantly start a chat with another online user.  Matching can occur via simple queuing based on availability, where the first available users are matched, but no information is stored about those users beyond the time they are awaiting assignment. If there are no other users available to chat, the app displays a clear message, and then retries.
- Simple Chat Interface: Provide a straightforward chat interface, showing messages in a clean, chronological order.
- Connection Health Monitoring: To make the matching work well for larger volumes of people, the client can set up 'heartbeat' signals to detect clients that have gone offline abruptly. In a simple architecture this could work through calls to a 'health' API endpoint, where if the heartbeat vanishes, the connection is declared closed by the service.

## Style Guidelines:

- Primary color: Soft purple (#A098D1) to inspire creativity and connection.
- Background color: Light lavender (#F4F2F9) to complement the purple and make the text easy to read.
- Accent color: Muted pink (#D198B8) to highlight key UI elements such as the send button and notification dots, giving them just a touch of emphasis without being distracting. 
- Clean, sans-serif font for readability across all devices.
- Minimalist icons for actions like sending messages and indicating online status.
- A single-column layout optimized for mobile devices, with clear separation between chat bubbles and input areas.