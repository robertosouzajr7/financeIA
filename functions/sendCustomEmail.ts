import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import nodemailer from 'npm:nodemailer@6.9.7';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requestBody = await req.json();
        const { to, subject, body, html, from_name, template_name, variables } = requestBody;

        // Buscar configurações do sistema
        const settingsList = await base44.asServiceRole.entities.SystemSettings.list();
        const settings = settingsList.length > 0 ? settingsList[0] : null;
        const companyName = settings?.company_name || 'FinanceIA';

        let finalSubject = subject;
        let finalHtml = html || body;
        let finalText = body;

        // Se foi especificado um template, buscar e processar
        if (template_name) {
            const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
                name: template_name,
                is_active: true
            });

            if (templates.length === 0) {
                return Response.json({ 
                    error: `Template '${template_name}' não encontrado ou inativo` 
                }, { status: 404 });
            }

            const template = templates[0];
            
            // Substituir variáveis
            const replaceVariables = (text, vars) => {
                if (!text) return '';
                let result = text;
                
                // Variáveis do sistema
                result = result.replace(/\{\{company_name\}\}/g, companyName);
                
                // Variáveis customizadas
                if (vars) {
                    Object.keys(vars).forEach(key => {
                        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                        result = result.replace(regex, vars[key]);
                    });
                }
                
                return result;
            };

            finalSubject = replaceVariables(template.subject, variables);
            
            // Montar email completo com assinatura e rodapé
            finalHtml = `
                ${replaceVariables(template.body_html, variables)}
                ${template.signature ? `<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/><div style="margin-top: 20px;">${replaceVariables(template.signature, variables)}</div>` : ''}
                ${template.footer ? `<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/><div style="margin-top: 20px; font-size: 12px; color: #6b7280;">${replaceVariables(template.footer, variables)}</div>` : ''}
            `;
            
            finalText = replaceVariables(template.body_text || template.body_html, variables);
        }

        if (!to || !finalSubject || (!finalHtml && !finalText)) {
            return Response.json({ 
                error: 'Parâmetros obrigatórios: to, subject, body/html ou template_name' 
            }, { status: 400 });
        }

        // Verificar se deve usar SMTP personalizado
        const useCustomSmtp = settings?.use_custom_smtp && 
                             settings?.smtp_host && 
                             settings?.smtp_port && 
                             settings?.smtp_user && 
                             settings?.smtp_password;

        if (useCustomSmtp) {
            // USAR SMTP PERSONALIZADO (VPS)
            console.log("📧 Enviando via SMTP personalizado...");
            console.log("Host:", settings.smtp_host);
            console.log("Port:", settings.smtp_port);

            const transportConfig = {
                host: settings.smtp_host,
                port: parseInt(settings.smtp_port),
                secure: settings.smtp_secure || parseInt(settings.smtp_port) === 465,
                auth: {
                    user: settings.smtp_user,
                    pass: settings.smtp_password
                },
                tls: {
                    rejectUnauthorized: false
                }
            };

            if (parseInt(settings.smtp_port) === 587 && !settings.smtp_secure) {
                transportConfig.requireTLS = true;
                transportConfig.secure = false;
            }

            const transporter = nodemailer.createTransport(transportConfig);

            try {
                await transporter.verify();
                console.log("✅ Conexão SMTP verificada!");
            } catch (verifyError) {
                console.error("❌ Erro na verificação SMTP:", verifyError);
                return Response.json({
                    success: false,
                    error: `Falha ao conectar ao SMTP: ${verifyError.message}`
                }, { status: 500 });
            }

            const fromAddress = from_name 
                ? `${from_name} <${settings.smtp_user}>` 
                : settings.smtp_user;

            const mailOptions = {
                from: fromAddress,
                to: to,
                subject: finalSubject,
                text: finalText,
                html: finalHtml
            };

            const info = await transporter.sendMail(mailOptions);
            console.log("✅ Email enviado via SMTP! Message ID:", info.messageId);

            return Response.json({
                success: true,
                message: 'Email enviado via SMTP',
                messageId: info.messageId
            });

        } else {
            // USAR INTEGRAÇÃO BASE44
            console.log("📧 Enviando via Base44...");
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: to,
                subject: finalSubject,
                body: finalHtml || finalText,
                from_name: from_name || companyName
            });

            console.log("✅ Email enviado via Base44!");

            return Response.json({
                success: true,
                message: 'Email enviado via Base44'
            });
        }

    } catch (error) {
        console.error("❌ Erro ao enviar email:", error);
        return Response.json({
            success: false,
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});