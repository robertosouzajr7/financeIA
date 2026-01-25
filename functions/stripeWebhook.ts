import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Validar assinatura do webhook
        const signature = req.headers.get('stripe-signature');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET não configurado');
            return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        const body = await req.text();
        
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Erro ao validar webhook:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        console.log('📨 Webhook recebido:', event.type);

        // Processar evento
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userEmail = session.metadata.user_email;
                const plan = session.metadata.plan;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                // Definir limites do plano
                const limits = plan === 'basic' ? {
                    chatbots: 1,
                    goals: 2,
                    budgets: 5,
                    alerts: 5,
                    transactions: 10,
                    authorized_users: 2
                } : {
                    chatbots: 999999,
                    goals: 999999,
                    budgets: 999999,
                    alerts: 999999,
                    transactions: 999999,
                    authorized_users: 999999
                };

                // Buscar subscription existente
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });
                
                if (existingSubs.length > 0) {
                    // Atualizar
                    await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
                        plan,
                        status: 'active',
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        limits
                    });
                } else {
                    // Criar nova
                    await base44.asServiceRole.entities.Subscription.create({
                        user_email: userEmail,
                        plan,
                        status: 'active',
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        limits
                    });
                }

                console.log(`✅ Assinatura ${plan} ativada para ${userEmail}`);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                // Buscar subscription no banco
                const subs = await base44.asServiceRole.entities.Subscription.filter({ 
                    stripe_customer_id: customerId 
                });

                if (subs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
                        status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                    });
                    console.log(`✅ Subscription atualizada: ${subscription.status}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                const subs = await base44.asServiceRole.entities.Subscription.filter({ 
                    stripe_customer_id: customerId 
                });

                if (subs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
                        status: 'cancelled'
                    });
                    console.log(`❌ Subscription cancelada`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const customerId = invoice.customer;

                const subs = await base44.asServiceRole.entities.Subscription.filter({ 
                    stripe_customer_id: customerId 
                });

                if (subs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
                        status: 'past_due'
                    });
                    console.log(`⚠️ Pagamento falhou`);
                }
                break;
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('Erro no webhook:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});