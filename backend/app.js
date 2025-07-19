// Las variables de entorno se cargan automáticamente desde el sistema
// En desarrollo local: desde config.env (manualmente)
// En Render: desde las variables de entorno configuradas en el dashboard
const express = require('express');
const cors = require('cors');
const db = require('./models/database');
const app = express();

// Configurar CORS para permitir el frontend en Render
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    // Permitir localhost para desarrollo
    if (origin === 'http://localhost:4200' || origin === 'http://127.0.0.1:4200') {
      return callback(null, true);
    }
    
    // Permitir dominios de Render
    if (origin.includes('onrender.com') || origin.includes('render.com')) {
      return callback(null, true);
    }
    
    // Permitir tu dominio específico (reemplazar con tu URL)
    if (origin === 'https://tu-frontend-url.onrender.com') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const distributorRoutes = require('./routes/distributorRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const auditRoutes = require('./routes/auditRoutes');
const ownCommerceRoutes = require('./routes/ownCommerceRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/distributors', distributorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/own-commerce', ownCommerceRoutes);


app.get('/', (req, res) => {
  res.send('Inventory System API');
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Inventory System API is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

// Inicializar la aplicación
async function startServer() {
  try {
    // Inicializar tablas de la base de datos
    await db.initTables();
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: PostgreSQL`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer(); 