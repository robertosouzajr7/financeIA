/**
 * Pending Confirmations Store
 *
 * Armazena transações pendentes de confirmação do usuário
 */

const pendingConfirmations = new Map();

/**
 * Armazena uma confirmação pendente
 */
function storePendingConfirmation(user_phone, data) {
    pendingConfirmations.set(user_phone, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Busca uma confirmação pendente
 */
function getPendingConfirmation(user_phone) {
    const pending = pendingConfirmations.get(user_phone);

    if (!pending) return null;

    // Expirar após 5 minutos
    if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
        pendingConfirmations.delete(user_phone);
        return null;
    }

    return pending.data;
}

/**
 * Remove uma confirmação pendente
 */
function clearPendingConfirmation(user_phone) {
    pendingConfirmations.delete(user_phone);
}

/**
 * Limpa confirmações expiradas (executar periodicamente)
 */
function cleanExpiredConfirmations() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    for (const [user_phone, pending] of pendingConfirmations.entries()) {
        if (now - pending.timestamp > fiveMinutes) {
            pendingConfirmations.delete(user_phone);
        }
    }
}

// Limpar confirmações expiradas a cada minuto
setInterval(cleanExpiredConfirmations, 60 * 1000);

module.exports = {
    storePendingConfirmation,
    getPendingConfirmation,
    clearPendingConfirmation
};
