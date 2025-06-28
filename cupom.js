document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos da página que vamos usar
    const pedidoInput = document.getElementById('pedidoInput');
    const gerarCupomBtn = document.getElementById('gerarCupomBtn');
    const imprimirBtn = document.getElementById('imprimirBtn');
    const limparBtn = document.getElementById('limparBtn');
    const cupomWrapper = document.getElementById('cupom-wrapper');

    // Adiciona o evento de clique ao botão "Gerar Cupom"
    gerarCupomBtn.addEventListener('click', () => {
        const textoPedido = pedidoInput.value;
        if (textoPedido.trim() === "") {
            alert("Por favor, cole a mensagem do pedido no campo de texto.");
            return;
        }

        const dadosPedido = parsePedido(textoPedido);
        renderCupom(dadosPedido);

        // Mostra os botões de imprimir/limpar e a área do cupom
        imprimirBtn.classList.remove('hidden');
        limparBtn.classList.remove('hidden');
        cupomWrapper.classList.remove('hidden');
    });

    // Adiciona o evento de clique ao botão "Imprimir"
    imprimirBtn.addEventListener('click', () => {
        window.print();
    });
    
    // Adiciona o evento de clique ao botão "Limpar"
    limparBtn.addEventListener('click', () => {
        pedidoInput.value = '';
        cupomWrapper.innerHTML = '';
        imprimirBtn.classList.add('hidden');
        limparBtn.classList.add('hidden');
        cupomWrapper.classList.add('hidden');
    });

    /**
     * Função que "lê" a mensagem e extrai as informações.
     * @param {string} texto - A mensagem completa do WhatsApp.
     * @returns {object} - Um objeto com todos os dados do pedido.
     */
    function parsePedido(texto) {
        const dados = {};
        
        // Funções auxiliares para extrair dados usando Regex
        const extrair = (regex) => (texto.match(regex) || [])[1] || 'N/A';
        
        // Extrai os campos principais
        dados.cliente = extrair(/\* Cliente:\* (.*)/);
        dados.tipoServico = extrair(/\* Tipo de Serviço:\* (.*)/);
        // O endereço pode ter múltiplas linhas, então o regex é mais complexo
        const matchEndereco = texto.match(/\* Endereço:\*([\s\S]*?)\* Bairro/m);
        dados.endereco = matchEndereco ? matchEndereco[1].trim().replace(/\n/g, '<br>') : 'N/A';
        dados.bairro = extrair(/\* Bairro:\* (.*)/);
        dados.taxaEntrega = extrair(/\* Taxa de Entrega:\* (.*)/);
        dados.formaPagamento = extrair(/\* Forma de Pagamento:\* (.*)/);
        dados.total = extrair(/\*TOTAL DO PEDIDO: (.*)\*/);
        dados.observacaoTotal = extrair(/\*TOTAL DO PEDIDO: R\$ \d+\.\d+\* \((.*)\)/);

        // Extrai os itens do pedido
        const blocoItensMatch = texto.match(/\* ITENS DO PEDIDO:\*([\s\S]*?)----/);
        if (blocoItensMatch) {
            const blocoItens = blocoItensMatch[1].trim();
            // Separa os itens principais que começam com "*Número. "
            const itensCrus = blocoItens.split(/\n\*(?=\d\.)/);
            
            dados.itens = itensCrus.map(itemCru => {
                const item = {};
                const linhas = itemCru.replace(/^\*/, '').trim().split('\n');
                item.nome = linhas[0].trim();
                
                // Pega adicionais e observações (linhas que não são o nome)
                item.detalhes = linhas.slice(1).map(detalhe => detalhe.trim()).filter(d => d);
                return item;
            });
        } else {
            dados.itens = [];
        }

        return dados;
    }

    /**
     * Função que cria o HTML do cupom a partir dos dados extraídos.
     * @param {object} dados - O objeto gerado pela função parsePedido.
     */
    function renderCupom(dados) {
        let itensHtml = '';
        dados.itens.forEach(item => {
            let detalhesHtml = '';
            if (item.detalhes.length > 0) {
                detalhesHtml = `<div class="adicionais">${item.detalhes.join('<br>')}</div>`;
            }
            itensHtml += `<li>${item.nome}${detalhesHtml}</li>`;
        });

        const cupomHtml = `
            <div class="cupom">
                <div class="cupom-header">
                    <h2>SPACE BURGUER</h2>
                    <p>CUPOM DE PEDIDO</p>
                    <p>${new Date().toLocaleString('pt-BR')}</p>
                </div>
                
                <div class="cupom-secao">
                    <h3>DADOS DO CLIENTE</h3>
                    <p><strong>Cliente:</strong> ${dados.cliente}</p>
                    <p><strong>Serviço:</strong> ${dados.tipoServico}</p>
                    ${dados.tipoServico === 'Entrega' ? `
                    <p><strong>Endereço:</strong> ${dados.endereco}</p>
                    <p><strong>Bairro:</strong> ${dados.bairro}</p>
                    <p><strong>Taxa:</strong> ${dados.taxaEntrega}</p>
                    ` : ''}
                </div>

                <div class="cupom-secao cupom-itens">
                    <h3>ITENS</h3>
                    <ul>
                        ${itensHtml}
                    </ul>
                </div>

                <div class="cupom-secao">
                    <h3>PAGAMENTO</h3>
                    <p><strong>Forma:</strong> ${dados.formaPagamento}</p>
                    <p class="cupom-total">TOTAL: ${dados.total}</p>
                    <p style="text-align: center; font-size: 0.9em;">(${dados.observacaoTotal})</p>
                </div>
            </div>
        `;

        cupomWrapper.innerHTML = cupomHtml;
    }
});