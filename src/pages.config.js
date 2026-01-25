import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import Goals from './pages/Goals';
import Alerts from './pages/Alerts';
import Budgets from './pages/Budgets';
import TestWhatsApp from './pages/TestWhatsApp';
import Security from './pages/Security';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import KnowledgeBase from './pages/KnowledgeBase';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminSettings from './pages/AdminSettings';
import AdminSupport from './pages/AdminSupport';
import AdminLandingPage from './pages/AdminLandingPage';
import AuthenticatedUsers from './pages/AuthenticatedUsers';
import RecurringExpenses from './pages/RecurringExpenses';
import AdminEmails from './pages/AdminEmails';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizationSettings from './pages/OrganizationSettings';
import AdminPlans from './pages/AdminPlans';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Instances": Instances,
    "Users": Users,
    "Transactions": Transactions,
    "Goals": Goals,
    "Alerts": Alerts,
    "Budgets": Budgets,
    "TestWhatsApp": TestWhatsApp,
    "Security": Security,
    "Landing": Landing,
    "Pricing": Pricing,
    "PaymentSuccess": PaymentSuccess,
    "KnowledgeBase": KnowledgeBase,
    "AdminDashboard": AdminDashboard,
    "AdminUsers": AdminUsers,
    "AdminSubscriptions": AdminSubscriptions,
    "AdminSettings": AdminSettings,
    "AdminSupport": AdminSupport,
    "AdminLandingPage": AdminLandingPage,
    "AuthenticatedUsers": AuthenticatedUsers,
    "RecurringExpenses": RecurringExpenses,
    "AdminEmails": AdminEmails,
    "Login": Login,
    "Register": Register,
    "OrganizationSettings": OrganizationSettings,
    "AdminPlans": AdminPlans,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: Layout,
};