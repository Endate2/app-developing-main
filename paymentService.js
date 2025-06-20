// services/paymentService.js
const axios = require('axios');
const process = require('process');

class PaymentService {
    constructor() {
        this.cryptoBotToken = process.env.CRYPTO_BOT_TOKEN;
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    }

    async createCryptoInvoice(amount, duration) {
        try {
            const response = await axios.post(
                'https://testnet-pay.crypt.bot/api/createInvoice',
                {
                    asset: 'TON',
                    amount: amount.toString(),
                    description: `Реклама в канале на ${duration}`,
                    paid_btn_name: 'viewItem',
                    paid_btn_url: 'https://t.me/a1717112',
                    payload: JSON.stringify({
                        channel_id: -1002380608848,
                        duration: duration,
                    }),
                    webhook_url: 'https://a9e1dcfdde5560.lhr.life/api/crypto-pay-webhook',


                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Crypto-Pay-API-Token': this.cryptoBotToken,
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Crypto Bot API error:', error.response?.data || error.message);
            throw new Error('Ошибка при создании платежа');
        }
    }

    async postToChannel() {
        const botToken = this.botToken;
        const channelId = '-1002380608848';
        const message = 'Привет! Это тестовое сообщение после оплаты рекламы.';

        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: channelId,
                    text: message,
                }),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error('Ошибка при публикации сообщения: ' + result.description);
            }

            return result;
        } catch (error) {
            console.error('Ошибка:', error);
            throw new Error('Произошла ошибка при публикации сообщения');
        }
    }
}

module.exports = new PaymentService();