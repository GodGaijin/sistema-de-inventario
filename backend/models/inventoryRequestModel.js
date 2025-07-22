const db = require('./database');

class InventoryRequestModel {
    // Crear una nueva solicitud
    static async create(userId, requestData) {
        const query = `
            INSERT INTO inventory_requests 
            (user_id, product_id, transaction_type, quantity, description, status, created_at)
            VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
            RETURNING *
        `;
        
        const values = [
            userId,
            requestData.product_id,
            requestData.transaction_type, // 'entrada', 'salida', 'auto_consumo'
            requestData.quantity,
            requestData.description
        ];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating inventory request: ${error.message}`);
        }
    }

    // Obtener todas las solicitudes pendientes
    static async getPendingRequests() {
        const query = `
            SELECT ir.*, 
                   u.username as user_name,
                   p.name as product_name,
                   p.codigo_seniat as product_code,
                   p.stock as current_stock
            FROM inventory_requests ir
            JOIN users u ON ir.user_id = u.id
            JOIN products p ON ir.product_id = p.id
            WHERE ir.status = 'pending'
            ORDER BY ir.created_at DESC
        `;

        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting pending requests: ${error.message}`);
        }
    }

    // Obtener una solicitud por ID
    static async getById(requestId) {
        const query = `
            SELECT ir.*, 
                   u.username as user_name,
                   p.name as product_name,
                   p.codigo_seniat as product_code,
                   p.stock as current_stock,
                   admin.username as admin_name
            FROM inventory_requests ir
            JOIN users u ON ir.user_id = u.id
            JOIN products p ON ir.product_id = p.id
            LEFT JOIN users admin ON ir.admin_id = admin.id
            WHERE ir.id = $1
        `;

        try {
            const result = await db.query(query, [requestId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error getting request by ID: ${error.message}`);
        }
    }

    // Obtener solicitudes por usuario
    static async getRequestsByUser(userId) {
        const query = `
            SELECT ir.*, 
                   p.name as product_name,
                   p.codigo_seniat as product_code,
                   p.stock as current_stock,
                   u.username as admin_name
            FROM inventory_requests ir
            JOIN products p ON ir.product_id = p.id
            LEFT JOIN users u ON ir.admin_id = u.id
            WHERE ir.user_id = $1
            ORDER BY ir.created_at DESC
        `;

        try {
            const result = await db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting user requests: ${error.message}`);
        }
    }

    // Aprobar una solicitud
    static async approveRequest(requestId, adminId) {
        const query = `
            UPDATE inventory_requests 
            SET status = 'approved', 
                admin_id = $1, 
                processed_at = NOW()
            WHERE id = $2 AND status = 'pending'
            RETURNING *
        `;

        try {
            const result = await db.query(query, [adminId, requestId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error approving request: ${error.message}`);
        }
    }

    // Rechazar una solicitud
    static async rejectRequest(requestId, adminId, rejectionReason) {
        const query = `
            UPDATE inventory_requests 
            SET status = 'rejected', 
                admin_id = $1, 
                rejection_reason = $2,
                processed_at = NOW()
            WHERE id = $3 AND status = 'pending'
            RETURNING *
        `;

        try {
            const result = await db.query(query, [adminId, rejectionReason, requestId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error rejecting request: ${error.message}`);
        }
    }

    // Obtener historial de solicitudes (solo para administradores)
    static async getRequestHistory() {
        const query = `
            SELECT ir.*, 
                   u.username as user_name,
                   p.name as product_name,
                   p.codigo_seniat as product_code,
                   admin.username as admin_name
            FROM inventory_requests ir
            JOIN users u ON ir.user_id = u.id
            JOIN products p ON ir.product_id = p.id
            LEFT JOIN users admin ON ir.admin_id = admin.id
            WHERE ir.status IN ('approved', 'rejected')
            ORDER BY ir.processed_at DESC
        `;

        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting request history: ${error.message}`);
        }
    }
}

module.exports = InventoryRequestModel; 