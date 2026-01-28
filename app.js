// app.js - Lógica de la PWA para GitHub Pages
const statusEl = document.getElementById('status');
const btn = document.getElementById('btn');

// Configuración obligatoria para GitHub (WSS + Puerto 8000)
const MQTT_URL = 'wss://://broker.hivemq.com';
const MQTT_TOPIC = 'mi-porton-unico-2026-xyz/comando';

const client = mqtt.connect(MQTT_URL, {
    reconnectPeriod: 5000,
    connectTimeout: 30 * 1000,
});

client.on('connect', () => {
    console.log('Conectado al Broker MQTT');
    statusEl.innerText = "CONECTADO ✅";
    statusEl.style.color = "#16a34a";
});

client.on('error', (err) => {
    console.error('Error MQTT:', err);
    statusEl.innerText = "ERROR DE CONEXIÓN";
    statusEl.style.color = "red";
});

function activarPorton() {
    if (client.connected) {
        client.publish(MQTT_TOPIC, 'OPEN');
        statusEl.innerText = "ENVIANDO PULSO...";
        setTimeout(() => {
            statusEl.innerText = "CONECTADO ✅";
        }, 2000);
    } else {
        alert("Aún no hay conexión con el servidor. Espera un momento.");
    }
}

btn.addEventListener('click', activarPorton);
