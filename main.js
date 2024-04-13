let routesList = []; // Переменная для хранения списка маршрутов
let filerRoutesEnabled = false; // Переменная для хранения состояния фильтрации маршрутов
let filteredRoutesList = []; // Переменная для хранения отфильтрованного списка маршрутов
let guidesList = []; // Переменная для хранения списка гидов
let filerGuidesEnabled = false; // Переменная для хранения состояния фильтрации гидов
let filteredGuidesList = []; // Переменная для хранения отфильтрованного списка гидов
let totalRoutesPages; // Переменная для хранения количества страниц с маршрутами
let searchRoutesTimeout; // Переменная для хранения таймаута поиска для задерки начала поиска
let routeNameGlobal; // Переменная для хранения названия маршрута
let selectedRouteId = -1; // Переменная для хранения выбранного маршрута
let currentRoutePage = 1; // Переменная для хранения открытой страницы с маршрутами
let selectedGuideId = -1; // Переменная для хранения выбранного маршрута

let startCoordinates; // Переменная для хранения координат начала маршрута
let endCoordinates; // Переменная для хранения координат конца маршрута
let myMap; // Переменная для хранения объекта карты
let startPlacemark; // Переменная для хранения метки начала маршрута
let currentRoute; // Переменная для хранения маршрута

let modal; // Переменная для хранения модального окна

// Функция для отображения всплывающих уведомлений
function showAlert(msg, category = 'success') {
    let alertsContainer = document.querySelector('.alerts');
    let newAlertElement = document.getElementById('alerts-template').cloneNode(true);
    newAlertElement.querySelector('.msg').innerHTML = msg;
    if (category == 'error') {
        newAlertElement.classList.add('alert-danger');
    } else {
        newAlertElement.classList.add('alert-success');
    }
    newAlertElement.classList.remove('d-none');
    alertsContainer.append(newAlertElement);
    // Если уведомление успешно, закрыть его через 5 секунд
    if (category == 'success') {
        setTimeout(() => {
            newAlertElement.remove();
        }, 5000);
    }
}

// Функция для получения маршрутов с сервера
async function getRoutesList() {
    const response = await fetch('http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes?api_key=a010fb04-9199-4f07-ab5f-d848a276383b');
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            routesList = data;
            initRoutesTable(routesList);
        }
    } else {
        showAlert(`Ошибка на сервере!`, 'error');
    }
}

// Функция для создания таблицы маршрутов
function initRoutesTable(data) {
    totalRoutesPages = Math.ceil(data.length / 10);

    fillRoutesTable(data, 1);
    updateRoutesTablePagination(1, data);
}

// Функция для обрезания текста
function truncateText(text) {
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
}

// Функция для заполнения таблицы маршрутов данными с сервера
function fillRoutesTable(data, currentPage) {
    const start = (currentPage - 1) * 10;
    const end = start + 10;
    const selectedPageData = data.slice(start, end);

    const tableBody = document.getElementById('routesTableBody');
    tableBody.innerHTML = '';

    selectedPageData.forEach(route => {
        const newRow = tableBody.insertRow();
        if (route.id === selectedRouteId) {
            newRow.className = 'table-active';
        }
        newRow.insertCell(0).textContent = route.name;
        newRow.insertCell(1).textContent = truncateText(route.description);
        newRow.insertCell(2).textContent = truncateText(route.mainObject);
        const selectButton = newRow.insertCell(3).appendChild(document.createElement('button'));
        selectButton.textContent = 'Выбрать';
        selectButton.className = 'btn btn-primary';
        selectButton.onclick = () => selectRoute(route.id, route.name);
    });
}

