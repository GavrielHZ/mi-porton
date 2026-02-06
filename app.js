import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  get,
  child,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfpyKv1k0dNcOT4XiC-0ZKC75rngM8eCE",
  databaseURL: "https://san-industries-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const statusValue = document.getElementById("statusValue");
const statusDot = document.getElementById("statusDot");
const espDot = document.getElementById("espDot");
const espStatus = document.getElementById("espStatus");
const espHint = document.getElementById("espHint");
const espLastSeen = document.getElementById("espLastSeen");
const updatedAt = document.getElementById("updatedAt");
const message = document.getElementById("message");
const openBtn = document.getElementById("openBtn");
const refreshBtn = document.getElementById("refreshBtn");
const themeToggle = document.getElementById("themeToggle");
const qrCanvas = document.getElementById("qrCanvas");
const qrHint = document.getElementById("qrHint");
const scanBtn = document.getElementById("scanBtn");
const stopScanBtn = document.getElementById("stopScanBtn");
const scanMessage = document.getElementById("scanMessage");

let qrScanner = null;

const statusRef = ref(db, "porton/status");
const controlRef = ref(db, "porton/control");
const lastSeenRef = ref(db, "porton/lastSeen");

let lastSeenMs = null;
const offlineThresholdMs = 90000;

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#fca5a5" : "#94a3b8";
}

function updateTimestamp() {
  const now = new Date();
  updatedAt.textContent = now.toLocaleString();
}

function updateStatusUI(value) {
  const normalized = String(value || "").toUpperCase();
  statusDot.classList.remove("online", "busy");

  if (normalized.includes("ONLINE") || normalized.includes("ABIERTO")) {
    statusDot.classList.add("online");
  } else if (normalized.includes("OPEN") || normalized.includes("ABRIENDO")) {
    statusDot.classList.add("busy");
  }
}

function updatePresenceUI() {
  espDot.classList.remove("online", "busy", "offline");

  if (!lastSeenMs) {
    espStatus.textContent = "Desconocido";
    espHint.textContent = "Esperando señal ONLINE...";
    espLastSeen.textContent = "—";
    return;
  }

  const now = Date.now();
  const diff = now - lastSeenMs;
  espLastSeen.textContent = new Date(lastSeenMs).toLocaleString();

  if (diff > offlineThresholdMs) {
    espDot.classList.add("offline");
    espStatus.textContent = "Offline";
    espHint.textContent = `Sin señal hace ${Math.round(diff / 1000)} s`;
  } else {
    espDot.classList.add("online");
    espStatus.textContent = "En línea";
    espHint.textContent = "ESP32 reportando estado activo";
  }
}

onValue(statusRef, (snapshot) => {
  const value = snapshot.val() ?? "—";
  statusValue.textContent = value;
  updateStatusUI(value);
  updateTimestamp();
});

onValue(lastSeenRef, (snapshot) => {
  const value = snapshot.val();
  lastSeenMs = typeof value === "number" ? value : null;
  updatePresenceUI();
});

openBtn.addEventListener("click", async () => {
  openBtn.disabled = true;
  setMessage("Enviando comando OPEN...");

  try {
    await set(controlRef, "OPEN");
    setMessage("Comando enviado. Esperando confirmación...");
  } catch (error) {
    setMessage(`Error al enviar comando: ${error.message}`, true);
  } finally {
    setTimeout(() => {
      openBtn.disabled = false;
    }, 1200);
  }
});

refreshBtn.addEventListener("click", async () => {
  setMessage("Leyendo estado...");

  try {
    const snapshot = await get(child(ref(db), "porton/status"));
    const value = snapshot.val() ?? "—";
    statusValue.textContent = value;
    updateStatusUI(value);
    updateTimestamp();
    setMessage("Estado actualizado.");
  } catch (error) {
    setMessage(`Error al leer estado: ${error.message}`, true);
  }
});

setInterval(updatePresenceUI, 5000);

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
});

function setScanMessage(text, isError = false) {
  scanMessage.textContent = text;
  scanMessage.style.color = isError ? "#fca5a5" : "#94a3b8";
}

function renderQr() {
  const url = window.location.href;
  if (!qrCanvas || typeof QRCode === "undefined") {
    if (qrHint) {
      qrHint.textContent = "No se pudo generar el QR.";
    }
    return;
  }

  QRCode.toCanvas(
    qrCanvas,
    url,
    {
      width: 220,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    },
    (error) => {
      if (qrHint) {
        qrHint.textContent = error ? "Error al generar el QR." : url;
      }
    }
  );
}

async function startQrScan() {
  if (typeof Html5Qrcode === "undefined") {
    setScanMessage("El escáner QR no está disponible.", true);
    return;
  }

  if (!qrScanner) {
    qrScanner = new Html5Qrcode("qrReader");
  }

  scanBtn.disabled = true;
  stopScanBtn.disabled = false;
  setScanMessage("Iniciando cámara...");

  try {
    await qrScanner.start(
      { facingMode: "environment" },
      { fps: 8, qrbox: 220 },
      (decodedText) => {
        setScanMessage(`QR leído: ${decodedText}`);
        if (decodedText.startsWith("http")) {
          window.location.href = decodedText;
        }
      },
      () => {}
    );
    setScanMessage("Escaneando... apunta al QR.");
  } catch (error) {
    setScanMessage(`No se pudo iniciar el escáner: ${error.message}`, true);
    scanBtn.disabled = false;
    stopScanBtn.disabled = true;
  }
}

async function stopQrScan() {
  if (!qrScanner) return;

  try {
    await qrScanner.stop();
    await qrScanner.clear();
  } catch (error) {
    setScanMessage(`No se pudo detener el escáner: ${error.message}`, true);
  } finally {
    scanBtn.disabled = false;
    stopScanBtn.disabled = true;
  }
}

scanBtn?.addEventListener("click", startQrScan);
stopScanBtn?.addEventListener("click", stopQrScan);

renderQr();
