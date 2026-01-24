/**
 * Email Service
 *
 * Serviço para envio de emails usando Resend ou Nodemailer
 */

const nodemailer = require('nodemailer');

// Configurar transporter baseado nas variáveis de ambiente
let transporter;

function getTransporter() {
    if (transporter) return transporter;

    // Verificar se está usando Resend
    if (process.env.RESEND_API_KEY) {
        transporter = nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: {
                user: 'resend',
                pass: process.env.RESEND_API_KEY
            }
        });
    }
    // Ou configuração SMTP genérica
    else if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }
    // Fallback: ethereal email (desenvolvimento)
    else {
        console.warn('⚠️  Nenhuma configuração de email encontrada, usando Ethereal (dev only)');
        // Será configurado async na primeira chamada
        return null;
    }

    return transporter;
}

/**
 * Configura transporter para desenvolvimento (Ethereal)
 */
async function setupDevelopmentTransporter() {
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });

    console.log('📧 Email de desenvolvimento configurado (Ethereal)');
    console.log('   Usuário:', testAccount.user);

    return transporter;
}

/**
 * Envia um email
 * @param {Object} options - Opções do email
 * @param {string} options.to - Destinatário
 * @param {string} options.subject - Assunto
 * @param {string} options.html - Conteúdo HTML
 * @param {string} options.text - Conteúdo texto (opcional)
 * @param {string} options.from - Remetente (opcional)
 */
async function sendEmail({ to, subject, html, text = null, from = null }) {
    try {
        let emailTransporter = getTransporter();

        // Se não houver transporter, configurar para desenvolvimento
        if (!emailTransporter) {
            emailTransporter = await setupDevelopmentTransporter();
        }

        const mailOptions = {
            from: from || process.env.EMAIL_FROM || 'noreply@financeia.com',
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Remove HTML tags se não houver texto
        };

        const info = await emailTransporter.sendMail(mailOptions);

        // Se for desenvolvimento (Ethereal), mostrar URL de visualização
        if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
            console.log('📧 Email enviado (dev):');
            console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        console.log('✅ Email enviado:', info.messageId);

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info)
        };

    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        throw error;
    }
}

/**
 * Envia email usando template
 * @param {Object} options - Opções
 * @param {string} options.to - Destinatário
 * @param {string} options.templateName - Nome do template
 * @param {Object} options.variables - Variáveis para substituir no template
 */
async function sendTemplateEmail({ to, templateName, variables }) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        // Buscar template no banco
        const template = await prisma.emailTemplate.findFirst({
            where: {
                category: templateName,
                is_active: true
            }
        });

        if (!template) {
            throw new Error(`Template '${templateName}' não encontrado`);
        }

        // Substituir variáveis no conteúdo
        let content = template.content;
        let subject = template.subject;

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), value);
            subject = subject.replace(new RegExp(placeholder, 'g'), value);
        }

        return await sendEmail({
            to,
            subject,
            html: content
        });

    } catch (error) {
        console.error('❌ Erro ao enviar email com template:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Envia email de boas-vindas
 */
async function sendWelcomeEmail(userEmail, userName) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Bem-vindo ao FinanceIA! 🎉</h1>
            <p>Olá ${userName || 'Usuário'},</p>
            <p>Seja bem-vindo ao FinanceIA, sua ferramenta de gestão financeira pessoal!</p>
            <p>Com o FinanceIA você pode:</p>
            <ul>
                <li>📊 Acompanhar suas receitas e despesas</li>
                <li>🎯 Definir metas financeiras</li>
                <li>💰 Criar orçamentos por categoria</li>
                <li>📱 Gerenciar tudo via WhatsApp</li>
                <li>🤖 Receber insights com IA</li>
            </ul>
            <p>Comece agora mesmo acessando sua conta!</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
            </p>
        </div>
    `;

    return await sendEmail({
        to: userEmail,
        subject: '🎉 Bem-vindo ao FinanceIA!',
        html
    });
}

/**
 * Envia notificação de pagamento aprovado
 */
async function sendPaymentSuccessEmail(userEmail, plan, amount) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">Pagamento Aprovado! ✅</h1>
            <p>Seu pagamento foi processado com sucesso!</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Plano:</strong> ${plan}</p>
                <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
            </div>
            <p>Sua assinatura está ativa e você já pode aproveitar todos os recursos!</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
            </p>
        </div>
    `;

    return await sendEmail({
        to: userEmail,
        subject: '✅ Pagamento Aprovado - FinanceIA',
        html
    });
}

module.exports = {
    sendEmail,
    sendTemplateEmail,
    sendWelcomeEmail,
    sendPaymentSuccessEmail
};
