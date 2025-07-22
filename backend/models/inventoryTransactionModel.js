const db = require('./database');

class InventoryTransactionModel {
    // Crear una nueva transacción de inventario
    static async create(transactionData) {
        const query = `
            INSERT INTO inventory_transactions 
            (codigo_de_transaccion, fecha, codigo_prod, nombre, inventario_inicial, 
             entradas, salidas, auto_consumo, inventario_final, request_id, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        
        const values = [
            transactionData.codigo_de_transaccion,
            transactionData.fecha,
            transactionData.codigo_prod,
            transactionData.nombre,
            transactionData.inventario_inicial,
            transactionData.entradas || 0,
            transactionData.salidas || 0,
            transactionData.auto_consumo || 0,
            transactionData.inventario_final,
            transactionData.request_id,
            transactionData.user_id
        ];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating inventory transaction: ${error.message}`);
        }
    }

    // Obtener todas las transacciones
    static async getAllTransactions() {
        const query = `
            SELECT it.*, 
                   u.username as user_name,
                   ir.status as request_status,
                   ir.rejection_reason
            FROM inventory_transactions it
            JOIN users u ON it.user_id = u.id
            LEFT JOIN inventory_requests ir ON it.request_id = ir.id
            ORDER BY it.fecha DESC
        `;

        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting all transactions: ${error.message}`);
        }
    }

    // Obtener transacciones por usuario
    static async getTransactionsByUser(userId) {
        const query = `
            SELECT it.*, 
                   ir.status as request_status,
                   ir.rejection_reason
            FROM inventory_transactions it
            LEFT JOIN inventory_requests ir ON it.request_id = ir.id
            WHERE it.user_id = $1
            ORDER BY it.fecha DESC
        `;

        try {
            const result = await db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting user transactions: ${error.message}`);
        }
    }

    // Obtener transacciones por producto
    static async getTransactionsByProduct(productId) {
        const query = `
            SELECT it.*, 
                   u.username as user_name,
                   ir.status as request_status,
                   ir.rejection_reason
            FROM inventory_transactions it
            JOIN users u ON it.user_id = u.id
            LEFT JOIN inventory_requests ir ON it.request_id = ir.id
            WHERE it.codigo_prod = $1
            ORDER BY it.fecha DESC
        `;

        try {
            const result = await db.query(query, [productId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting product transactions: ${error.message}`);
        }
    }

    // Obtener transacciones por rango de fechas
    static async getTransactionsByDateRange(startDate, endDate) {
        const query = `
            SELECT it.*, 
                   u.username as user_name,
                   ir.status as request_status,
                   ir.rejection_reason
            FROM inventory_transactions it
            JOIN users u ON it.user_id = u.id
            LEFT JOIN inventory_requests ir ON it.request_id = ir.id
            WHERE it.fecha BETWEEN $1 AND $2
            ORDER BY it.fecha DESC
        `;

        try {
            const result = await db.query(query, [startDate, endDate]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting transactions by date range: ${error.message}`);
        }
    }

    // Generar código de transacción único
    static async generateTransactionCode() {
        const query = `
            SELECT COUNT(*) as count 
            FROM inventory_transactions 
            WHERE DATE(fecha) = CURRENT_DATE
        `;

        try {
            const result = await db.query(query);
            const count = parseInt(result.rows[0].count) + 1;
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            return `TXN-${today}-${count.toString().padStart(4, '0')}`;
        } catch (error) {
            throw new Error(`Error generating transaction code: ${error.message}`);
        }
    }

    // Obtener estadísticas de inventario
    static async getInventoryStats() {
        const query = `
            SELECT 
                COUNT(*) as total_transactions,
                COUNT(CASE WHEN ir.status = 'approved' THEN 1 END) as approved_transactions,
                COUNT(CASE WHEN ir.status = 'rejected' THEN 1 END) as rejected_transactions,
                SUM(CASE WHEN it.entradas > 0 THEN it.entradas ELSE 0 END) as total_entradas,
                SUM(CASE WHEN it.salidas > 0 THEN it.salidas ELSE 0 END) as total_salidas,
                SUM(CASE WHEN it.auto_consumo > 0 THEN it.auto_consumo ELSE 0 END) as total_auto_consumo
            FROM inventory_transactions it
            LEFT JOIN inventory_requests ir ON it.request_id = ir.id
        `;

        try {
            const result = await db.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error getting inventory stats: ${error.message}`);
        }
    }
}

module.exports = InventoryTransactionModel; 