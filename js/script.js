// Chave de acesso à API
const key = "fca_live_rMwakp88F0k0BVUFVWtwtgUPdd2OEsIASXs0KFna";

// Estado inicial da aplicação
const state = {
  openedDrawer: null, // Menu lateral aberto
  currencies: [], // Lista de moedas disponíveis
  filteredCurrencies: [], // Lista de moedas filtradas
  base: "USD", // Moeda base padrão
  target: "EUR", // Moeda de destino padrão
  rates: {}, // Taxas de câmbio
  baseValue: 1, // Valor base padrão
};

//* Seletores dos elementos da interface
const ui = {
  controls: document.getElementById("controls"),
  drawer: document.getElementById("drawer"),
  dismissBtn: document.getElementById("dismiss-btn"),
  currencyList: document.getElementById("currency-list"),
  searchInput: document.getElementById("search"),
  baseBtn: document.getElementById("base"),
  targetBtn: document.getElementById("target"),
  exchangeRate: document.getElementById("exchange-rate"),
  baseInput: document.getElementById("base-input"),
  targetInput: document.getElementById("target-input"),
  swapBtn: document.getElementById("swap-btn"),
};

//* Event listeners
const setupEventListeners = () => {
  document.addEventListener("DOMContentLoaded", initApp); // Inicialização da aplicação ao carregar a página
  ui.controls.addEventListener("click", showDrawer); // Mostrar o menu lateral ao clicar em um controle
  ui.dismissBtn.addEventListener("click", hideDrawer); // Esconder o menu lateral ao clicar no botão de fechar
  ui.searchInput.addEventListener("input", filterCurrency); // Filtrar as moedas ao digitar no campo de busca
  ui.currencyList.addEventListener("click", selectPair); // Selecionar um par de moedas ao clicar na lista de moedas
  ui.baseInput.addEventListener("change", convertInput); // Converter o valor base ao alterar o valor no campo de entrada
  ui.swapBtn.addEventListener("click", switchPair); // Trocar a moeda base e a moeda de destino ao clicar no botão de troca
};

//* Manipuladores de eventos
const initApp = () => {
  fetchCurrencies(); // Buscar a lista de moedas disponíveis
  fetchExchangeRate(); // Buscar as taxas de câmbio
};

const showDrawer = (e) => {
  if (e.target.hasAttribute("data-drawer")) {
    state.openedDrawer = e.target.id;
    ui.drawer.classList.add("show"); // Adicionar a classe "show" para mostrar o menu lateral
  }
};

const hideDrawer = () => {
  clearSearchInput(); // Limpar o campo de busca
  state.openedDrawer = null; // Fechar o menu lateral
  ui.drawer.classList.remove("show"); // Remover a classe "show" para esconder o menu lateral
};

const filterCurrency = () => {
  const keyword = ui.searchInput.value.trim().toLowerCase();

  // Filtrar as moedas com base no código ou nome
  state.filteredCurrencies = getAvailableCurrencies().filter(
    ({ code, name }) => {
      return (
        code.toLowerCase().includes(keyword) ||
        name.toLowerCase().includes(keyword)
      );
    }
  );

  displayCurrencies(); // Exibir as moedas filtradas na lista
};

const selectPair = (e) => {
  if (e.target.hasAttribute("data-code")) {
    const { openedDrawer } = state;

    // Atualizar a moeda base ou a moeda de destino no estado
    state[openedDrawer] = e.target.dataset.code;

    // Carregar as taxas de câmbio e atualizar os botões
    loadExchangeRate();

    // Fechar o menu lateral após a seleção
    hideDrawer();
  }
};

const convertInput = () => {
  state.baseValue = parseFloat(ui.baseInput.value) || 1; // Converter o valor base para um número
  loadExchangeRate(); // Carregar as taxas de câmbio
};

const switchPair = () => {
  const { base, target } = state;
  state.base = target;
  state.target = base;
  state.baseValue = parseFloat(ui.targetInput.value) || 1;
  loadExchangeRate();
};

//* Funções de renderização
const displayCurrencies = () => {
  ui.currencyList.innerHTML = state.filteredCurrencies
    .map(({ code, name }) => {
      return `
      <li data-code="${code}">
        <img src="${getImageURL(code)}" alt="${name}" />
        <div>
          <h4>${code}</h4>
          <p>${name}</p>
        </div>
      </li>
    `;
    })
    .join("");
};

const displayConversion = () => {
  updateButtons(); // Atualizar os botões de moeda
  updateInputs(); // Atualizar os campos de entrada
  updateExchangeRate(); // Atualizar a taxa de câmbio
};

const showLoading = () => {
  ui.controls.classList.add("skeleton"); // Adicionar a classe 'skeleton' para mostrar o estado de carregamento
  ui.exchangeRate.classList.add("skeleton"); // Adicionar a classe 'skeleton' para mostrar o estado de carregamento
};

const hideLoading = () => {
  ui.controls.classList.remove("skeleton"); // Remover a classe 'skeleton' para esconder o estado de carregamento
  ui.exchangeRate.classList.remove("skeleton"); // Remover a classe 'skeleton' para esconder o estado de carregamento
};

//* Funções auxiliares
const updateButtons = () => {
  [ui.baseBtn, ui.targetBtn].forEach((btn) => {
    const code = state[btn.id];

    btn.textContent = code;
    btn.style.setProperty("--image", `url(${getImageURL(code)})`);
  });
};

const updateInputs = () => {
  const { base, baseValue, target, rates } = state;

  const result = baseValue * rates[base][target];

  ui.targetInput.value = result.toFixed(4);
  ui.baseInput.value = baseValue;
};

const updateExchangeRate = () => {
  const { base, target, rates } = state;

  const rate = rates[base][target].toFixed(4);

  ui.exchangeRate.textContent = `1 ${base} = ${rate} ${target}`;
};

const getAvailableCurrencies = () => {
  return state.currencies.filter(({ code }) => {
    return state.base !== code && state.target !== code;
  });
};

const clearSearchInput = () => {
  ui.searchInput.value = "";
  ui.searchInput.dispatchEvent(new Event("input"));
};

const getImageURL = (code) => {
  const flag =
    "https://wise.com/public-resources/assets/flags/rectangle/{code}.png";

  return flag.replace("{code}", code.toLowerCase());
};

const loadExchangeRate = () => {
  const { base, rates } = state;
  if (typeof rates[base] !== "undefined") {
    // Se as taxas base estiverem no estado, então mostrar
    displayConversion();
  } else {
    // Se não, buscar a taxa de câmbio primeiro
    fetchExchangeRate();
  }
};

//* Funções da API
const fetchCurrencies = () => {
  fetch(`https://api.freecurrencyapi.com/v1/currencies?apikey=${key}`)
    .then((response) => response.json())
    .then(({ data }) => {
      state.currencies = Object.values(data);
      state.filteredCurrencies = getAvailableCurrencies();
      displayCurrencies();
    })
    .catch(console.error);
};

const fetchExchangeRate = () => {
  const { base } = state;

  showLoading();

  fetch(
    `https://api.freecurrencyapi.com/v1/latest?apikey=${key}&base_currency=${base}`
  )
    .then((response) => response.json())
    .then(({ data }) => {
      state.rates[base] = data;
      displayConversion();
    })
    .catch(console.error)
    .finally(hideLoading);
};

//* Inicialização
setupEventListeners();
