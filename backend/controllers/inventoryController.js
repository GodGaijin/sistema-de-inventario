const InventoryRequestModel = require('../models/inventoryRequestModel');
const InventoryTransactionModel = require('../models/inventoryTransactionModel');
const ProductModel = require('../models/productModel');
const XLSX = require('xlsx');
const { logAudit } = require('../models/auditModel');

// Crear una nueva solicitud de inventario
const createRequest = async (req, res) => {
    try {
        const { product_id, transaction_type, quantity, description } = req.body;
        const userId = req.user.id;

        // Validar datos requeridos
        if (!product_id || !transaction_type || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar tipo de transacción
        const validTypes = ['entrada', 'salida', 'auto_consumo'];
        if (!validTypes.includes(transaction_type)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de transacción inválido'
            });
        }

        // Verificar que el producto existe
        const product = await ProductModel.getById(product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Crear la solicitud
        const request = await InventoryRequestModel.create(userId, {
            product_id,
            transaction_type,
            quantity,
            description
        });

        // Registrar auditoría
        await logAudit(
            userId,
            req.user.username,
            'CREATE',
            'inventory_request',
            request.id
        );

        res.status(201).json({
            success: true,
            message: 'Solicitud de inventario creada exitosamente',
            data: request
        });

    } catch (error) {
        console.error('Error creating inventory request:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener solicitudes pendientes (solo administradores)
const getPendingRequests = async (req, res) => {
    try {
        const requests = await InventoryRequestModel.getPendingRequests();
        
        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error getting pending requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener solicitudes del usuario actual
const getUserRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await InventoryRequestModel.getRequestsByUser(userId);
        
        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error getting user requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Aprobar una solicitud de inventario
const approveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user.id;

        // Obtener la solicitud
        const request = await InventoryRequestModel.getById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'La solicitud ya ha sido procesada'
            });
        }

        // Obtener el producto
        const product = await ProductModel.getById(request.product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Calcular nuevo stock
        let newStock = product.stock;
        switch (request.transaction_type) {
            case 'entrada':
                newStock += request.quantity;
                break;
            case 'salida':
                if (product.stock < request.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Stock insuficiente para realizar la salida'
                    });
                }
                newStock -= request.quantity;
                break;
            case 'auto_consumo':
                if (product.stock < request.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Stock insuficiente para el auto-consumo'
                    });
                }
                newStock -= request.quantity;
                break;
        }

        // Actualizar stock del producto
        await ProductModel.updateStock(request.product_id, newStock);

        // Aprobar la solicitud
        await InventoryRequestModel.approveRequest(requestId, adminId);

        // Crear transacción
        const transactionData = {
            codigo_de_transaccion: await InventoryTransactionModel.generateTransactionCode(),
            fecha: new Date(),
            codigo_prod: product.codigo_seniat || product.codigo,
            nombre: product.nombre,
            inventario_inicial: product.stock,
            entradas: request.transaction_type === 'entrada' ? request.quantity : 0,
            salidas: request.transaction_type === 'salida' ? request.quantity : 0,
            auto_consumo: request.transaction_type === 'auto_consumo' ? request.quantity : 0,
            inventario_final: newStock,
            request_id: requestId,
            user_id: request.user_id
        };

        const transaction = await InventoryTransactionModel.create(transactionData);

        // Registrar auditorías
        await logAudit(
            adminId,
            req.user.username,
            'APPROVE',
            'inventory_request',
            requestId
        );

        await logAudit(
            request.user_id,
            request.user_name,
            'CREATE',
            'inventory_transaction',
            transaction.id
        );

        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente',
            data: {
                request,
                transaction
            }
        });

    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Rechazar una solicitud de inventario
const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { rejection_reason } = req.body;
        const adminId = req.user.id;

        // Validar motivo de rechazo
        if (!rejection_reason || rejection_reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El motivo de rechazo es obligatorio'
            });
        }

        // Obtener la solicitud
        const request = await InventoryRequestModel.getById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'La solicitud ya ha sido procesada'
            });
        }

        // Rechazar la solicitud
        await InventoryRequestModel.rejectRequest(requestId, adminId, rejection_reason);

        // Registrar auditoría
        await logAudit(
            adminId,
            req.user.username,
            'REJECT',
            'inventory_request',
            requestId
        );

        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente'
        });

    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener historial de solicitudes (solo administradores)
const getRequestHistory = async (req, res) => {
    try {
        const history = await InventoryRequestModel.getRequestHistory();
        
        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Error getting request history:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener todas las transacciones
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await InventoryTransactionModel.getAllTransactions();
        
        res.json({
            success: true,
            data: transactions
        });

    } catch (error) {
        console.error('Error getting all transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener transacciones del usuario actual
const getUserTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await InventoryTransactionModel.getTransactionsByUser(userId);
        
        res.json({
            success: true,
            data: transactions
        });

    } catch (error) {
        console.error('Error getting user transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener estadísticas de inventario
const getInventoryStats = async (req, res) => {
    try {
        const stats = await InventoryTransactionModel.getInventoryStats();
        
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error getting inventory stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Exportar transacciones a Excel
const exportTransactions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let transactions;

        if (startDate && endDate) {
            transactions = await InventoryTransactionModel.getTransactionsByDateRange(startDate, endDate);
        } else {
            transactions = await InventoryTransactionModel.getAllTransactions();
        }

        // Preparar datos para Excel
        const excelData = transactions.map(transaction => ({
            'Código de Transacción': transaction.codigo_de_transaccion,
            'Fecha': new Date(transaction.fecha).toLocaleDateString('es-ES'),
            'Código SENIAT': transaction.codigo_prod,
            'Nombre del Producto': transaction.nombre,
            'Inventario Inicial': transaction.inventario_inicial,
            'Entradas': transaction.entradas,
            'Salidas': transaction.salidas,
            'Auto-consumo': transaction.auto_consumo,
            'Inventario Final': transaction.inventario_final,
            'Usuario': transaction.user_name,
            'Estado': transaction.request_status || 'Aprobada',
            'Motivo de Rechazo': transaction.rejection_reason || 'N/A'
        }));

        // Crear workbook y worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Ajustar ancho de columnas
        const columnWidths = [
            { wch: 20 }, // Código de Transacción
            { wch: 15 }, // Fecha
            { wch: 15 }, // Código SENIAT
            { wch: 30 }, // Nombre del Producto
            { wch: 15 }, // Inventario Inicial
            { wch: 10 }, // Entradas
            { wch: 10 }, // Salidas
            { wch: 12 }, // Auto-consumo
            { wch: 15 }, // Inventario Final
            { wch: 20 }, // Usuario
            { wch: 12 }, // Estado
            { wch: 30 }  // Motivo de Rechazo
        ];
        worksheet['!cols'] = columnWidths;

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones de Inventario');

        // Generar buffer del archivo
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para descarga
        const fileName = `inventario_transacciones_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        // Registrar auditoría de exportación
        await logAudit(
            req.user.id,
            req.user.username,
            'EXPORT',
            'inventory_transactions',
            null
        );

        res.send(excelBuffer);

    } catch (error) {
        console.error('Error exporting transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    createRequest,
    getPendingRequests,
    getUserRequests,
    approveRequest,
    rejectRequest,
    getRequestHistory,
    getAllTransactions,
    getUserTransactions,
    getInventoryStats,
    exportTransactions
}; 