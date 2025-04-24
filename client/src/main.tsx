import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { StreamVideoProvider } from "./providers/StreamVideoProvider";

// Generate a random user ID if not logged in
const randomUserId = `user-${Math.random().toString(36).substring(2, 9)}`;

createRoot(document.getElementById("root")!).render(
  <StreamVideoProvider userId={randomUserId} userName="Livestreamer">
    <App />
  </StreamVideoProvider>
);
