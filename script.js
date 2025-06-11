// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBsSs6TRGAl4gcmiNeZ_UK0TPgZFVh7wzE",
  authDomain: "projetotalentotech-26562.firebaseapp.com",
  projectId: "projetotalentotech-26562",
  storageBucket: "projetotalentotech-26562.appspot.com",
  messagingSenderId: "213367662810",
  appId: "1:213367662810:web:9cb511c717d5265e21dde3",
  measurementId: "G-R4SWXEVMEJ"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Função para gerar dados fictícios de alunas
function gerarAlunaFicticia(id) {
  const nomes = ["Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Juliana"];
  const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes"];
  const motivos = ["Falta de tempo", "Problemas financeiros", "Insatisfação com treino", "Mudança de endereço", "Problemas de saúde", "Falta de resultados"];
  
  const nome = `${nomes[Math.floor(Math.random() * nomes.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
  const probabilidade = Math.floor(Math.random() * 100); // Probabilidade entre 0-100%
  const dias_sem_visitar = Math.floor(Math.random() * 30); // Dias entre 0-30
  const contrato_meses = [6, 12, 24][Math.floor(Math.random() * 3)];
  const feedback = Math.random() > 0.3 ? "sim" : "não";
  const motivo = motivos[Math.floor(Math.random() * motivos.length)];
  const mes_entrada = Math.floor(Math.random() * 12) + 1; // Mês entre 1-12
  const status = Math.random() > 0.7 ? "cancelado" : "ativo";
  const mes_cancelamento = status === "cancelado" ? Math.min(12, mes_entrada + Math.floor(Math.random() * 6)) : null;
  const ultima_presenca = Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000;
  const ultima_aula = new Date(ultima_presenca).toLocaleDateString();
  const vai_evadir = (status === "cancelado" || dias_sem_visitar > 14 || feedback === "não") && Math.random() > 0.2 ? "sim" : "não";
  
  // Gerar ação recomendada baseada nos dados
  let acao = "Monitorar";
  if (dias_sem_visitar > 21 || probabilidade > 80) {
    acao = "Contato urgente";
  } else if (dias_sem_visitar > 14 || probabilidade > 60) {
    acao = "Oferecer incentivo";
  } else if (dias_sem_visitar > 7 || probabilidade > 40) {
    acao = "Enviar lembrete";
  }

  return {
    nome,
    probabilidade,
    dias_sem_visitar,
    contrato_meses,
    feedback,
    motivo,
    genero: "feminino", // Corrigido de "genêro" para "genero"
    id,
    mes_cancelamento,
    mes_entrada,
    status,
    ultima_presenca,
    ultima_aula,
    vai_evadir,
    acao
  };
}

// Função para carregar ou criar as alunas
async function carregarOuCriarAlunas() {
  try {
    const snapshot = await db.collection("alunas").get();
    let alunas = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Garante que todos os campos necessários existam
      const alunaCompleta = {
        ...gerarAlunaFicticia(doc.id), // Usa como base os dados gerados
        ...data // Sobrescreve com os dados do Firebase
      };
      alunas.push(alunaCompleta);
    });
    
    alunas.sort((a, b) => a.id - b.id);
    
    if (alunas.length < 151) {
      const idsExistentes = new Set(alunas.map(a => a.id));
      const idsFaltantes = [];
      
      for (let i = 1; i <= 151; i++) {
        if (!idsExistentes.has(i)) {
          idsFaltantes.push(i);
        }
      }
      
      for (const id of idsFaltantes) {
        const novaAluna = gerarAlunaFicticia(id);
        await db.collection("alunas").doc(id.toString()).set(novaAluna);
        alunas.push(novaAluna);
        console.log(`Aluna com ID ${id} criada no Firebase`);
      }
      
      alunas.sort((a, b) => a.id - b.id);
    }
    
    return alunas;
    
  } catch (error) {
    console.error("Erro ao carregar/criar alunas:", error);
    throw error;
  }
}

function showLoading() {
  const predictionsData = document.getElementById('predictionsData');
  predictionsData.innerHTML = `
    <div class="loading-animation">
      <div class="spinner"></div>
      <p>Carregando dados...</p>
    </div>
  `;
}

function showError(message) {
  const predictionsData = document.getElementById('predictionsData');
  predictionsData.innerHTML = `
    <div class="erro">
      <h4>Erro ao carregar dados</h4>
      <p>${message}</p>
    </div>
  `;
}

// Função para carregar todas as alunas
async function carregarTodasAlunas() {
  showLoading();
  try {
    const alunas = await carregarOuCriarAlunas();
    
    let html = `
      <div class="tabela-container">
        <table class="tabela-previsoes">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Prob. Evasão</th>
              <th>Dias sem visitar</th>
              <th>Motivo</th>
              <th>Nível de Risco</th>
              <th>Última aula</th>
              <th>Ação recomendada</th>
            </tr>
          </thead>
          <tbody>
    `;

    alunas.forEach(aluna => {
      const riscoClass = aluna.vai_evadir === "sim" ? 
        (aluna.probabilidade > 80 ? "risco-critico" : "risco-alto") : 
        (aluna.probabilidade < 30 ? "risco-baixo" : "risco-moderado");
      
      const nivelRisco = aluna.vai_evadir === "sim" ? 
        (aluna.probabilidade > 80 ? "Crítico" : "Alto") : 
        (aluna.probabilidade < 30 ? "Baixo" : "Moderado");
      
      html += `
        <tr>
          <td>${aluna.nome}</td>
          <td>${aluna.probabilidade || 0}%</td>
          <td>${aluna.dias_sem_visitar || 0}</td>
          <td>${aluna.motivo || "Não informado"}</td>
          <td class="${riscoClass}">${nivelRisco}</td>
          <td>${aluna.ultima_aula || "Não registrada"}</td>
          <td>${aluna.acao || "Monitorar"}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('predictionsData').innerHTML = html;
    atualizarGraficoRisco(alunas);
  } catch (error) {
    console.error("Erro ao carregar alunas:", error);
    showError(error.message);
  }
}

