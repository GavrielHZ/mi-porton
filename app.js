const statusEl = document.getElementById("status");
const buttonEl = document.getElementById("openButton");

const TOPIC = "gavriel_porton_2026/control";
const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";

const client = mqtt.connect(brokerUrl, {
  clientId: `pwa-porton-${Math.random().toString(16).slice(2)}`,
  clean: true,
  reconnectPeriod: 2000,
});

client.on("connect", () => {
  statusEl.textContent = "CONECTADO ✅";
  statusEl.style.color = "#22c55e";
});

client.on("reconnect", () => {
  statusEl.textContent = "Reconectando...";
  statusEl.style.color = "#fbbf24";
});

client.on("close", () => {
  statusEl.textContent = "Desconectado";
  statusEl.style.color = "#ef4444";
});

buttonEl.addEventListener("click", () => {
  client.publish(TOPIC, "OPEN");
});
