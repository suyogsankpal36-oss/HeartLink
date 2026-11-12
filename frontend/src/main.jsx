import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { MotionConfig } from "framer-motion";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            <SocketProvider>
              <App />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 3400,
                  style: {
                    background: "var(--color-base-100)",
                    color: "var(--color-base-content)",
                    border: "1px solid var(--hl-border-strong)",
                    borderRadius: "0.75rem",
                    boxShadow: "var(--hl-shadow-md)",
                    fontSize: "0.875rem",
                    padding: "0.75rem 1rem",
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </MotionConfig>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
