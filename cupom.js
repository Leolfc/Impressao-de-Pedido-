document.addEventListener("DOMContentLoaded", () => {
  // Seleciona os elementos da página que vamos usar
  const pedidoInput = document.getElementById("pedidoInput");
  const gerarCupomBtn = document.getElementById("gerarCupomBtn");
  const imprimirBtn = document.getElementById("imprimirBtn");
  const limparBtn = document.getElementById("limparBtn");
  const cupomWrapper = document.getElementById("cupom-wrapper");
  let ultimoDados = null; // guarda os dados do último pedido gerado para impressão

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

    // guarda para impressão no template 58mm
    ultimoDados = resultadoParse.dados;

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
    if (!ultimoDados) {
      alert("Não há dados para imprimir. Gere o cupom primeiro.");
      return;
    }
    imprimirComTemplate58mm(ultimoDados);
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
    // Normalização extra para evitar problemas de colagem do WhatsApp Web
    let textoLimpo = texto
      .replace(/\r/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove caracteres invisíveis (zero-width)
      .replace(/\u00A0/g, " ") // space no-break para evitar problemas de cópia do WhatsApp
      .replace(/\*\s*/g, "* ") // Garante espaço após asterisco
      .replace(/\n{2,}/g, "\n") // Remove quebras de linha duplas
      .replace(/ +/g, " ") // Remove múltiplos espaços
      .trim();
    const dados = {};
    // Regex mais tolerante a variações de espaços e asteriscos
    // Função extratora mais tolerante: aceita linhas com ou sem asteriscos e corta em próximas linhas
    const extrair = (regex) => {
      const m = textoLimpo.match(regex);
      if (!m) return null;
      const v = (m[1] || "").trim();
      // Limpar placeholders comuns copiados do WhatsApp/Edge
      if (
        !v ||
        /^n\/?n$/i.test(v) ||
        /^sem\s+/i.test(v) ||
        /^s\.n\.?$/i.test(v)
      )
        return null;
      return v.replace(/\s+/g, " ");
    };

    // Tenta várias formas: com asterisco, sem asterisco, e linha iniciando com 'Cliente:'
    dados.cliente =
      extrair(
        /\*?\s*Cliente\s*[:\-]?\s*\*?\s*(.*?)(?=\n\*|\n[A-ZÀ-Ÿa-zçÇ]|$)/i
      ) || extrair(/(^|\n)Cliente\s*[:\-]?\s*(.*?)(?=\n|$)/i);
    dados.tipoServico = extrair(/\*\s*Tipo de Servi[cç]o\s*:?\s*\*?\s*(.*)/i);
    // Endereço pode ter múltiplas linhas; às vezes o número está em linha separada
    // Captura desde 'Endereço' até 'Numero'|'Bairro'|'Forma de Pagamento'|'Taxa'|'TOTAL' ou próximo campo
    const matchEndereco = textoLimpo.match(
      /\*?\s*Endere[cç]o\s*[:\-]?\s*\*?\s*([\s\S]*?)(?=\n\*?\s*(Numero|N[uú]mero|Bairro|Forma de Pagamento|Taxa de Entrega|TOTAL)|$)/im
    );
    dados.endereco = matchEndereco
      ? matchEndereco[1]
          .trim()
          .replace(/\n/g, ", ")
          .replace(/,+\s*$/, "")
      : null;
    dados.bairro = extrair(/\*?\s*Bairro\s*[:\-]?\s*\*?\s*(.*)/i);
    // Numero separado (quando existe uma linha 'Numero: 539')
    dados.numero = extrair(/\*?\s*(?:Numero|N[uú]mero)\s*[:\-]?\s*\*?\s*(.*)/i);
    dados.taxaEntrega = extrair(/\*?\s*Taxa de Entrega\s*[:\-]?\s*\*?\s*(.*)/i);
    dados.formaPagamento = extrair(
      /\*?\s*Forma de Pagamento\s*[:\-]?\s*\*?\s*(.*)/i
    );
    // Captura apenas o valor após 'TOTAL' ou 'TOTAL DO PEDIDO'
    dados.total = extrair(/\*?\s*TOTAL(?: DO PEDIDO)?\s*[:\-]?\s*(.*)/i);

    // Itens do pedido
    const blocoItensMatch = textoLimpo.match(
      /\*\s*ITENS DO PEDIDO\s*:?\s*\*?([\s\S]*?)(?=^-{4,}|^\s*\*?\s*TOTAL)/im
    );
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
          const obsRegex =
            /(?:✏️\s*)?_?\s*(Obs|Observa[cç][aã]o(?:es)?)\s*[:\-]\s*/i;
          if (obsRegex.test(linha)) {
            item.observacoes.push(
              linha.replace(obsRegex, "").replace(/_/g, "").trim()
            );
          } else if (linha.startsWith("-")) {
            item.adicionais.push(linha.replace("-", "").trim());
          }
        }
        dados.itens.push(item);
      });
    }
    // Normalizar campos que contenham 'N/N' ou '---' ou 'SEM' como null
    Object.keys(dados).forEach((k) => {
      if (typeof dados[k] === "string") {
        const v = dados[k].trim();
        if (/^(-+|n\/?n|sem|s\.n\.?|nao informado)$/i.test(v)) dados[k] = null;
      }
    });

    return {
      dados: dados,
      blocoItensEncontrado: blocoItensMatch !== null,
    };
  }

  /**
   * Função que cria o HTML do cupom.
   */
  function renderCupom(dados, blocoItensEncontrado) {
    // A função agora recebe a informação extra
    const toFloat = (valorStr) => {
      if (!valorStr) return 0;
      let s = String(valorStr)
        .replace(/[^0-9.,-]/g, "")
        .trim();
      if (!s) return 0;
      const hasComma = s.includes(",");
      const hasDot = s.includes(".");
      if (hasComma && hasDot) {
        if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
          // vírgula é decimal
          s = s.replace(/\./g, "").replace(/,/, ".");
        } else {
          // ponto é decimal
          s = s.replace(/,/g, "");
        }
      } else if (hasComma) {
        // só vírgula presente => vírgula decimal
        s = s.replace(/\./g, "").replace(/,/, ".");
      } else {
        // só ponto ou nenhum
        s = s.replace(/,/g, "");
      }
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    };

    const valorTotal = toFloat(dados.total);
    const valorTaxa = toFloat(dados.taxaEntrega);
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
                <span class="item-nome">${item.nome
                  .replace(/\d+\.\s*/, "")
                  .replace(/\*/g, "")}</span>
            </div>`;
      if (item.adicionais.length > 0) {
        itensHtml += `<div class="item-detalhes detalhes-adicionais"><strong>+Ad:</strong> ${item.adicionais.join(
          ", "
        )}</div>`;
      }
      if (item.observacoes.length > 0) {
        itensHtml += `<div class="item-detalhes detalhes-obs"><strong>Obs:</strong> ${item.observacoes.join(
          ", "
        )}</div>`;
      }
      itensHtml += `</div>`;
    });

    // A lógica de erro agora usa a variável 'blocoItensEncontrado' que foi recebida corretamente
    if (dados.itens.length === 0 && blocoItensEncontrado) {
      itensHtml =
        "<p>Não foi possível extrair os itens.</p><p>Verifique a formatação da mensagem.</p>";
    } else if (dados.itens.length === 0) {
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
              <p><strong>Endereço:</strong> ${
                (dados.endereco || "") +
                  (dados.numero ? ", Nº " + dados.numero : "") || "N/A"
              }</p>
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
                  <span>R$ ${valorTaxa.toFixed(2).replace(".", ",")}</span>
              </div>
              <div class="footer-linha total">
                  <span>TOTAL:</span>
                  <span>R$ ${valorTotal.toFixed(2).replace(".", ",")}</span>
              </div>
          </div>
          <p class="agradecimento">Obrigado pela preferência!</p>
      </div>`;
    cupomWrapper.innerHTML = cupomHtml;
  }

  /**
   * Impressão no template 58mm (janela separada) conforme especificação enviada
   */
  function imprimirComTemplate58mm(dados) {
    const toFloat = (valorStr) => {
      if (!valorStr) return 0;
      let s = String(valorStr)
        .replace(/[^0-9.,-]/g, "")
        .trim();
      if (!s) return 0;
      const hasComma = s.includes(",");
      const hasDot = s.includes(".");
      if (hasComma && hasDot) {
        if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
          s = s.replace(/\./g, "").replace(/,/, ".");
        } else {
          s = s.replace(/,/g, "");
        }
      } else if (hasComma) {
        s = s.replace(/\./g, "").replace(/,/, ".");
      } else {
        s = s.replace(/,/g, "");
      }
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    };

    const formatBRL = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

    const valorTotal = toFloat(dados.total);
    const valorTaxa = toFloat(dados.taxaEntrega);
    const subtotal = valorTotal > 0 ? valorTotal - valorTaxa : 0;

    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString("pt-BR");
    const horaFormatada = dataAtual.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const estilosImpressao = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000 !important; }
      @page { size: 58mm auto; margin: 1mm 1.5mm; }
      body { font-size: 7pt; line-height: 1.15; width: 48mm; background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow-wrap: break-word; }
      .header-impressao { text-align: center; margin-bottom: 2mm; }
      .header-impressao h1 { margin: 0 0 0.5mm 0; font-size: 9.5pt; font-weight: bold; text-transform: uppercase; }
      .header-impressao p { margin: 0.2mm 0; font-size: 6.5pt; }
      .info-pedido { border-top: 0.5px dashed #000; border-bottom: 0.5px dashed #000; padding: 1mm 0; margin-bottom: 2mm; }
      .info-pedido div { margin-bottom: 0.5mm; font-size: 7pt; }
      .info-pedido strong { font-weight: bold; }
      table.itens { width: 100%; border-collapse: collapse; margin-bottom: 2mm; table-layout: fixed; }
      table.itens th, table.itens td { padding: 0.8mm 0.1mm; text-align: left; vertical-align: top; font-size: 7pt; border-bottom: 0.5px dotted #333; }
      table.itens th { font-weight: bold; border-bottom: 0.5px solid #000; font-size: 7.5pt; }
      .col-qtd { width: 8%; text-align: center; }
      .col-item { width: 42%; padding-right: 0.5mm !important; word-break: break-word; }
      .col-sub { width: 50%; text-align: right; white-space: nowrap; font-weight: bold; font-size: 7.5pt; }
      .item-nome-print { font-weight: bold; display: block; font-size: 7.5pt; }
      .detalhes-item-print { font-size: 6pt; padding-left: 0.5mm; display: block; word-break: break-word; }
      .detalhes-item-print.obs { font-size: 7pt; font-style: italic; }
      .detalhes-item-print.obs::before { content: "Obs: "; }
      .detalhes-item-print.ad::before { content: "+Ad: "; font-style: italic; }
      .resumo-financeiro { margin-top: 1mm; padding-top: 1mm; border-top: 0.5px dashed #333; }
      .resumo-financeiro div { display: flex; justify-content: space-between; font-size: 7.5pt; margin-bottom: 0.5mm; }
      .resumo-financeiro span:last-child { text-align: right; white-space: nowrap; font-weight: bold; }
      .total-geral { text-align: right; font-size: 9.5pt; font-weight: bold; margin-top: 1mm; padding-top: 1mm; border-top: 0.5px solid #000; }
      .footer-impressao { text-align: center; font-size: 6.5pt; margin-top: 3mm; border-top: 0.5px dashed #333; padding-top: 1mm; }
    `;

    const safe = (s) => (s == null || s === "" ? "N/A" : s);

    let html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido Space Burguer</title><style>${estilosImpressao}</style></head><body>`;
    html += `<div class="header-impressao"><h1>SPACE BURGUER</h1><p>Data: ${dataFormatada} - Hora: ${horaFormatada}</p></div>`;
    html += `<div class="info-pedido">`;
    html += `<div><strong>Cliente:</strong> ${safe(dados.cliente)}</div>`;
    if (dados.endereco || dados.numero)
      html += `<div><strong>Endereço:</strong> ${safe(dados.endereco)}${
        dados.numero ? " Nº " + safe(dados.numero) : ""
      }</div>`;
    if (dados.tipoServico)
      html += `<div><strong>Serviço:</strong> ${safe(dados.tipoServico)}</div>`;
    if (dados.bairro)
      html += `<div><strong>Bairro:</strong> ${safe(dados.bairro)}</div>`;
    if (dados.formaPagamento)
      html += `<div><strong>Pag.:</strong> ${safe(dados.formaPagamento)}</div>`;
    html += `</div>`;

    html += `<table class="itens"><thead><tr><th class="col-qtd">Qtd</th><th class="col-item">Item/Detalhes</th><th class="col-sub">Valor</th></tr></thead><tbody>`;
    (dados.itens || []).forEach((item) => {
      const nomeLimpo = String(item.nome || "")
        .replace(/\d+\.\s*/, "")
        .replace(/\*/g, "")
        .trim();
      const adicionaisLimpos = (item.adicionais || []).map((ad) =>
        String(ad)
          .replace(/\(\+\s*R\$[^)]*\)/gi, "")
          .trim()
      );
      const obsTexto = (item.observacoes || []).join(", ");
      html += `<tr>`;
      html += `<td class="col-qtd">1</td>`;
      html += `<td class="col-item">`;
      html += `<span class="item-nome-print">${nomeLimpo || "Item"}</span>`;
      if (adicionaisLimpos.length > 0) {
        html += `<span class="detalhes-item-print ad">${adicionaisLimpos.join(
          ", "
        )}</span>`;
      }
      if (obsTexto) {
        html += `<span class="detalhes-item-print obs">${obsTexto}</span>`;
      }
      html += `</td>`;
      html += `<td class="col-sub">&nbsp;</td>`; // sem valor por item
      html += `</tr>`;
    });
    html += `</tbody></table>`;

    html += `<div class="resumo-financeiro">`;
    html += `<div><span>Subtotal Itens:</span><span>${formatBRL(
      subtotal
    )}</span></div>`;
    if (valorTaxa > 0) {
      html += `<div><span>Taxa Entrega:</span><span>${formatBRL(
        valorTaxa
      )}</span></div>`;
    }
    html += `</div>`;

    html += `<div class="total-geral">TOTAL: ${formatBRL(valorTotal)}</div>`;
    html += `<div class="footer-impressao">Obrigado pela preferência!</div>`;
    html += `</body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.error("Erro ao tentar imprimir:", e);
          alert("Erro ao iniciar a impressão. Tente novamente.");
        }
      }, 500);
    } else {
      alert(
        "Não foi possível abrir a janela de impressão. Desative o bloqueador de pop-ups para este site."
      );
    }
  }
});
