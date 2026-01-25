import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticação
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (!isAuthenticated) {
            return Response.json({ 
                success: false,
                error: 'Usuário não autenticado. Faça login primeiro.' 
            }, { status: 401 });
        }

        const user = await base44.auth.me();
        if (!user || !user.email) {
            return Response.json({ 
                success: false,
                error: 'Não foi possível obter os dados do usuário.' 
            }, { status: 401 });
        }

        const { plan } = await req.json();

        if (!['basic', 'pro'].includes(plan)) {
            return Response.json({ 
                success: false,
                error: 'Plano inválido' 
            }, { status: 400 });
        }

        // Buscar ou criar customer no Stripe usando SERVICE ROLE
        let customerId;
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
            user_email: user.email 
        });
        
        if (subscriptions.length > 0 && subscriptions[0].stripe_customer_id) {
            customerId = subscriptions[0].stripe_customer_id;
        } else {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: {
                    user_id: user.id,
                    user_email: user.email
                }
            });
            customerId = customer.id;
        }

        // Criar sessão de checkout
        const priceId = plan === 'basic' 
            ? Deno.env.get('STRIPE_PRICE_ID_BASIC')
            : Deno.env.get('STRIPE_PRICE_ID_PRO');

        if (!priceId) {
            return Response.json({ 
                success: false,
                error: `Price ID não configurado para o plano ${plan}` 
            }, { status: 500 });
        }

        const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://base44.app';
        const appId = Deno.env.get('BASE44_APP_ID');

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            success_url: `${appUrl}/apps/${appId}/pages/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/apps/${appId}/pages/Pricing`,
            metadata: {
                user_email: user.email,
                user_id: user.id,
                plan: plan
            }
        });

        return Response.json({ 
            success: true, 
            checkout_url: session.url,
            session_id: session.id
        });

    } catch (error) {
        console.error('Erro ao criar checkout:', error);
        return Response.json({ 
            success: false, 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});