document.addEventListener("DOMContentLoaded", () => {
  // Seleciona os elementos da página que vamos usar
  const pedidoInput = document.getElementById("pedidoInput");
  const gerarCupomBtn = document.getElementById("gerarCupomBtn");
  const imprimirBtn = document.getElementById("imprimirBtn");
  const limparBtn = document.getElementById("limparBtn");
  const cupomWrapper = document.getElementById("cupom-wrapper");

  // Adiciona o evento de clique ao botão "Gerar Cupom"
  gerarCupomBtn.addEventListener("click", () => {
    const textoPedido = pedidoInput.value;
    if (textoPedido.trim() === "") {
      alert("Por favor, cole a mensagem do pedido no campo de texto.");
      return;
    }

    // ALTERAÇÃO 1: A variável agora se chama 'resultadoParse' para guardar o objeto completo
    const resultadoParse = parsePedido(textoPedido);

    console.log("Dados Extraídos:", resultadoParse.dados); 

    // ALTERAÇÃO 2: Passamos os dois resultados para a função de renderizar
    renderCupom(resultadoParse.dados, resultadoParse.blocoItensEncontrado);

    // Mostra os botões de imprimir/limpar e a área do cupom
    imprimirBtn.classList.remove("hidden");
    imprimirBtn.disabled = false;
    limparBtn.classList.remove("hidden");
    cupomWrapper.classList.remove("hidden");
  });

  // Adiciona o evento de clique ao botão "Imprimir"
  imprimirBtn.addEventListener("click", () => {
    if (imprimirBtn.disabled) {
      alert("Por favor, gere o cupom antes de imprimir!");
      return;
    }
    window.print();
  });

  // Adiciona o evento de clique ao botão "Limpar"
  limparBtn.addEventListener("click", () => {
    pedidoInput.value = "";
    cupomWrapper.innerHTML = "";
    imprimirBtn.classList.add("hidden");
    imprimirBtn.disabled = true;
    limparBtn.classList.add("hidden");
    cupomWrapper.classList.add("hidden");
  });

  /**
   * Função que lê a mensagem e extrai as informações.
   */
  function parsePedido(texto) {
    let textoLimpo = texto.replace(/\r/g, "").trim();
    const dados = {};
    const extrair = (regex) => (textoLimpo.match(regex) || [])[1] || null;

    dados.cliente = extrair(/\*\s*(?:\S+\s+)?Cliente\s*:\*\s*(.*)/i);
    dados.tipoServico = extrair(/\*\s*(?:\S+\s+)?Tipo de Serviço\s*:\*\s*(.*)/i);
    const matchEndereco = textoLimpo.match(/\*\s*(?:\S+\s+)?Endereço\s*:\s*([\s\S]*?)(?=\n\*\s*(?:\S+\s+)?Bairro|\n\*\s*(?:\S+\s+)?Forma de Pagamento)/mi);
    dados.endereco = matchEndereco ? matchEndereco[1].trim().replace(/\n/g, ", ") : null;
    dados.bairro = extrair(/\*\s*(?:\S+\s+)?Bairro\s*:\*\s*(.*)/i);
    dados.taxaEntrega = extrair(/\*\s*(?:\S+\s+)?Taxa de Entrega\s*:\*\s*(.*)/i);
    dados.formaPagamento = extrair(/\*\s*(?:\S+\s+)?Forma de Pagamento\s*:\*\s*(.*)/i);
    dados.total = extrair(/\*TOTAL DO PEDIDO\s*:\s*(.*)\*/i);

    const blocoItensMatch = textoLimpo.match(/\*\s*(?:\S+\s+)?ITENS DO PEDIDO\s*:\*([\s\S]*?)----/i);
    dados.itens = [];

    if (blocoItensMatch) {
      const blocoItens = blocoItensMatch[1].trim();
      const itensCrus = blocoItens
        .split(/\n\s*\*(?=\s*\d+\.)/)
        .map((item) => item.replace(/^\*/, "").trim());

      itensCrus.forEach((itemCru) => {
        const linhas = itemCru.trim().split("\n");
        if (linhas.length === 0 || linhas[0].trim() === "") return;

        const item = {
          nome: linhas[0].trim(),
          adicionais: [],
          observacoes: [],
        };

        for (let i = 1; i < linhas.length; i++) {
          const linha = linhas[i].trim();
          if (/✏️\s*_Obs:/.test(linha)) {
            item.observacoes.push(linha.replace(/✏️\s*_Obs:/, "").replace(/_/g, "").trim());
          } else if (linha.startsWith("-")) {
            item.adicionais.push(linha.replace("-", "").trim());
          }
        }
        dados.itens.push(item);
      });
    }
    
    // ALTERAÇÃO 3: Retornamos um objeto com os dados E a informação se o bloco de itens foi encontrado
    return {
        dados: dados,
        blocoItensEncontrado: blocoItensMatch !== null
    };
  }

  /**
   * Função que cria o HTML do cupom.
   */
  function renderCupom(dados, blocoItensEncontrado) { // A função agora recebe a informação extra
    const valorTotal = parseFloat(dados.total?.replace("R$", "").replace(",", ".") || 0);
    const valorTaxa = parseFloat(dados.taxaEntrega?.replace("R$", "").replace(",", ".") || 0);
    const subtotal = valorTotal > 0 ? valorTotal - valorTaxa : 0;

    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString("pt-BR");
    const horaFormatada = dataAtual.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let itensHtml = "";
    dados.itens.forEach((item) => {
      itensHtml += `
        <div class="cupom-item">
            <div class="item-principal">
                <span class="item-nome">${item.nome.replace(/\d+\.\s*/, "").replace(/\*/g, "")}</span>
            </div>`;
      if (item.adicionais.length > 0) {
        itensHtml += `<div class="item-detalhes detalhes-adicionais"><strong>+Ad:</strong> ${item.adicionais.join(", ")}</div>`;
      }
      if (item.observacoes.length > 0) {
        itensHtml += `<div class="item-detalhes detalhes-obs"><strong>Obs:</strong> ${item.observacoes.join(", ")}</div>`;
      }
      itensHtml += `</div>`;
    });

    // A lógica de erro agora usa a variável 'blocoItensEncontrado' que foi recebida corretamente
    if(dados.itens.length === 0 && blocoItensEncontrado){
        itensHtml = "<p>Não foi possível extrair os itens.</p><p>Verifique a formatação da mensagem.</p>";
    } else if (dados.itens.length === 0){
        itensHtml = "<p>Nenhum item encontrado na mensagem.</p>";
    }

    const cupomHtml = `
      <div class="cupom">
          <div class="cupom-header">
              <h2>SPACE BURGUER</h2>
              <p>Data: ${dataFormatada} - Hora: ${horaFormatada}</p>
          </div>
          
          <div class="cupom-secao-linha">
              <p><strong>CLIENTE:</strong> ${dados.cliente || "N/A"}</p>
              <p><strong>Serviço:</strong> ${dados.tipoServico || "N/A"}</p>
              <p><strong>Endereço:</strong> ${dados.endereco || "N/A"}</p>
              <p><strong>Bairro:</strong> ${dados.bairro || "N/A"}</p>
              <p><strong>Pag.:</strong> ${dados.formaPagamento || "N/A"}</p>
          </div>

          <div class="cupom-secao-linha cupom-itens">
              ${itensHtml}
          </div>

          <div class="cupom-secao-linha cupom-footer">
              <div class="footer-linha">
                  <span>Subtotal Itens:</span>
                  <span>R$ ${subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div class="footer-linha">
                  <span>Taxa Entrega:</span>
                  <span>${dados.taxaEntrega ? dados.taxaEntrega.replace("R$", "R$ ") : "R$ 0,00"}</span>
              </div>
              <div class="footer-linha total">
                  <span>TOTAL:</span>
                  <span>${dados.total ? dados.total.replace("R$", "R$ ") : "R$ 0,00"}</span>
              </div>
          </div>
          <p class="agradecimento">Obrigado pela preferência!</p>
      </div>`;
    cupomWrapper.innerHTML = cupomHtml;
  }
});