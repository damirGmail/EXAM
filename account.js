let ordersList = []; // Переменная для хранения списка заявок
let totalOrdersPages; // Переменная для хранения количества страниц с заявками
let routesList = []; // Переменная для хранения информации о маршрутах
let selectedOrderId = -1; // Переменная для хранения id выбранной заявки
let selectedGuideId = -1; // Переменная для хранения id выбранного гида
let selectedRouteId = -1; // Переменная для хранения id выбранного маршрута

let modalDelete; // Переменная для хранения модального окна удаления заявки
let modalEdit; // Переменная для хранения модального окна редактирования заявки
let modalView; // Переменная для хранения модального окна просмотра заявки

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

// Функция для получения информации о маршрутах с сервера
async function getRoutesList() {
    const response = await fetch('http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes?api_key=a010fb04-9199-4f07-ab5f-d848a276383b');
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            routesList = data;
            getOrdersList();
        }
    } else {
        showAlert(`Ошибка на сервере!`, 'error');
    }
}

// Функция для получения заявок с сервера
async function getOrdersList() {
    const response = await fetch('http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/orders?api_key=a010fb04-9199-4f07-ab5f-d848a276383b');
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            ordersList = data;
            initOrdersTable(ordersList);
        }
    } else {
        showAlert(`Ошибка на сервере!`, 'error');
    }
}

// Функция для создания таблицы заявок
function initOrdersTable(data) {
    totalOrdersPages = Math.ceil(data.length / 5);

    fillOrdersTable(data, 1);
    updateOrdersTablePagination(1, data);
}

// Функция для заполнения таблицы заявок данными с сервера
function fillOrdersTable(data, currentPage) {
    const start = (currentPage - 1) * 5;
    const end = start + 5;
    const selectedPageData = data.slice(start, end);

    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    selectedPageData.forEach(order => {
        const newRow = tableBody.insertRow();
        newRow.insertCell(0).textContent = order.id;
        const currentRoute = routesList.find(route => route.id === order.route_id);
        newRow.insertCell(1).textContent = currentRoute.name;
        newRow.insertCell(2).textContent = order.date;
        newRow.insertCell(3).textContent = order.price;
        var htmlContent = `
            <div class="actions">
                <a class="btn view-btn" title="Посмотреть"><i class="fas fa-eye"></i></a>
                <a class="btn edit-btn" title="Редактировать"><i class="fas fa-edit"></i></a>
                <a class="btn delete-btn" title="Удалить"><i class="fas fa-trash-o"></i></a>
            </div>
        `;
        const buttonsCell = newRow.insertCell(4);
        buttonsCell.innerHTML = htmlContent;

        // Добавление обработчиков кнопок
        buttonsCell.querySelector('.view-btn').addEventListener('click', function (event) {
            event.preventDefault();
            viewOrder(order.id);
        });
        buttonsCell.querySelector('.edit-btn').addEventListener('click', function (event) {
            event.preventDefault();
            askEditOrder(order.id);
        });
        buttonsCell.querySelector('.delete-btn').addEventListener('click', function (event) {
            event.preventDefault();
            askDeleteOrder(order.id);
        });
    });
}

// Функция для обновления пагинации таблицы заявок
function updateOrdersTablePagination(currentPage, data) {
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
            fillOrdersTable(data, currentPage - 1);
            updateOrdersTablePagination(currentPage - 1, data);
        }
    };
    prevItem.appendChild(prevButton);
    paginationBlock.appendChild(prevItem);

    // Кнопки с номерами страниц
    const start = Math.max(1, currentPage - 3);
    const end = Math.min(totalOrdersPages, currentPage + 3);
    for (let i = start; i <= end; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'page-item' + (i === currentPage ? ' active' : '');
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.textContent = i;
        pageLink.href = '#';
        pageLink.onclick = (event) => {
            event.preventDefault();
            fillOrdersTable(data, i);
            updateOrdersTablePagination(i, data);
        };
        pageItem.appendChild(pageLink);
        paginationBlock.appendChild(pageItem);
    }

    // Кнопка "Далее"
    const nextItem = document.createElement('li');
    nextItem.className = 'page-item' + (currentPage === totalOrdersPages ? ' disabled' : '');
    const nextButton = document.createElement('a');
    nextButton.className = 'page-link';
    nextButton.textContent = 'Далее';
    nextButton.href = '#';
    nextButton.onclick = (event) => {
        event.preventDefault();
        if (currentPage < totalOrdersPages) {
            fillOrdersTable(data, currentPage + 1);
            updateOrdersTablePagination(currentPage + 1, data);
        }
    };
    nextItem.appendChild(nextButton);
    paginationBlock.appendChild(nextItem);
}

// Функция для перехода на первую страницу таблицы заявок
function goToFirstPage() {
    fillOrdersTable(ordersList, 1);
    updateOrdersTablePagination(1, ordersList);
}

// Функция для перехода на последнюю страницу таблицы заявок
function goToLastPage() {
    fillOrdersTable(ordersList, totalOrdersPages);
    updateOrdersTablePagination(totalOrdersPages, ordersList);
}

// Функция для отображения диалогового окна удаления заявки
function askDeleteOrder(orderId) {
    selectedOrderId = orderId;
    modalDelete.show();
}

// Функция для отображения диалогового окна редактирования заявки
function askEditOrder(orderId) {
    selectedOrderId = orderId;
    getOrderInfo("edit");
}

function viewOrder(orderId) {
    selectedOrderId = orderId;
    getOrderInfo("view");
}

