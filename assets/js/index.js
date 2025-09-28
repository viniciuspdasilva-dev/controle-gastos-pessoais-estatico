const URL_API = 'http://localhost:5000/';
const ERROR_CONSULTAR_API_URL = 'Ocorreu um erro ao consultar dados via API :/';
const ERROR_INCLUIR_NOVO_GASTO = 'Infelizmente não possivel incluir um novo gasto :/';
const ERROR_CONSULTAR_CATEGORIAS = 'Infelizmente, ocorreu um durante o processamento das categorias :/'
const itensPerPage = 5;
let paginaAtual = 1;
let listaCompletaDeGastos = [];
const showLoading = () => {
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('loading-overlay').style.display = 'block';
};
const hideLoading = () => {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('loading-overlay').style.display = 'none';
}
const showAlerts = (message, type = "success", timeout = 5000) => {
    const alertContainer = document.querySelector('#alert-container');
    const icons = {
        success: 'bi-check-circle-fill',
        danger: 'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill'
    }
    const icon = icons[type] || 'bi-info-circle-fill';
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        <i class="bi ${icon} me-2"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => {
        alert.classList.remove('show');
        alert.classList.add('hide');
        setTimeout(() => alert.remove(), 500);
    }, timeout);
}
const tratarErrosApi = (message, err) => {
    console.error(`Error: ${err}`);
    showAlerts(message, 'danger');
}
const carregarListaGastos = async () => {
    showLoading();
    return fetch(URL_API + '/gastos', {method: 'GET'})
        .then(res => res.json())
        .then(data => {
            showAlerts('Carregamento efetuado com sucesso');
            if (data.gastos && data.gastos.length > 0) {
                listaCompletaDeGastos = data.gastos;
                renderizarTabela(paginaAtual);
                construirControlesPagination();
            }
        })
        .catch(err => {
                tratarErrosApi(
                    `${ERROR_CONSULTAR_API_URL} + \n Não foi possivel carregar os gastos do mês`,
                    err
                );
                window.location.href = 'pages/critical-error.html'
            }
        )
        .finally(() => hideLoading());
}
const formatarData = (data) => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}
const carregarRelatorioGastosPerCategoria = async () => {
    showLoading();
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const initialDate = new Date(ano, mes, 1);
    const finalDate = new Date(ano, mes + 1, 0);
    const url = URL_API + '/relatorios/gastos_per_categoria?'
        .concat('initial_date=' + formatarData(initialDate))
        .concat('&final_date=' + formatarData(finalDate));
    return fetch(url, {method: 'GET'})
        .then(res => res.json())
        .then(data => {
            if (data) {
                construirGraficoGastosPerCategoria(data);
            }
        })
        .catch(err => tratarErrosApi(
                `${ERROR_CONSULTAR_API_URL} + \n 
                        Não foi possivel consultar o resumo de gastos por categoria`,
                err
            )
        )
        .finally(() => hideLoading());
}
const carregarCategoriasViaApi = async () => {
    const url = URL_API + '/categorias';
    return fetch(url, {method: 'GET'})
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('categoria');
            select.innerHTML = '<option value="">Selecione uma categoria...</option>';
            if (data.categorias && data.categorias.length > 0) {
                data.categorias.forEach(element => {
                    const option = document.createElement('option');
                    option.value = element.id;
                    option.textContent = element.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(err => tratarErrosApi(`${ERROR_CONSULTAR_CATEGORIAS}`, err));
}

const addNewGasto = async (data) => {
    const url = URL_API + '/gastos';
    return fetch(url, {
        method: 'POST',
        body: data
    })
        .then(res => {
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res.json();
        })
        .then(data => {
            const modal = bootstrap.Modal.getInstance(document.querySelector('#formGastoNovo'));
            document.querySelector('#formCadastro').reset();
            modal.hide();
            showAlerts('O Gasto foi adicionado com sucesso!', 'success');
        })
        .catch(err => tratarErrosApi(`${ERROR_INCLUIR_NOVO_GASTO}`, err));
}

const format = (valor) => {
    return valor.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});
}

const construirGraficoGastosPerCategoria = (data) => {
    const pointDatas = [];
    for (let d of data) {
        pointDatas.push(
            {name: d['categoria_name'], y: d['total']}
        );
    }
    let chart = JSC.chart('chartDiv', {
        debug: true,
        legend_position: 'inside left bottom',
        defaultSeries: {
            type: 'pie',
            pointSelection: true,
        },
        defaultPoint: {
            text: '<b>%name</b>',
            placement: 'auto',
            autoHide: false
        },
        toolbar_items: {
            Mode: {
                margin: 10,
                type: 'select',
                events_change: setMode,
                items: 'enum_placement'
            },
            'Auto Hide': {
                type: 'checkbox',
                events_change: setAutoHide
            }
        },
        title_label_text: 'Categoria x Despesas',
        yAxis: {label_text: 'Categoria', formatString: 'n'},
        series: [{
            name: 'Categoria',
            points: pointDatas,
        }],
    });
};

function setMode(val) {
    chart.options({
        defaultPoint: {label: {placement: val}}
    });
}

function setAutoHide(val) {
    chart.options({
        defaultPoint: {label: {autoHide: val}}
    });
}

function construirCabecalhoTabelaGastos(headers, tr) {
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tr.appendChild(th);
    });
}