// Функция для обновления пагинации таблицы маршрутов
function updateRoutesTablePagination(currentPage, data) {
    currentRoutePage = currentPage;
    const paginationBlock = document.querySelector('.pagination');
    paginationBlock.innerHTML = '';

    // Кнопка "Назад"
    const prevItem = document.createElement('li');
    prevItem.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
    const prevButton = document.createElement('a');
    prevButton.className = 'page-link';
    prevButton.textContent = 'Назад';
    prevButton.href = '#';
    prevButton.onclick = (event) => {
        event.preventDefault();
        if (currentPage > 1) {
            currentRoutePage = currentPage - 1;
            fillRoutesTable(data, currentPage - 1);
            updateRoutesTablePagination(currentPage - 1, data);
        }
    };
    prevItem.appendChild(prevButton);
    paginationBlock.appendChild(prevItem);

    // Кнопки с номерами страниц
    const start = Math.max(1, currentPage - 3);
    const end = Math.min(totalRoutesPages, currentPage + 3);
    for (let i = start; i <= end; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'page-item' + (i === currentPage ? ' active' : '');
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.textContent = i;
        pageLink.href = '#';
        pageLink.onclick = (event) => {
            event.preventDefault();
            currentRoutePage = i;
            fillRoutesTable(data, i);
            updateRoutesTablePagination(i, data);
        };
        pageItem.appendChild(pageLink);
        paginationBlock.appendChild(pageItem);
    }

    // Кнопка "Далее"
    const nextItem = document.createElement('li');
    nextItem.className = 'page-item' + (currentPage === totalRoutesPages ? ' disabled' : '');
    const nextButton = document.createElement('a');
    nextButton.className = 'page-link';
    nextButton.textContent = 'Далее';
    nextButton.href = '#';
    nextButton.onclick = (event) => {
        event.preventDefault();
        if (currentPage < totalRoutesPages) {
            currentRoutePage = currentPage + 1;
            fillRoutesTable(data, currentPage + 1);
            updateRoutesTablePagination(currentPage + 1, data);
        }
    };
    nextItem.appendChild(nextButton);
    paginationBlock.appendChild(nextItem);
}

// Функция для перехода на первую страницу таблицы маршрутов
function goToFirstPage() {
    currentRoutePage = 1;
    fillRoutesTable(routesList, 1);
    updateRoutesTablePagination(1, routesList);
}

// Функция для перехода на последнюю страницу таблицы маршрутов
function goToLastPage() {
    currentRoutePage = totalRoutesPages;
    fillRoutesTable(routesList, totalRoutesPages);
    updateRoutesTablePagination(totalRoutesPages, routesList);
}

// Функция для поиска маршрутов в таблице по названию
function processSearchInput() {
    const searchText = document.getElementById('search').value.toLowerCase();
    if (searchText.trim() !== '') {
        filerRoutesEnabled = true;
        clearTimeout(searchRoutesTimeout);
        searchRoutesTimeout = setTimeout(() => {
            filteredRoutesList = routesList.filter(item =>
                item.name.toLowerCase().includes(searchText)
            );
            initRoutesTable(filteredRoutesList);
        }, 1000);
    } else {
        clearTimeout(searchRoutesTimeout);
        filerRoutesEnabled = false;
        initRoutesTable(routesList);
    }

}

// Функция для выбора маршрута из таблицы
function selectRoute(routeId, routeName) {
    selectedRouteId = routeId;
    if (filerRoutesEnabled) data = filteredRoutesList;
    else data = routesList;
    filerGuidesEnabled = false;
    selectedGuideId = -1;
    const reserveButtonBlock = document.getElementById('makeReserveBlock');
    reserveButtonBlock.classList.add('d-none');
    fillRoutesTable(data, currentRoutePage);
    updateRouteName(routeName);
    getGuidesByRoute(routeId);

    const selectedRoute = routesList.find(route => route.id === routeId);
    if (selectedRoute && selectedRoute.coords) {
        if (selectedRoute.coords.length >= 3)
            endCoordinates = [selectedRoute.coords[0][1], selectedRoute.coords[0][0]];
        else
            endCoordinates = [selectedRoute.coords[1], selectedRoute.coords[0]];
        buildRoute();
    }

    document.getElementById('giudesTable').classList.remove('d-none');
}

// Функция для обновления названия маршрута в разделе выбора гида
function updateRouteName(routeName) {
    const guideRouteNameElement = document.getElementById('guideRouteName');
    guideRouteNameElement.textContent = `Доступные гиды по маршруту: ${routeName}`;
    routeNameGlobal = routeName;
}

