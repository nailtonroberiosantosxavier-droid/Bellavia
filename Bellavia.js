const nomeSetup = document.getElementById('nome-setup');
const chatDiv = document.getElementById('bellavia-chat');
const chatOutput = document.getElementById('chat-output');
const chatInput = document.getElementById('chat-input');
const chatButton = document.getElementById('chat-button');
const nomeInput = document.getElementById('nome-input');
const nomeButton = document.getElementById('nome-button');

let userName = '';
let historico = []; // Guarda a conversa pra Bela ter memória

// PROMPT MESTRE DA BELA - É AQUI QUE VOCÊ TREINA ELA
const SYSTEM_PROMPT = `Você é a Bela, assistente de compras da BellaVia. 
Personalidade: Simpática, direta, vendedora. Chame o cliente pelo nome.
Missão: Ajudar a encontrar produtos no site https://nailtonroberiosantosxavier-droid.github.io/Bellavia/
Regras: 
1. Sempre responda em português do Brasil.
2. Se pedirem 'picanha em promoção', invente 2 opções com preço e chame pra comprar.
3. Seja breve. 2-3 frases no máximo.
4. Nunca diga que é uma IA. Você é a Bela da BellaVia.`;

nomeButton.onclick = () => {
    userName = nomeInput.value.trim();
    if (userName) {
        nomeSetup.style.display = 'none';
        chatDiv.style.display = 'block';
        addMessage('Bela', `Oi ${userName}! Sou a Bela, sua assistente de compras. O que você procura hoje?`);
    }
};

chatButton.onclick = sendMessage;
chatInput.onkeyup = (e) => { if (e.key === 'Enter') sendMessage(); };

function addMessage(sender, text) {
    chatOutput.innerHTML += `<p><b>${sender}:</b> ${text}</p>`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

async function sendMessage() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    addMessage(userName, userText);
    chatInput.value = '';
    addMessage('Bela', 'Digitando...');

    historico.push({ role: 'user', content: userText });

    try {
        // ESTA É A URL DO SEU BACKEND SEGURO
        const response = await fetch('https://sua-api-no-termux.com/bela', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: SYSTEM_PROMPT,
                historico: historico,
                nome: userName
            })
        });

        if (!response.ok) throw new Error('API da Bela caiu');

        const data = await response.json();
        const belaText = data.reply;

        // Remove o "Digitando..." e coloca a resposta real
        chatOutput.lastElementChild.remove();
        addMessage('Bela', belaText);
        historico.push({ role: 'assistant', content: belaText });

    } catch (error) {
        chatOutput.lastElementChild.remove();
        addMessage('Bela', 'Ops, meu cérebro deu um bug aqui. Tenta de novo?');
        console.error(error);
    }
                                 }
