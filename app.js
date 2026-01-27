(function(){
  const btn = document.getElementById('btn');
  const statusEl = document.getElementById('status');

  // Broker público EMQX con WebSocket seguro
  const MQTT_URL = 'wss://broker.emqx.io:8084/mqtt';
  const MQTT_TOPIC = 'mi-porton-unico-2026-xyz/comando';
  const MQTT_USER = '';
  const MQTT_PASS = '';

  let client;
  let connected = false;

  function setStatus(msg){ statusEl.textContent = msg || ''; }

  function connect() {
    setStatus('Conectando a MQTT...');
    client = mqtt.connect(MQTT_URL, {
      username: MQTT_USER || undefined,
      password: MQTT_PASS || undefined,
      reconnectPeriod: 2000,
      clean: true
    });

    client.on('connect', () => {
      connected = true;
      setStatus('Conectado');
    });

    client.on('reconnect', () => setStatus('Reconectando...'));
    client.on('close', () => { connected = false; setStatus('Desconectado'); });
    client.on('error', (err) => { console.error(err); setStatus('Error MQTT'); });
  }

  function enviar() {
    if (!connected) {
      setStatus('Sin conexión MQTT');
      return;
    }
    btn.disabled = true;
    setStatus('Enviando comando...');
    client.publish(MQTT_TOPIC, 'OPEN', { qos: 1 }, (err) => {
      if (err) {
        console.error(err);
        setStatus('Error al enviar');
      } else {
        setStatus('Comando enviado');
      }
      setTimeout(() => { btn.disabled = false; setStatus(''); }, 1000);
    });
  }

  btn.addEventListener('click', enviar);
  connect();
})();