function construirCabecalhoTabela(table) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    const headers = ['Categoria', 'Data de Cadastro', 'Descrição', 'Valor  (R$)'];
    construirCabecalhoTabelaGastos(headers, tr);
    thead.appendChild(tr);
    table.appendChild(thead);
}

const escolherBadge = (categoriaName) => {
    switch (categoriaName) {
        case 'Supermercado':
            return 'badge bg-info text-dark';
        case 'Cartões':
            return 'badge bg-danger';
        case 'Restaurante':
            return 'badge bg-warning text-dark';
        case 'Casa':
            return 'badge bg-primary';
        default:
            return 'badge bg-secondary';
    }
};
const construirControlesPagination = () => {
    const totalPaginas = Math.ceil(listaCompletaDeGastos.length / itensPerPage);
    const divPaginacao = document.getElementById('pagination-container');
    divPaginacao.innerHTML = '';
    const btnAnterior = document.createElement('button');
    btnAnterior.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
    btnAnterior.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'me-1');
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.addEventListener('click', e => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarTabela(paginaAtual);
            construirControlesPagination();
        }
    });
    divPaginacao.appendChild(btnAnterior);
    for (let i = 1; i < totalPaginas; i++) {
        const botao = document.createElement('button');
        botao.innerHTML = i;
        botao.classList.add('btn', 'btn-sm', 'btn-outline-primary');
        if (i === paginaAtual) botao.classList.add('active');
        botao.addEventListener('click', () => {
            paginaAtual = i;
            renderizarTabela(paginaAtual);
            construirControlesPagination();
        });
        divPaginacao.appendChild(botao);
    }
    const btnProximo = document.createElement('button');
    btnProximo.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
    btnProximo.classList.add('btn', 'btn-sm', 'btn-outline-secondary');
    btnProximo.disabled = paginaAtual === totalPaginas;
    btnProximo.addEventListener('click', e => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarTabela(paginaAtual);
            construirControlesPagination();
        }
    });
    divPaginacao.appendChild(btnProximo);
};
const renderizarTabela = (pagina) => {
    const inicio = (pagina - 1) * itensPerPage;
    const fim = inicio + itensPerPage;
    const gastosPaginados = listaCompletaDeGastos.slice(inicio, fim);
    construirTabelaGastos(gastosPaginados);
}
const construirTabelaGastos = (listaGastos) => {
    // elements
    const divContainer = document.querySelector('#table-container');
    divContainer.innerHTML = '';
    const table = document.createElement('table');
    //Criando o cabeçalho da tabela
    construirCabecalhoTabela(table);
    // Construindo o corpo da tabela
    const tbody = document.createElement('tbody');
    listaGastos.forEach((listaGasto) => {
        const tr = document.createElement('tr');
        tr.innerHTML = '';
        tr.innerHTML = `
        <td><span class="${escolherBadge(listaGasto["categoria_name"])}">${listaGasto["categoria_name"]}</span></td>
        <td>${listaGasto["data"]}</td>
        <td>${listaGasto["descricao"]}</td>
        <td>${format(listaGasto["valor"])}</td>
      `;
        tbody.appendChild(tr);
    });
    table.classList.add('table', 'table-striped');
    table.appendChild(tbody);

    divContainer.appendChild(table);
};
const addEventBtn = (idBtn, event) => {
    document.getElementById(idBtn).addEventListener('click', event);
}
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página carregada com sucesso!');
    await carregarListaGastos();
    await carregarRelatorioGastosPerCategoria();
    const modal = document.querySelector('#formGastoNovo');
    modal.addEventListener('shown.bs.modal', async (e) => {
        await carregarCategoriasViaApi();
        const form = document.querySelector('#formCadastro');
        form.reset();
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('categoria_id', document.querySelector('#categoria').value);
            formData.append('data', document.querySelector('#date').value);
            formData.append('descricao', document.querySelector('#describe').value);
            formData.append('name', document.querySelector('#name').value);
            formData.append('valor', document.querySelector('#value').value);
            await addNewGasto(formData);
            await carregarRelatorioGastosPerCategoria();
            await carregarListaGastos();
        });
    });
});