/**
 * Export Routes
 *
 * Rotas para exportar dados em diferentes formatos
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const exportService = require('../services/exportService');

/**
 * GET /api/export/transactions/excel
 * Exporta transações para Excel
 */
router.get('/transactions/excel', authMiddleware, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!req.organization) {
            return res.status(400).json({ error: 'Organization context required' });
        }

        const result = await exportService.exportToExcel({
            organization_id: req.organization.id,
            organization_name: req.organization.name,
            start_date,
            end_date
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

        res.send(result.buffer);

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({
            error: 'Failed to export to Excel',
            details: error.message
        });
    }
});

/**
 * GET /api/export/transactions/csv
 * Exporta transações para CSV
 */
router.get('/transactions/csv', authMiddleware, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!req.organization) {
            return res.status(400).json({ error: 'Organization context required' });
        }

        const result = await exportService.exportToCSV({
            organization_id: req.organization.id,
            organization_name: req.organization.name,
            start_date,
            end_date
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

        res.send(result.data);

    } catch (error) {
        console.error('Error exporting to CSV:', error);
        res.status(500).json({
            error: 'Failed to export to CSV',
            details: error.message
        });
    }
});

module.exports = router;
