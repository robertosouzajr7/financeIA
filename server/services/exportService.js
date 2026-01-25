/**
 * Export Service
 *
 * Serviço para exportar dados em diferentes formatos (Excel, CSV, PDF)
 */

const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const prisma = new PrismaClient();

/**
 * Exporta transações para Excel
 * @param {Object} params - Parâmetros
 */
async function exportToExcel({ organization_id, organization_name, start_date = null, end_date = null }) {
    try {
        console.log(`📊 Exportando transações da organização ${organization_name} para Excel`);

        // Buscar transações
        const where = { organization_id };

        if (start_date || end_date) {
            where.date = {};
            if (start_date) where.date.gte = new Date(start_date);
            if (end_date) where.date.lte = new Date(end_date);
        }

        const transactions = await prisma.financialTransaction.findMany({
            where,
            orderBy: { date: 'desc' }
        });

        console.log(`📋 ${transactions.length} transações encontradas`);

        // Criar workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transações');

        // Definir colunas
        worksheet.columns = [
            { header: 'Data', key: 'date', width: 12 },
            { header: 'Tipo', key: 'type', width: 10 },
            { header: 'Categoria', key: 'category', width: 15 },
            { header: 'Descrição', key: 'description', width: 30 },
            { header: 'Valor', key: 'amount', width: 12 },
            { header: 'Prioridade', key: 'priority', width: 12 },
            { header: 'Origem', key: 'source', width: 12 },
            { header: 'Notas', key: 'notes', width: 40 }
        ];

        // Estilizar cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Adicionar dados
        transactions.forEach(t => {
            worksheet.addRow({
                date: format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR }),
                type: t.type === 'income' ? 'Receita' : 'Despesa',
                category: t.category,
                description: t.description,
                amount: t.amount,
                priority: t.priority || '-',
                source: t.source || '-',
                notes: t.notes || '-'
            });
        });

        // Formatar coluna de valores como moeda
        worksheet.getColumn('amount').numFmt = 'R$ #,##0.00';

        // Colorir linhas por tipo
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Pular cabeçalho
                const type = row.getCell('type').value;
                if (type === 'Receita') {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFDCFCE7' } // Verde claro
                    };
                } else if (type === 'Despesa') {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFECACA' } // Vermelho claro
                    };
                }
            }
        });

        // Adicionar resumo no final
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpenses;

        worksheet.addRow({});
        worksheet.addRow({
            date: 'RESUMO',
            description: 'Total de Receitas',
            amount: totalIncome
        }).font = { bold: true };

        worksheet.addRow({
            date: '',
            description: 'Total de Despesas',
            amount: totalExpenses
        }).font = { bold: true };

        worksheet.addRow({
            date: '',
            description: 'Saldo',
            amount: balance
        }).font = { bold: true, color: { argb: balance >= 0 ? 'FF10B981' : 'FFEF4444' } };

        // Gerar buffer
        const buffer = await workbook.xlsx.writeBuffer();

        console.log('✅ Excel gerado com sucesso');

        return {
            success: true,
            buffer,
            filename: `transacoes_${organization_name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
        };

    } catch (error) {
        console.error('❌ Erro ao exportar para Excel:', error);
        throw error;
    }
}

/**
 * Exporta transações para CSV
 */
async function exportToCSV({ organization_id, organization_name, start_date = null, end_date = null }) {
    try {
        const where = { organization_id };

        if (start_date || end_date) {
            where.date = {};
            if (start_date) where.date.gte = new Date(start_date);
            if (end_date) where.date.lte = new Date(end_date);
        }

        const transactions = await prisma.financialTransaction.findMany({
            where,
            orderBy: { date: 'desc' }
        });

        // Gerar CSV
        const header = 'Data,Tipo,Categoria,Descrição,Valor,Prioridade,Origem,Notas\n';

        const rows = transactions.map(t =>
            [
                format(new Date(t.date), 'dd/MM/yyyy'),
                t.type === 'income' ? 'Receita' : 'Despesa',
                t.category,
                `"${t.description}"`,
                t.amount.toFixed(2),
                t.priority || '-',
                t.source || '-',
                `"${t.notes || '-'}"`
            ].join(',')
        ).join('\n');

        const csv = header + rows;

        return {
            success: true,
            data: csv,
            filename: `transacoes_${organization_name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
        };

    } catch (error) {
        console.error('❌ Erro ao exportar para CSV:', error);
        throw error;
    }
}

module.exports = {
    exportToExcel,
    exportToCSV
};
