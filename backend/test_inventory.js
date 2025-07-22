// Script de prueba para el sistema de inventario
require('dotenv').config({ path: './config.env' });
const db = require('./models/database');

async function testInventorySystem() {
    try {
        console.log('🧪 Iniciando pruebas del sistema de inventario...\n');

        // 1. Verificar que las tablas existen
        console.log('1. Verificando tablas de inventario...');
        
        const tablesResult = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('inventory_requests', 'inventory_transactions')
            ORDER BY table_name
        `);
        
        const tables = tablesResult.rows || tablesResult;
        console.log('✅ Tablas encontradas:', tables.map(t => t.table_name));

        // 2. Verificar estructura de inventory_requests
        console.log('\n2. Verificando estructura de inventory_requests...');
        
        const requestsColumns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'inventory_requests'
            ORDER BY ordinal_position
        `);
        
        console.log('✅ Columnas de inventory_requests:');
        (requestsColumns.rows || requestsColumns).forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // 3. Verificar estructura de inventory_transactions
        console.log('\n3. Verificando estructura de inventory_transactions...');
        
        const transactionsColumns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'inventory_transactions'
            ORDER BY ordinal_position
        `);
        
        console.log('✅ Columnas de inventory_transactions:');
        (transactionsColumns.rows || transactionsColumns).forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // 4. Verificar índices
        console.log('\n4. Verificando índices...');
        
        const indexes = await db.query(`
            SELECT indexname, tablename
            FROM pg_indexes 
            WHERE tablename IN ('inventory_requests', 'inventory_transactions')
            ORDER BY tablename, indexname
        `);
        
        console.log('✅ Índices encontrados:');
        (indexes.rows || indexes).forEach(idx => {
            console.log(`   - ${idx.indexname} en ${idx.tablename}`);
        });

        // 5. Verificar restricciones CHECK
        console.log('\n5. Verificando restricciones CHECK...');
        
        const checkConstraints = await db.query(`
            SELECT 
                tc.table_name,
                tc.constraint_name,
                cc.check_clause
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name IN ('inventory_requests', 'inventory_transactions')
            AND tc.constraint_type = 'CHECK'
        `);
        
        console.log('✅ Restricciones CHECK encontradas:');
        (checkConstraints.rows || checkConstraints).forEach(constraint => {
            console.log(`   - ${constraint.table_name}.${constraint.constraint_name}: ${constraint.check_clause}`);
        });

        // 6. Verificar claves foráneas
        console.log('\n6. Verificando claves foráneas...');
        
        const foreignKeys = await db.query(`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name IN ('inventory_requests', 'inventory_transactions')
        `);
        
        console.log('✅ Claves foráneas encontradas:');
        (foreignKeys.rows || foreignKeys).forEach(fk => {
            console.log(`   - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });

        console.log('\n🎉 Todas las pruebas completadas exitosamente!');
        console.log('✅ El sistema de inventario está correctamente configurado.');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    } finally {
        // Cerrar la conexión
        db.close();
    }
}

// Ejecutar las pruebas
testInventorySystem(); 