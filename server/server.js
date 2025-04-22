const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const { config } = require('../src/config.js');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar VAPID para web push
webpush.setVapidDetails(
  'mailto:support@ryn-search.com',
  config.vapid.publicKey,
  config.vapid.privateKey
);

// Almacenamiento temporal de suscripciones (en producción usar una base de datos)
const subscriptions = new Set();

// Endpoint para registrar suscripciones
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.add(subscription);
  res.status(201).json({ message: 'Suscripción registrada' });
});

// Endpoint para enviar notificaciones del clima
app.post('/api/notify/weather', async (req, res) => {
  const { city, temp, condition } = req.body;
  
  const notification = {
    title: `Clima en ${city}`,
    body: `Temperatura: ${temp}°C - ${condition}`,
    icon: '/icons/android/android-launchericon-192-192.png',
    badge: '/icons/ios/76.png',
    data: {
      url: `/?city=${encodeURIComponent(city)}`
    }
  };

  const notificationPromises = Array.from(subscriptions).map(subscription => 
    webpush.sendNotification(subscription, JSON.stringify(notification))
      .catch(error => {
        if (error.statusCode === 410) {
          subscriptions.delete(subscription);
        }
        return null;
      })
  );

  try {
    await Promise.all(notificationPromises);
    res.json({ message: 'Notificaciones enviadas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar notificaciones' });
  }
});

// Endpoint para alertas meteorológicas
app.post('/api/notify/alert', async (req, res) => {
  const { type, message, city } = req.body;
  
  const notification = {
    title: `¡Alerta meteorológica en ${city}!`,
    body: message,
    icon: '/icons/android/android-launchericon-192-192.png',
    badge: '/icons/ios/76.png',
    vibrate: [100, 50, 100, 50, 200],
    data: {
      url: `/?city=${encodeURIComponent(city)}&alert=true`
    },
    actions: [
      {
        action: 'view',
        title: 'Ver detalles'
      }
    ]
  };

  const notificationPromises = Array.from(subscriptions).map(subscription =>
    webpush.sendNotification(subscription, JSON.stringify(notification))
      .catch(error => {
        if (error.statusCode === 410) {
          subscriptions.delete(subscription);
        }
        return null;
      })
  );

  try {
    await Promise.all(notificationPromises);
    res.json({ message: 'Alertas enviadas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar alertas' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
}); 