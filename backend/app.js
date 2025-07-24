// Cargar variables de entorno
// En desarrollo local: desde config.env
// En producción (Render): desde variables de entorno del sistema
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './config.env' });
}

// Log para debug


// Las variables de entorno se cargan automáticamente desde el sistema
// En desarrollo local: desde config.env (manualmente)
// En Render: desde las variables de entorno configuradas en el dashboard
const express = require('express');
const cors = require('cors');
const db = require('./models/database');
const sessionModel = require('./models/sessionModel');
const app = express();

// Configurar CORS para permitir el frontend en Render
const corsOptions = {
  origin: [
    'https://inventory-frontend-2syh.onrender.com',
    'https://inventory-frontend.onrender.com',
    'http://localhost:4200',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Log de CORS para debug

app.use(express.json());

// Import security middlewares
const securityMiddleware = require('./middlewares/securityMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const distributorRoutes = require('./routes/distributorRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const auditRoutes = require('./routes/auditRoutes');
const ownCommerceRoutes = require('./routes/ownCommerceRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const securityRoutes = require('./routes/securityRoutes');

// Aplicar middlewares de seguridad globales
app.use(securityMiddleware.behaviorAnalysis);
app.use(securityMiddleware.securityLogging);
app.use(securityMiddleware.cleanupMiddleware);

// Rutas con middlewares de seguridad específicos
app.use('/api/auth', 
  securityMiddleware.checkBlockedIP,
  authRoutes
);

app.use('/api/products', productRoutes);
app.use('/api/distributors', distributorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/own-commerce', ownCommerceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/security', securityRoutes);


app.get('/', (req, res) => {
  res.send('Inventory System API');
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Inventory System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL',
    cors: {
      origins: corsOptions.origin,
      credentials: corsOptions.credentials
    }
  });
});

// Database test endpoint
app.get('/api/database/test', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 as test');
    res.status(200).json({ 
      status: 'OK', 
      message: 'Database connection successful',
      test: result.rows ? result.rows[0] : result[0]
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;

// Inicializar la aplicación
async function startServer() {
  try {
    // Inicializar tablas de la base de datos
    await db.initTables();
    
    // Configurar limpieza automática de sesiones inactivas (cada 30 minutos)
    setInterval(async () => {
      try {
        await sessionModel.cleanupInactiveSessions();
      } catch (error) {
        console.error('❌ Error limpiando sesiones inactivas:', error);
      }
    }, 30 * 60 * 1000); // 30 minutos
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer(); 