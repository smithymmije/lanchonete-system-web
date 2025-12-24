import PixPayload from 'pix-payload';
import QRCode from 'qrcode';

export async function gerarPix(valor) {
    const payload = PixPayload({
        pixKey: 'ejimmysmith@gmail.com', // 🔑 SUA CHAVE PIX
        description: 'Pedido Lanchonete',
        merchantName: 'Lanchonete Online',
        merchantCity: 'SAO PAULO',
        amount: Number(valor).toFixed(2)
    });

    const qrCodeBase64 = await QRCode.toDataURL(payload);

    return {
        copiaCola: payload,
        qrCodeBase64: qrCodeBase64.replace(/^data:image\/png;base64,/, '')
    };
}
