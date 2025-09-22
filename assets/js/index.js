const URL_API = 'http://localhost:5000/';
const carregarListaGastos = async () => {
    return fetch(URL_API + '/gastos', {method: 'GET'})
        .then(res => res.json())
        .then(data => {
            if (data.gastos && data.gastos.length > 0) {
                construirTabelaGastos(data.gastos);
            }
        })
        .catch(err => console.log(err));
}
const format = (valor) => {
    return valor.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});
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

const construirTabelaGastos = (listaGastos) => {
    // elements
    const divContainer = document.querySelector('#table-container');
    const table = document.createElement('table');
    //Criando o cabeçalho da tabela
    construirCabecalhoTabela(table);
    // Construindo o corpo da tabela
    const tbody = document.createElement('tbody');
    listaGastos.forEach((listaGasto) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${listaGasto["categoria_name"]}</td>
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
    addEventBtn('btn_cadastrar', () => {
        window.location.href = 'pages/form.html';
    });
});