// Функция для получения полной информации о заявке с сервера
async function getOrderInfo(mode) {
    let response = await fetch(`http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/orders/${selectedOrderId}?api_key=a010fb04-9199-4f07-ab5f-d848a276383b`);
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            let orderInfo = data;
            let response = await fetch(`http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/guides/${orderInfo.guide_id}?api_key=a010fb04-9199-4f07-ab5f-d848a276383b`);
            if (response.ok) {
                const data = await response.json();
                if (data.error) {
                    showAlert(data.error, 'error');
                } else {
                    let guideInfo = data;
                    fillModalEditWindows(orderInfo, guideInfo, mode);
                }
            } else {
                showAlert(`Ошибка на сервере!`, 'error');
            }
        }
    } else {
        showAlert(`Ошибка на сервере!`, 'error');
    }
}

// Функция для обновления цены учитывая все условия в модальном окне
function updatePrice() {
    const modalElement = document.getElementById('modalEditWindow');
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

// Функция для заполнения модального окна редактирования заявки данными с сервера
function fillModalEditWindows(orderInfo, guideInfo, mode) {
    const currentRoute = routesList.find(route => route.id === orderInfo.route_id);

    // Заполнение модального окна просмотра заявки
    if (mode === "view") {
        document.getElementById('modalViewWindowName').textContent = `Заявка №${orderInfo.id}`;
        document.getElementById('fioView').textContent = guideInfo.name;
        document.getElementById('routeNameView').textContent = currentRoute.name;
        document.getElementById('personView').textContent = orderInfo.persons;
        document.getElementById('durationView').textContent = `${orderInfo.duration} часа`;
        document.getElementById('timeView').textContent = orderInfo.time;
        document.getElementById('dateView').textContent = orderInfo.date;
        const additionalBlock = document.getElementById("optionsBlock");
        additionalBlock.innerHTML = '';
        if (orderInfo.optionFirst) {
            let p = document.createElement("p");
            p.textContent = "Легкие закуски и горячие напитки во время экскурсии. Увеличивают стоимость на 1000 рублей за каждого посетителя.";
            additionalBlock.appendChild(p);
        }
        if (orderInfo.optionSecond) {
            let p = document.createElement("p");
            p.textContent = "Обед. Увеличивает стоимость на 1000 рублей за каждого человека.";
            additionalBlock.appendChild(p);
        }
        if (additionalBlock.innerHTML === '') {
            let p = document.createElement("p");
            p.textContent = "Дополнительных опций не выбрано.";
            additionalBlock.appendChild(p);
        }
        document.querySelector('.final-view-js-price').textContent = orderInfo.price;
        modalView.show();
    } else {
        const fioElement = document.querySelector('.select-js-fio');
        fioElement.textContent = guideInfo.name;

        const routeNameElement = document.querySelector('.select-js-route');
        routeNameElement.textContent = currentRoute.name;

        const priceElement = document.querySelector('.final-js-price');
        priceElement.textContent = orderInfo.price;

        const modalElement = document.getElementById('modalEditWindow');
        modalElement.setAttribute('dataPricePerHour', guideInfo.pricePerHour);

        document.getElementById('peopleInGroup').value = orderInfo.persons;
        document.getElementById('duration').value = orderInfo.duration;
        document.getElementById('time').value = orderInfo.time;
        document.getElementById('date').value = orderInfo.date;
        document.getElementById('checkRoute').checked = orderInfo.optionFirst;
        document.getElementById('checkEat').checked = orderInfo.optionSecond;

        selectedGuideId = guideInfo.id;
        selectedRouteId = currentRoute.id;

        modalEdit.show();
    }
}

// Функция для изменения заявки
async function editOrder() {
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

    const response = await fetch(`http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/orders/${selectedOrderId}?api_key=a010fb04-9199-4f07-ab5f-d848a276383b`, {
        method: 'PUT',
        body: orderData
    });
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            showAlert(`Заявка была успешно изменена!`);
            getOrdersList();
        }
    } else {
        showAlert(`Ошибка на сервере!`, 'error');
    }
    modalEdit.hide();
}

// Функция для удаления заявки
async function deleteOrder() {
    const response = await fetch(`http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/orders/${selectedOrderId}?api_key=a010fb04-9199-4f07-ab5f-d848a276383b`, {
        method: 'DELETE'
    });
    if (response.ok) {
        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            showAlert(`Заявка была успешно удалена!`);
            getOrdersList();
        }
    } else {
        showAlert(`Ошибка на сервере!`, 'error');
    }
    modalDelete.hide();
}

// Функция выполняемая при загрузке страницы
window.onload = async function () {
    modalDelete = new bootstrap.Modal(document.getElementById('modalDeleteWindow')); // Инициализация модального окна удаления заявки
    modalEdit = new bootstrap.Modal(document.getElementById('modalEditWindow')); // Инициализация модального окна редактирования заявки
    modalView = new bootstrap.Modal(document.getElementById('modalViewWindow')); // Инициализация модального окна просмотра заявки
    getRoutesList();
    document.getElementById('firstPageButton').addEventListener('click', goToFirstPage);
    document.getElementById('lastPageButton').addEventListener('click', goToLastPage);
    document.getElementById('date').addEventListener('input', updatePrice);
    document.getElementById('time').addEventListener('input', updatePrice);
    document.getElementById('duration').addEventListener('change', updatePrice);
    document.getElementById('peopleInGroup').addEventListener('change', updatePrice);
    document.getElementById('checkEat').addEventListener('change', updatePrice);
    document.getElementById('checkRoute').addEventListener('change', updatePrice);
    document.querySelector('#modalDeleteWindow .btn-primary').addEventListener('click', deleteOrder);
    document.querySelector('#modalEditWindow .btn-primary').addEventListener('click', editOrder);
}
