

//Lembre-se de substituir os placeholders `

const nomeSetup = document.getElementById('nome-setup');
const nomeInput = document.getElementById('nome-input');
const nomeButton = document.getElementById('nome-button');
const chatDiv = document.getElementById('bellavia-chat');
const chatInput = document.getElementById('chat-input');
const chatButton = document.getElementById('chat-button');
const chatOutput = document.getElementById('chat-output');

// IMPORTANTE: Em produção use backend. Nunca deixe token no frontend.
const GITHUB_TOKEN = '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';

let NOME_USER = localStorage.getItem('bellavia_nome') || '';
let PRODUTOS = [];

const PROMPT_SISTEMA = `Você é a BellaVia, assistente de compras simpática. Sessões: Açougue, Mercearia, Hortifrutigranjeiros, Higiene e limpeza. Para buscar produtos responda SÓ com JSON: {"acao":"buscar","sessao":"NOME_SESSAO","filtro":"promocao_ou_estoque","termo":"TERMO"}. Filtro "promocao" = só itens com promocao=sim. Filtro "estoque" = todos os itens. Senão responda texto normal ajudando na escolha.`;

let historico = [{ role: 'system', content: PROMPT_SISTEMA }];

// Carrega CSV
async function carregarCSV() {
  try {
    const res = await fetch('produtos.csv');
    const texto = await res.text();
    const linhas = texto.split('\n').slice(1); // pula header
    PRODUTOS = linhas.filter(l => l.trim()).map(linha => {
      const [sessao, nome, preco, promocao] = linha.split(',');
      return { 
        sessao: sessao.trim(), 
        nome: nome.trim(), 
        preco: parseFloat(preco), 
        promocao: promocao.trim().toLowerCase() === 'sim'
      };
    });
  } catch (e) {
    chatOutput.innerHTML += `<p><b>Erro:</b> Não achei produtos.csv na pasta</p>`;
  }
}

function buscarProdutos(sessao, filtro, termo) {
  termo = termo.toLowerCase();
  sessao = sessao.toLowerCase();
  
  let achados = PRODUTOS.filter(p => 
    p.sessao.toLowerCase().includes(sessao) &&
    p.nome.toLowerCase().includes(termo)
  );
  
  if (filtro === 'promocao') {
    achados = achados.filter(p => p.promocao);
  }
  
  return achados.length
   ? achados.slice(0, 5).map(p => 
       `${p.nome} | R$${p.preco.toFixed(2)} ${p.promocao ? '| PROMOÇÃO' : ''}`
     ).join('\n')
    : 'Nenhum produto encontrado';
}

async function chamarIA() {
  document.title = 'BellaVia: Pensando...';
  
  const res = await fetch('https://models.github.ai/inference/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: historico,
      max_tokens: 1024
    })
  });

  document.title = 'BellaVia - Assistente';
  
  if (!res.ok) throw new Error('Erro API');
  const data = await res.json();
  return data.choices[0].message.content;
}

async function processarMensagem(mensagem) {
  chatOutput.innerHTML += `<p><b>${NOME_USER}:</b> ${mensagem}</p>`;
  historico.push({ role: 'user', content: mensagem });

  try {
    let resposta = await chamarIA();
    historico.push({ role: 'assistant', content: resposta });

    try {
      const json = JSON.parse(resposta);
      if (json.acao === 'buscar') {
        chatOutput.innerHTML += `<p><i>[Buscando]: ${json.sessao} | ${json.filtro}</i></p>`;
        
        const resultado = buscarProdutos(json.sessao, json.filtro, json.termo);
        chatOutput.innerHTML += `<p><b>Resultado:</b><br>${resultado.replace(/\n/g, '<br>')}</p>`;
        
        historico.push({ role: 'user', content: `Resultado:\n${resultado}` });
        resposta = await chamarIA();
        historico.push({ role: 'assistant', content: resposta });
      }
    } catch (e) {}

    chatOutput.innerHTML += `<p><b>BellaVia:</b> ${resposta}</p>`;
    chatOutput.scrollTop = chatOutput.scrollHeight;

  } catch (error) {
    chatOutput.innerHTML += `<p><b>Erro:</b> Verifica o token do GitHub</p>`;
  }
}

// Setup inicial do nome
function iniciarChat() {
  nomeSetup.style.display = 'none';
  chatDiv.style.display = 'block';
  chatOutput.innerHTML = `<p><b>BellaVia:</b> Olá ${NOME_USER}! Sou sua assistente de compras. Temos Açougue, Mercearia, Hortifrutigranjeiros e Higiene e limpeza. Me fala o que procura em promoção ou no estoque :)</p>`;
}

nomeButton.addEventListener('click', () => {
  const nome = nomeInput.value.trim();
  if (!nome) return alert('Digite seu nome');
  NOME_USER = nome;
  localStorage.setItem('bellavia_nome', nome);
  iniciarChat();
});

// Se já tem nome salvo, pula direto pro chat
if (NOME_USER) {
  iniciarChat();
} else {
  nomeSetup.style.display = 'block';
}

chatButton.addEventListener('click', () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  chatInput.value = '';
  processarMensagem(msg);
});

chatInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') chatButton.click();
});

// Carrega produtos ao abrir
carregarCSV();