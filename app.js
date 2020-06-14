// Budget Controller
var budgetController = (function () {

    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calculatePercentage = function (totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round(this.value / totalIncome * 100);
        } else {
            this.percentage = -1;
        }
    };

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    var data = {
        allItems: {
            expenses: [],
            income: []
        },
        totals: {
            expenses: 0,
            income: 0
        },
        budget: 0,
        percentage: -1
    };

    var calculateTotal = function (type) {
        var sum = 0;

        data.allItems[type].forEach(element => {
            sum += element.value;
        });

        data.totals[type] = sum;
        return sum;
    };

    return {
        addItem: function (type, description, value) {

            var newItem, id;

            //Create new ID
            if (data.allItems[type].length > 0) {
                id = data.allItems[type][data.allItems[type].length - 1].id + 1;
            }
            else { id = 0; }

            // Create new item based on 'income' or 'expenses' type
            if (type === 'income') {
                newItem = new Income(id, description, value);
            } else if (type === 'expenses') {
                newItem = new Expense(id, description, value);
            }

            // Push it into our data structure
            data.allItems[type].push(newItem);

            // Return the new element
            return newItem;
        },

        deleteItem: function (id, type) {
            var index;

            index = data.allItems[type].findIndex(item => item.id === id);
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function () {

            // Calculate total income and expenses
            calculateTotal('income');
            calculateTotal('expenses');

            // Calculate the budget (income - expenses)
            data.budget = data.totals.income - data.totals.expenses;

            // Calculate the percentage of income spent
            if (data.totals.income > 0) {
                data.percentage = data.totals.expenses / data.totals.income;
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function () {
            data.allItems.expenses.forEach(function (current) {
                current.calculatePercentage(data.totals.income);
            })
        },

        getBudget: function () {
            return {
                budget: data.budget,
                totalIncome: data.totals.income,
                totalExpenses: data.totals.expenses,
                percentage: data.percentage
            };
        },

        getPercentages: function () {
            return data.allItems.expenses.map(expense => ({ id: expense.id, percentage: expense.percentage }));
        },

        testing: function () { console.log(data) }
    };

})();

// User Interface Controller
var uiController = (function () {

    var dom = {
        budgetTitleMonth: document.querySelector('.budget__title--month'),
        inputType: document.querySelector('.add__type'),
        inputDescription: document.querySelector('.add__description'),
        inputValue: document.querySelector('.add__value'),
        inputButton: document.querySelector('.add__btn'),
        incomeContainer: document.querySelector('.income__list'),
        expensesContainer: document.querySelector('.expenses__list'),
        budgetValue: document.querySelector('.budget__value'),
        budgetIncomeValue: document.querySelector('.budget__income--value'),
        budgetIncomePercentage: document.querySelector('.budget__income--percentage'),
        budgetExpensesValue: document.querySelector('.budget__expenses--value'),
        budgetExpensesPercentage: document.querySelector('.budget__expenses--percentage'),
        container: document.querySelector('.container')
    }

    return {
        getInput: function () {
            return {
                type: dom.inputType.value, // inc or exp
                description: dom.inputDescription.value,
                value: parseFloat(dom.inputValue.value),
            }
        },

        addListItem: function (object, type) {
            var html, element;

            // Create HTML string with placeholder text
            element = type === 'income' ? dom.incomeContainer : dom.expensesContainer;
            html =
                `<div class="item clearfix" id="${type}-${object.id}">
                    <div class="item__description">${object.description}</div>
                    <div class="right clearfix">
                        <div class="item__value">+ ${this.formatNumber(object.value)}</div>
                        ${type === 'expenses' ? `<div class="item__percentage" data-id="${object.id}" data-type="${type}">${object.percentage}</div>` : ''}
                        <div class="item__delete">
                            <button class="item__delete--btn">
                                <i class="ion-ios-close-outline" data-type="${type}" data-id="${object.id}"></i>
                            </button>
                        </div>
                    </div>
                </div>`;

            // Insert the HTML into the DOM
            element.insertAdjacentHTML('beforeend', html);
        },

        deleteListItem: function (id, type) {
            document.getElementById(`${type}-${id}`).remove();
        },

        clearFields: function () {
            var fields;
            fields = document.querySelectorAll('.add__description, .add__value');
            fields = Array.prototype.slice.call(fields);

            fields.forEach(element => {
                element.value = '';
            });

            dom.inputDescription.focus();
        },

        displayBudget: function (budget) {
            dom.budgetValue.textContent = this.formatNumber(budget.budget);
            dom.budgetExpensesValue.textContent = this.formatNumber(budget.totalExpenses);
            dom.budgetIncomeValue.textContent = this.formatNumber(budget.totalIncome);
            if (budget.percentage > 0) {
                dom.budgetExpensesPercentage.textContent = parseInt(budget.percentage * 100) + '%';
            } else {
                dom.budgetExpensesPercentage.textContent = '--';
            }
        },

        displayPercentages: function (percentages) {
            var percentage;
            percentages.forEach(current => {
                percentage = document.querySelector(`.item__percentage[data-id="${current.id}"][data-type="expenses"]`);
                percentage.textContent = current.percentage + '%';
            });
        },

        displayMonth: function () {
            var now = new Date();
            dom.budgetTitleMonth.textContent = new Intl.DateTimeFormat('en', { month: 'long', literal: ',', year: 'numeric' }).format(now);
        },

        formatNumber: function (number, type) {

            // Plus (+) or minus (-) signals before number
            // Exactly 2 decimal points
            // Thousand separators

            return new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);

        },

        getDOM: function () {
            return dom;
        }
    };

})();

// Global App Controller
var controller = (function (budgetController, uiController) {

    var setupEventListeners = function () {
        var dom = uiController.getDOM();

        dom.inputButton.addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                ctrlAddItem();
            }
        });

        dom.container.addEventListener('click', ctrlDeleteItem);
    };

    var updateBudget = function () {

        // 1. Calculate the budget
        budgetController.calculateBudget();

        // 2. Return the budget
        var budget = budgetController.getBudget();

        // 3. Display the budget on the UI
        uiController.displayBudget(budget);

    };

    var updatePercentages = function () {

        // 1. Calculate the percentages
        budgetController.calculatePercentages();

        // 2. Read percentages from the budget controller
        var percentages = budgetController.getPercentages();
        console.log(percentages);
        // 3. Update the User Interface with the new percentages
        uiController.displayPercentages(percentages);

    };

    var ctrlAddItem = function () {
        var input, newItem;

        // 1. Get the filled input data
        input = uiController.getInput();

        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {

            // 2. Add the item to the budget controller
            newItem = budgetController.addItem(input.type, input.description, input.value);
            budgetController.testing();

            // 3. Add the new item to the UI
            uiController.addListItem(newItem, input.type);

            // 4. Clear the fields
            uiController.clearFields();

            // 5. Calculate and update budget
            updateBudget();

            // 6. Calculate and update percentages
            updatePercentages();
        }

    };

    var ctrlDeleteItem = function (event) {
        var id, type;

        id = parseInt(event.target.dataset.id);
        type = event.target.dataset.type;

        // 1. Delete the item from the data structure
        budgetController.deleteItem(id, type);

        // 2. Delete the item from the UI
        uiController.deleteListItem(id, type);

        // 3. Update and show the new budget
        updateBudget();

        // 4. Calculate and update percentages
        updatePercentages();
    };

    return {
        init: function () {
            console.log('App has started.');
            uiController.displayMonth();
            uiController.displayBudget({
                budget: 0,
                totalIncome: 0,
                totalExpenses: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };

})(budgetController, uiController);


controller.init();