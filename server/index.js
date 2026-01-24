const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const createCrudRoutes = require('./utils/crud');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');
const transactionRoutes = require('./routes/transactions'); // Custom logic might be needed, but could use CRUD
const functionsRoutes = require('./routes/functions');
const uploadRoutes = require('./routes/upload');
const whatsappInstancesRoutes = require('./routes/whatsapp-instances');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/functions', functionsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/organizations', require('./routes/organizations'));

// CRUD Routes
app.use('/api/transactions', transactionRoutes); // Keep custom if it has specific logic
app.use('/api/users', createCrudRoutes('User')); // Note: User model name in Prisma
app.use('/api/budgets', createCrudRoutes('Budget'));
app.use('/api/goals', createCrudRoutes('Goal'));
app.use('/api/system-settings', createCrudRoutes('SystemSettings'));
app.use('/api/subscriptions', createCrudRoutes('Subscription'));
app.use('/api/knowledge-documents', createCrudRoutes('KnowledgeDocument'));
app.use('/api/alerts', createCrudRoutes('Alert'));
app.use('/api/email-templates', createCrudRoutes('EmailTemplate'));
app.use('/api/recurring-expenses', createCrudRoutes('RecurringExpense'));
app.use('/api/support-tickets', createCrudRoutes('SupportTicket'));
app.use('/api/whatsapp-instances', whatsappInstancesRoutes); // Custom Baileys route
app.use('/api/debts', createCrudRoutes('Debt'));

// Health check
app.get('/', (req, res) => {
  res.send('FinanceIA Backend is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
