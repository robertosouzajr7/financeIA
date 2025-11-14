import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filters } = await req.json();

        // Buscar transações
        let transactions = await base44.asServiceRole.entities.FinancialTransaction.list("-date");

        // Aplicar filtros
        if (filters?.type && filters.type !== 'all') {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        if (filters?.category && filters.category !== 'all') {
            transactions = transactions.filter(t => t.category === filters.category);
        }
        if (filters?.user_phone) {
            transactions = transactions.filter(t => t.user_phone === filters.user_phone);
        }

        // Preparar dados para Excel
        const excelData = transactions.map(t => ({
            'Data': new Date(t.date).toLocaleDateString('pt-BR'),
            'Tipo': t.type === 'income' ? 'Receita' : 'Despesa',
            'Descrição': t.description,
            'Valor': t.amount,
            'Categoria': t.category,
            'Telefone': t.user_phone,
            'Recorrente': t.is_recurring ? 'Sim' : 'Não',
            'Prioridade': t.priority || '',
            'Notas': t.notes || ''
        }));

        // Criar workbook e worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 12 }, // Data
            { wch: 10 }, // Tipo
            { wch: 30 }, // Descrição
            { wch: 12 }, // Valor
            { wch: 15 }, // Categoria
            { wch: 15 }, // Telefone
            { wch: 10 }, // Recorrente
            { wch: 12 }, // Prioridade
            { wch: 30 }  // Notas
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Transações');

        // Gerar arquivo Excel
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new Response(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=transacoes_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });

    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});