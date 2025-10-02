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

  function parsePedido(texto) {
    // Normalização inicial para reduzir problemas com cópia (whitespace, zero-width, no-break)
    let textoLimpo = texto
      .replace(/\r/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\t/g, " ")
      .replace(/\r\n|\r/g, "\n")
      .replace(/ +/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim();

    const dados = {
      cliente: null,
      tipoServico: null,
      endereco: null,
      numero: null,
      bairro: null,
      taxaEntrega: null,
      formaPagamento: null,
      total: null,
      itens: [],
    };

    const lines = textoLimpo.split(/\n/).map((l) => l.trim());

    const isFieldLine = (ln) => {
      return /\b(Cliente|Tipo de Servi[cç]o|Servi[cç]o|Endere[cç]o|N(?:u|ú)mero|Numero|Bairro|Forma de Pagamento|Taxa de Entrega|ITENS DO PEDIDO|TOTAL)\b/i.test(
        ln
      );
    };

    // Procura campos linha a linha
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l) continue;

      // Cliente
      let m = l.match(/cliente\s*[:\-]?\s*(.*)/i);
      if (m && m[1]) {
        dados.cliente = m[1].trim();
        continue;
      }

      // Tipo de Serviço / Serviço
      m = l.match(/(?:tipo de servi[cç]o|servi[cç]o)\s*[:\-]?\s*(.*)/i);
      if (m && m[1]) {
        dados.tipoServico = m[1].trim();
        continue;
      }

      // Endereço (pode ser multi-linha)
      m = l.match(/endere[cç]o\s*[:\-]?\s*(.*)/i);
      if (m) {
        let addr = (m[1] || "").trim();
        // Se a captura estiver vazia, coleta próximas linhas até encontrar próxima chave
        let j = i + 1;
        while (
          (addr === "" || !addr) &&
          j < lines.length &&
          !isFieldLine(lines[j])
        ) {
          if (lines[j]) addr = (addr ? addr + ", " : "") + lines[j];
          j++;
        }
        // Se o endereço foi parcialmente capturado, mas próxima linha for número, não anexar aqui
        // Caso contrário, tenta também pegar linhas intermediárias que não sejam campos
          // Normalização inicial para reduzir problemas com cópia (whitespace, zero-width, no-break)
        const DEBUG = localStorage.getItem("DEBUG_PARSE") === "1"; // definir no console: localStorage.setItem('DEBUG_PARSE','1')
          let textoLimpo = texto
            .replace(/\r/g, "")
            .replace(/[\u200B-\u200D\uFEFF]/g, "")
            .replace(/\u00A0/g, " ")
            .replace(/\t/g, " ")
            .replace(/\r\n|\r/g, "\n")
            .replace(/ +/g, " ")
            .replace(/\n{2,}/g, "\n")
            .trim();

          const dados = {
            cliente: null,
            tipoServico: null,
            endereco: null,
            numero: null,
            bairro: null,
            taxaEntrega: null,
            formaPagamento: null,
            total: null,
            itens: [],
          };

        const lines = textoLimpo.split(/\n/).map((l) => l.trim());
          // objeto por linha com versão normalizada (remove emojis/bullets no início)
          const linesObjs = lines.map((raw) => ({
            raw,
            norm: raw.replace(/^[^A-Za-z0-9À-ÿ]+/g, "").replace(/ +/g, " ").trim(),
          }));

          if (DEBUG) {
            console.groupCollapsed("parsePedido debug");
            console.log("textoLimpo:", textoLimpo);
            console.log("linesObjs:", linesObjs);
          }

          const isFieldLine = (ln) => {
            return /\b(Cliente|Tipo de Servi[cç]o|Servi[cç]o|Endere[cç]o|N(?:u|ú)mero|Numero|Bairro|Forma de Pagamento|Taxa de Entrega|ITENS DO PEDIDO|TOTAL)\b/i.test(
              ln.norm
            );
          };

          // Procura campos linha a linha usando versão normalizada
          for (let i = 0; i < linesObjs.length; i++) {
            const ln = linesObjs[i];
            if (!ln.raw) continue;
            const n = ln.norm;

            // Cliente
            let m = n.match(/^cliente\s*[:\-]?\s*(.*)/i);
            if (m && m[1]) {
              dados.cliente = m[1].trim() || ln.raw.replace(/^[^A-Za-z0-9À-ÿ]+/g, "").replace(/^cliente\s*[:\-]?\s*/i, "").trim();
              continue;
            }

            // Tipo de Serviço / Serviço
            m = n.match(/^(?:tipo de servi[cç]o|servi[cç]o)\s*[:\-]?\s*(.*)/i);
            if (m && m[1]) {
              dados.tipoServico = m[1].trim();
              continue;
            }

            // Endereço (pode ser multi-linha)
            m = n.match(/^endere[cç]o\s*[:\-]?\s*(.*)/i);
            if (m) {
              let addr = (m[1] || "").trim();
              let j = i + 1;
              while ((addr === "" || !addr) && j < linesObjs.length && !isFieldLine(linesObjs[j])) {
                if (linesObjs[j].raw) addr = (addr ? addr + ", " : "") + linesObjs[j].raw;
                j++;
              }
              if (!addr) {
                j = i + 1;
                while (j < linesObjs.length && !isFieldLine(linesObjs[j])) {
                  if (linesObjs[j].raw) addr = (addr ? addr + ", " : "") + linesObjs[j].raw;
                  j++;
                }
              }
              dados.endereco = addr ? addr.replace(/,\s*,/g, ", ").trim() : null;
              continue;
            }

            // Numero/Número
            m = n.match(/^(?:numero|n(?:u|ú)mero)\s*[:\-]?\s*(.*)/i);
            if (m && m[1]) {
              dados.numero = m[1].trim();
              continue;
            }

            // Bairro
            m = n.match(/^bairro\s*[:\-]?\s*(.*)/i);
            if (m && m[1]) {
              dados.bairro = m[1].trim();
              continue;
            }

            // Taxa de Entrega
            m = n.match(/^taxa de entrega\s*[:\-]?\s*(.*)/i);
            if (m && m[1]) {
              dados.taxaEntrega = m[1].trim();
              continue;
            }

            // Forma de Pagamento
            m = n.match(/^forma de pagamento\s*[:\-]?\s*(.*)/i);
            if (m && m[1]) {
              dados.formaPagamento = m[1].trim();
              continue;
            }

            // TOTAL
            m = n.match(/^total(?: do pedido)?\s*[:\-]?\s*(.*)/i);
            if (m && m[1]) {
              dados.total = m[1].trim();
              continue;
            }
          }

          // Itens: localizar bloco 'ITENS DO PEDIDO' e agrupar por linhas iniciando com número
          let startIdx = linesObjs.findIndex((ln) => /itens do pedido/i.test(ln.norm));
          let blocoItensEncontrado = false;
          if (startIdx >= 0) {
            blocoItensEncontrado = true;
            let endIdx = linesObjs.slice(startIdx + 1).findIndex((ln) => /(^-{3,}|^total\b)/i.test(ln.norm));
            if (endIdx === -1) endIdx = linesObjs.length - (startIdx + 1);
            endIdx = startIdx + 1 + endIdx;
            const bloco = linesObjs.slice(startIdx + 1, endIdx + 1).map((o) => o.raw).filter((l) => l !== "");

            // Parseia itens por linhas que começam com número (ex: '1. Space Salad')
            let currentItem = null;
            const pushCurrent = () => {
              if (currentItem) {
                currentItem.nome = (currentItem.nome || "").trim();
                currentItem.adicionais = (currentItem.adicionais || []).map((s) => s.trim());
                currentItem.observacoes = (currentItem.observacoes || []).map((s) => s.trim());
                dados.itens.push(currentItem);
                currentItem = null;
              }
            };

            bloco.forEach((ln) => {
              const mItem = ln.match(/^\s*(\d+)\.\s*(.*)/);
              if (mItem) {
                pushCurrent();
                currentItem = { nome: mItem[2].trim(), adicionais: [], observacoes: [] };
                return;
              }
              const mObs = ln.match(/(?:obs|observa[cç][aã]o)\s*[:\-]?\s*(.*)/i);
              if (mObs && currentItem) {
                currentItem.observacoes.push(mObs[1].trim());
                return;
              }
              if (/^\s*-\s*/.test(ln) && currentItem) {
                currentItem.adicionais.push(ln.replace(/^\-\s*/, "").trim());
                return;
              }
              if (/adicionais?[:\-]?$/i.test(ln)) return;
              if (!/^\d+\./.test(ln) && currentItem && !/^\-+/.test(ln)) {
                if ((currentItem.adicionais || []).length === 0 && (currentItem.observacoes || []).length === 0) {
                  currentItem.nome += ' ' + ln;
                } else {
                  currentItem.observacoes.push(ln);
                }
                return;
              }
            });
            pushCurrent();
          } else {
            // Fallback: se não tiver cabeçalho, tenta encontrar listas numeradas em todo o texto
            const numberedIdxs = linesObjs.map((o) => o.raw).map((r, idx) => ({ r, idx })).filter((o) => /^\s*\d+\./.test(o.r));
            if (numberedIdxs.length > 0) {
              blocoItensEncontrado = true;
              let currentItem = null;
              const pushCurrent = () => {
                if (currentItem) {
                  currentItem.nome = (currentItem.nome || "").trim();
                  currentItem.adicionais = (currentItem.adicionais || []).map((s) => s.trim());
                  currentItem.observacoes = (currentItem.observacoes || []).map((s) => s.trim());
                  dados.itens.push(currentItem);
                  currentItem = null;
                }
              };
              numberedIdxs.forEach((entry) => {
                const ln = entry.r;
                const mItem = ln.match(/^\s*(\d+)\.\s*(.*)/);
                if (mItem) {
                  pushCurrent();
                  currentItem = { nome: mItem[2].trim(), adicionais: [], observacoes: [] };
                }
              });
              pushCurrent();
            }
          }

          // Se não conseguiu extrair TOTAL, procura por padrão de moeda no texto
          if (!dados.total) {
            const moeda = textoLimpo.match(/R\$\s*[0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})/i) || textoLimpo.match(/[0-9]+[.,][0-9]{2}/);
            if (moeda) dados.total = moeda[0].trim();
          }

          if (DEBUG) {
            console.log("campos extraidos:", {
              cliente: dados.cliente,
              tipoServico: dados.tipoServico,
              endereco: dados.endereco,
              numero: dados.numero,
              bairro: dados.bairro,
              taxaEntrega: dados.taxaEntrega,
              formaPagamento: dados.formaPagamento,
              total: dados.total,
            });
            console.log("itens extraidos:", dados.itens);
            console.groupEnd();
          }

          // Cleanup final: normalizar placeholders
          Object.keys(dados).forEach((k) => {
            if (typeof dados[k] === "string") {
              const v = dados[k].trim();
              if (/^(-+|n\/?n|sem\b|s\.n\.?|nao informado)$/i.test(v)) dados[k] = null;
            }
          });

          return {
            dados: dados,
            blocoItensEncontrado: blocoItensEncontrado,
          };
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
