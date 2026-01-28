(function(){
  const btn = document.getElementById('btn');
  const statusEl = document.getElementById('status');

  const MQTT_URL = 'wss://broker.hivemq.com:8000/mqtt';
  const MQTT_TOPIC = 'mi-porton-unico-2026-xyz/comando';

  let client;
  let connected = false;

  function setStatus(msg){ statusEl.textContent = msg || ''; }
  function setIndicator(isReady) {
    statusEl.style.color = isReady ? '#16a34a' : '#f59e0b';
  }

  function connect() {
    setStatus('Conectando a MQTT...');
    client = mqtt.connect(MQTT_URL, {
      reconnectPeriod: 5000,
      clean: true
    });

    client.on('connect', () => {
      connected = true;
      setIndicator(true);
      setStatus('Conectado');
    });

    client.on('reconnect', () => { setIndicator(false); setStatus('Reconectando...'); });
    client.on('close', () => { connected = false; setIndicator(false); setStatus('Desconectado'); });
    client.on('error', (err) => { console.error(err); setIndicator(false); setStatus('Error MQTT'); });
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