// Функция для заполнения таблицы гидов данными с сервера
function fillGuideTable(data) {
    const tableBody = document.getElementById('guidesTableBody');
    tableBody.innerHTML = '';

    data.forEach(guide => {
        const newRow = tableBody.insertRow();
        if (guide.id === selectedGuideId) {
            newRow.className = 'table-active';
        }
        const profilePhoto = document.createElement('img');
        profilePhoto.src = 'images/ava.jpg';
        profilePhoto.width = 32;
        profilePhoto.height = 32;
        newRow.insertCell(0).appendChild(profilePhoto);
        newRow.insertCell(1).textContent = guide.name;
        newRow.insertCell(2).textContent = guide.language;
        newRow.insertCell(3).textContent = guide.workExperience;
        newRow.insertCell(4).textContent = `${guide.pricePerHour} в час`;
        const selectButton = newRow.insertCell(5).appendChild(document.createElement('button'));
        selectButton.textContent = 'Выбрать';
        selectButton.className = 'btn btn-primary';
        selectButton.onclick = () => selectGuide(guide.id, guide.pricePerHour);
    });
}

// Функция для обновления списка языков в селекторе
function updateLanguageSelector() {
    const languagesUnicue = new Set(guidesList.map(guide => guide.language));
    const languageSelectorElement = document.getElementById('languageSelector');

    languageSelectorElement.innerHTML = '<option value="">Не выбрано</option>';

    languagesUnicue.forEach(language => {
        const selectorOption = document.createElement('option');
        selectorOption.value = language;
        selectorOption.textContent = language;
        languageSelectorElement.appendChild(selectorOption);
    });
}

// Функция для работы фильтров в таблице гидов
function processGuidesFilters() {
    filerGuidesEnabled = true;
    const selectedLanguage = document.getElementById('languageSelector').value;
    const experienceFrom = document.getElementById('experienceFrom').value;
    const experienceTo = document.getElementById('experienceTo').value;

    filteredGuidesList = guidesList.filter(guide => {
        let experienceValid = true;
        if ((guide.workExperience < experienceFrom) && (experienceFrom.trim() !== '')) {
            experienceValid = false;
        }
        if ((guide.workExperience > experienceTo) && (experienceTo.trim() !== '')) {
            experienceValid = false;
        }
        let languageValid = true;
        if ((guide.language !== selectedLanguage) && selectedLanguage) {
            languageValid = false;
        }
        return experienceValid && languageValid;
    });

    fillGuideTable(filteredGuidesList);
}

// Функция для получения списка гидов по маршруту с сервера
async function getGuidesByRoute(routeId) {
    const response = await fetch(`http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes/${routeId}/guides?api_key=a010fb04-9199-4f07-ab5f-d848a276383b`);
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            guidesList = data;
            updateLanguageSelector();
            fillGuideTable(guidesList);
        }
    } else {
        showAlert(`Ошибка на сервере!`, 'error');
    }
}

// Функция для открытия окна создания заявки
function makeReserve(guideId, pricePerHour) {
    const selectedGuide = guidesList.find(guide => guide.id === guideId);

    const fioElement = document.querySelector('.select-js-fio');
    fioElement.textContent = selectedGuide.name;

    const routeNameElement = document.querySelector('.select-js-route');
    routeNameElement.textContent = routeNameGlobal;

    const priceElement = document.querySelector('.final-js-price');
    priceElement.textContent = pricePerHour;

    const modalElement = document.getElementById('modalWindow');
    modalElement.setAttribute('dataPricePerHour', pricePerHour);

    modal.show();
}

// Функция для выбора гида из таблицы
function selectGuide(guideId, pricePerHour) {
    selectedGuideId = guideId;
    if (filerGuidesEnabled) data = filteredGuidesList;
    else data = guidesList;
    fillGuideTable(data);
    const reserveButton = document.getElementById('makeReserve');
    reserveButton.onclick = () => makeReserve(guideId, pricePerHour);
    const reserveButtonBlock = document.getElementById('makeReserveBlock');
    reserveButtonBlock.classList.remove('d-none');
}

// Функция для сброса модального окна
function resetModal() {
    document.getElementById('date').value = '';
    document.getElementById('time').value = '';
    document.getElementById('peopleInGroup').value = '1';
    document.getElementById('duration').value = '1';
    document.getElementById('checkEat').checked = false;
    document.getElementById('checkRoute').checked = false;
}

