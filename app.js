import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const statusEl = document.getElementById("status");
const buttonEl = document.getElementById("openButton");

const firebaseConfig = {
  apiKey: "AIzaSyAfpyKv1k0dNcOT4XiC-0ZKC75rngM8eCE",
  authDomain: "san-industries.firebaseapp.com",
  databaseURL: "https://san-industries-default-rtdb.firebaseio.com",
  projectId: "san-industries",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const controlRef = ref(db, "porton/control");
const statusRef = ref(db, "porton/status");
const connectedRef = ref(db, ".info/connected");

onValue(connectedRef, (snapshot) => {
  if (snapshot.val() === true) {
    statusEl.textContent = "CONECTADO ✅";
    statusEl.style.color = "#22c55e";
  } else {
    statusEl.textContent = "Desconectado";
    statusEl.style.color = "#ef4444";
  }
});

onValue(statusRef, (snapshot) => {
  const status = snapshot.val();
  if (typeof status === "string" && status.length > 0) {
    statusEl.textContent = status === "ONLINE" ? "CONECTADO ✅" : status;
  }
});

buttonEl.addEventListener("click", async () => {
  await set(controlRef, "OPEN");
  await set(statusRef, "ABRIENDO");
  await set(ref(db, "porton/lastCommand"), {
    action: "OPEN",
    ts: serverTimestamp(),
  });
});