// Atualizar função para carregar alunas críticas
async function carregarAlunasCriticas() {
  showLoading();
  try {
    const alunas = await carregarOuCriarAlunas();
    const alunasCriticas = alunas.filter(a => a.probabilidade > 70);

    if (alunasCriticas.length === 0) {
      document.getElementById('predictionsData').innerHTML = `
        <div class="sem-dados">
          <p>Nenhuma aluna em risco crítico encontrada</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="alerta-critico">
        <h3>Alunas em Risco Crítico de Evasão (Probabilidade > 70%)</h3>
        <div class="grid-criticos">
    `;

    alunasCriticas.forEach(aluna => {
      html += `
        <div class="cartao-critico">
          <h4>${aluna.nome}</h4>
          <p><strong>Probabilidade:</strong> ${aluna.probabilidade || 0}%</p>
          <p><strong>Dias sem visitar:</strong> ${aluna.dias_sem_visitar || 0}</p>
          <p><strong>Motivo principal:</strong> ${aluna.motivo || "Não informado"}</p>
          <p><strong>Última aula:</strong> ${aluna.ultima_aula || "Não registrada"}</p>
          <p class="acao">${aluna.acao || "Contato urgente"}</p>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    document.getElementById('predictionsData').innerHTML = html;
  } catch (error) {
    console.error("Erro ao carregar alunas críticas:", error);
    showError(error.message);
  }
}

// Atualizar estatísticas para incluir os novos dados
async function carregarEstatisticas() {
  showLoading();
  try {
    const alunas = await carregarOuCriarAlunas();
    const totalAlunas = alunas.length;
    const ativas = alunas.filter(a => a.status === "ativo").length;
    const canceladas = alunas.filter(a => a.status === "cancelado").length;
    const riscoEvasao = alunas.filter(a => a.vai_evadir === "sim").length;
    const mediaDiasSemVisitar = (alunas.reduce((sum, a) => sum + (a.dias_sem_visitar || 0), 0) / totalAlunas).toFixed(1);
    const mediaProbabilidade = (alunas.reduce((sum, a) => sum + (a.probabilidade || 0), 0) / totalAlunas).toFixed(1);

    document.getElementById('predictionsData').innerHTML = `
      <div class="estatisticas-container">
        <h3>Estatísticas Gerais</h3>
        <div class="grid-estatisticas">
          <div class="box-estatistica">
            <h4>Total de Alunas</h4>
            <p>${totalAlunas}</p>
          </div>
          <div class="box-estatistica">
            <h4>Ativas</h4>
            <p>${ativas} (${((ativas/totalAlunas)*100).toFixed(1)}%)</p>
          </div>
          <div class="box-estatistica">
            <h4>Canceladas</h4>
            <p>${canceladas} (${((canceladas/totalAlunas)*100).toFixed(1)}%)</p>
          </div>
          <div class="box-estatistica">
            <h4>Risco de Evasão</h4>
            <p>${riscoEvasao} (${((riscoEvasao/totalAlunas)*100).toFixed(1)}%)</p>
          </div>
          <div class="box-estatistica">
            <h4>Média Dias Sem Visitar</h4>
            <p>${mediaDiasSemVisitar}</p>
          </div>
          <div class="box-estatistica">
            <h4>Média Probabilidade</h4>
            <p>${mediaProbabilidade}%</p>
          </div>
        </div>
      </div>
    `;

    atualizarGraficoEvasao(alunas);
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error);
    showError(error.message);
  }
}

// Atualizar gráfico de risco para usar as novas categorias
function atualizarGraficoRisco(alunas) {
  const ctx = document.getElementById('graficoRisco').getContext('2d');
  
  const riscoCritico = alunas.filter(a => a.vai_evadir === "sim" && a.probabilidade > 80).length;
  const riscoAlto = alunas.filter(a => a.vai_evadir === "sim" && a.probabilidade <= 80).length;
  const riscoModerado = alunas.filter(a => a.vai_evadir === "não" && a.probabilidade >= 30).length;
  const riscoBaixo = alunas.filter(a => a.vai_evadir === "não" && a.probabilidade < 30).length;
  
  if (window.riscoChart) {
    window.riscoChart.destroy();
  }
  
  window.riscoChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Crítico', 'Alto', 'Moderado', 'Baixo'],
      datasets: [{
        data: [riscoCritico, riscoAlto, riscoModerado, riscoBaixo],
        backgroundColor: [
          '#ff3c3c',
          '#ff8c3c',
          '#ffcc3c',
          '#4CAF50'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Distribuição de Níveis de Risco',
          font: {
            size: 14
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function atualizarGraficoEvasao(alunas) {
  const ctx = document.getElementById('graficoEvasao').getContext('2d');
  
  const meses = Array(12).fill(0).map((_, i) => i + 1);
  const porMes = meses.map(mes => ({
    mes,
    total: alunas.filter(a => a.mes_entrada === mes).length,
    canceladas: alunas.filter(a => a.mes_entrada === mes && a.status === "cancelado").length
  }));
  
  if (window.evasaoChart) {
    window.evasaoChart.destroy();
  }
  
  window.evasaoChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses.map(m => `Mês ${m}`),
      datasets: [
        {
          label: 'Total de Alunas',
          data: porMes.map(m => m.total),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Cancelamentos',
          data: porMes.map(m => m.canceladas),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Evasão por Mês de Entrada',
          font: {
            size: 14
          }
        }
      }
    }
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loadPredictionsBtn')?.addEventListener('click', carregarTodasAlunas);
  document.getElementById('loadCriticalBtn')?.addEventListener('click', carregarAlunasCriticas);
  document.getElementById('loadStatsBtn')?.addEventListener('click', carregarEstatisticas);
  
  carregarTodasAlunas();
});

document.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('.fade-in');
  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    
    if (sectionTop < windowHeight - 100) {
      section.classList.add('visible');
    }
  });
});