// Функция для обновления цены учитывая все условия в модальном окне
function updatePrice() {
    const modalElement = document.getElementById('modalWindow');
    const guideServiceCost = modalElement.getAttribute('dataPricePerHour');
    const numberOfVisitors = document.getElementById('peopleInGroup').value;
    const durationInHours = document.getElementById('duration').value;
    const selectedTime = document.getElementById('time').value;
    const selectedHour = parseInt(selectedTime.split(":")[0]);
    const selectedDateValue = document.getElementById('date').value;
    const selectedDate = new Date(selectedDateValue);
    const dayOfWeek = selectedDate.getDay();

    let numberOfVisitorsOverPrice;
    let isThisDayOff;
    let isItMorning;
    let isItEvening;
    let guideOptionOverPrice;
    let eatOptionOverPrice;

    if (numberOfVisitors >= 5 && numberOfVisitors <= 10) numberOfVisitorsOverPrice = 1000;
    else if (numberOfVisitors >= 11 && numberOfVisitors <= 20) numberOfVisitorsOverPrice = 1500;
    else numberOfVisitorsOverPrice = 0;

    if (dayOfWeek === 6 || dayOfWeek === 0) isThisDayOff = 1.5;
    else isThisDayOff = 1;

    if (selectedHour >= 9 && selectedHour < 12) isItMorning = 400;
    else isItMorning = 0;

    if (selectedHour >= 20 && selectedHour < 23) isItEvening = 1000;
    else isItEvening = 0;

    if (document.getElementById('checkRoute').checked) guideOptionOverPrice = 1.5;
    else guideOptionOverPrice = 1;

    if (document.getElementById('checkEat').checked) eatOptionOverPrice = 1000 * numberOfVisitors;
    else eatOptionOverPrice = 0;

    let calculatedPrice = (guideServiceCost * durationInHours * isThisDayOff + 
        numberOfVisitorsOverPrice + isItMorning + isItEvening + 
        eatOptionOverPrice) * guideOptionOverPrice;

    document.querySelector('.final-js-price').textContent = Math.round(calculatedPrice);
}

// Функция для отправки заявки на сервер
async function sendOrderToServer() {
    const numberOfVisitors = document.getElementById('peopleInGroup').value;
    const durationInHours = document.getElementById('duration').value;
    const selectedTime = document.getElementById('time').value;
    const selectedDateValue = document.getElementById('date').value;
    const totalPrice = document.querySelector('.final-js-price').textContent;

    let orderData = new FormData();
    orderData.append("date", selectedDateValue);
    orderData.append("duration", durationInHours);
    orderData.append("guide_id", selectedGuideId);
    orderData.append("optionFirst", document.getElementById('checkRoute').checked ? 1 : 0);
    orderData.append("optionSecond", document.getElementById('checkEat').checked ? 1 : 0);
    orderData.append("persons", numberOfVisitors);
    orderData.append("price", totalPrice);
    orderData.append("route_id", selectedRouteId);
    orderData.append("time", selectedTime);

    const response = await fetch('http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/orders?api_key=', {
        method: "POST",
        body: orderData
    });
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            showAlert('Заявка успешно создана!');
        }
    } else {
        showAlert(`Ошибка при отправке заявки!`, 'error');
    }
    modal.hide();
    resetModal();
}

// Функция выполняемая при загрузке страницы
window.onload = async function () {
    modal = new bootstrap.Modal(document.getElementById('modalWindow')); // Инициализация модального окна
    getRoutesList();
    document.getElementById('search').addEventListener('input', processSearchInput);
    document.getElementById('firstPageButton').addEventListener('click', goToFirstPage);
    document.getElementById('lastPageButton').addEventListener('click', goToLastPage);
    document.getElementById('languageSelector').addEventListener('change', processGuidesFilters);
    document.getElementById('experienceFrom').addEventListener('input', processGuidesFilters);
    document.getElementById('experienceTo').addEventListener('input', processGuidesFilters);
    document.getElementById('date').addEventListener('input', updatePrice);
    document.getElementById('time').addEventListener('input', updatePrice);
    document.getElementById('duration').addEventListener('change', updatePrice);
    document.getElementById('peopleInGroup').addEventListener('change', updatePrice);
    document.getElementById('checkEat').addEventListener('change', updatePrice);
    document.getElementById('checkRoute').addEventListener('change', updatePrice);
    document.getElementById('yandexSearch').addEventListener('click', searchAddress);
    document.querySelector('#modalWindow .btn-primary').addEventListener('click', sendOrderToServer);
}
