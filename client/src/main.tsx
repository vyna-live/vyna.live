import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import StreamVideoProvider from "./providers/StreamVideoProvider";
import { ThemeProvider } from "next-themes";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <StreamVideoProvider>
      <App />
    </StreamVideoProvider>
  </ThemeProvider>
);
