// src/main.jsx
// Punto de entrada principal de la aplicación
// No necesitas modificar este archivo

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// Estilos globales mínimos
const globalStyles = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 14px;
    color: #111;
    background: #f7f8f5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, select, textarea {
    font-family: inherit;
  }

  img {
    max-width: 100%;
    display: block;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #bbb;
  }
`;

// Inyectar estilos globales
const styleTag = document.createElement("style");
styleTag.textContent = globalStyles;
document.head.appendChild(styleTag);

// Montar la app
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
