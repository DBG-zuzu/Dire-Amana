document.addEventListener('DOMContentLoaded', function() {
  // --- Section Navigation ---
  const menuLinks = document.querySelectorAll('.menu a');
  const sections = {
      dashboard: document.getElementById('dashboardSection'),
      customers: document.getElementById('customersSection'),
      transactions: document.getElementById('transactionsSection'),
      reports: document.getElementById('reportsSection'),
      settings: document.getElementById('settingsSection')
  };

  function showSection(sectionId) {
      Object.values(sections).forEach(section => {
          section.style.display = 'none';
      });
      sections[sectionId].style.display = 'block';
  }

  menuLinks.forEach(link => {
      link.addEventListener('click', function(event) {
          event.preventDefault();
          const sectionId = this.dataset.section;
          showSection(sectionId);
      });
  });

  // Show Dashboard by default
  showSection('dashboard');

  // --- Customer Management ---
  const customerForm = document.getElementById('customerForm');
  const customerNameInput = document.getElementById('customerName');
  const customerContactInput = document.getElementById('customerContact');
  const customerEmailInput = document.getElementById('customerEmail');
  const customerAddressInput = document.getElementById('customerAddress');
  const initialBalanceInput = document.getElementById('initialBalance');
  const registerButton = document.getElementById('registerButton');
  const updateCustomerButton = document.getElementById('updateCustomerButton');
  const cancelEditButton = document.getElementById('cancelEditButton');
  const customerBalanceList = document.getElementById('customerBalanceList');
  const messageDisplay = document.getElementById('message');
  const formTitle = document.getElementById('formTitle');
    const customersSection = document.getElementById('customersSection');

  let customers = JSON.parse(localStorage.getItem('customers')) || [];
  let editingCustomerId = null;

  function displayMessage(message, isError = false) {
      messageDisplay.textContent = message;
      messageDisplay.style.color = isError ? 'red' : 'green';
      messageDisplay.style.display = 'block';
      setTimeout(() => {
          messageDisplay.style.display = 'none';
      }, 3000);
  }

  function updateCustomerListDisplay() {
      customerBalanceList.innerHTML = '';
      customers.forEach(customer => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `
              ${customer.name} - Balance: $${customer.balance.toFixed(2)}
              <button class="edit-btn" data-id="${customer.id}">Edit</button>
              <button class="delete-btn" data-id="${customer.id}">Delete</button>
          `;
          customerBalanceList.appendChild(listItem);
      });
      attachCustomerListEventListeners();
      updateDashboardSummary();
  }

  function attachCustomerListEventListeners() {
      document.querySelectorAll('.edit-btn').forEach(button => {
          button.addEventListener('click', () => {
              const customerId = button.dataset.id;
              populateCustomerForm(customerId);
          });
      });

      document.querySelectorAll('.delete-btn').forEach(button => {
          button.addEventListener('click', () => {
              const customerId = button.dataset.id;
              deleteCustomer(customerId);
          });
      });
  }

  function clearCustomerForm() {
      customerNameInput.value = '';
      customerContactInput.value = '';
      customerEmailInput.value = '';
      customerAddressInput.value = '';
      initialBalanceInput.value = '';
  }

  function populateCustomerForm(customerId) {
      editingCustomerId = customerId;
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
          customerNameInput.value = customer.name;
          customerContactInput.value = customer.contact;
          customerEmailInput.value = customer.email || '';
          customerAddressInput.value = customer.address || '';
          initialBalanceInput.value = customer.balance;

          formTitle.textContent = 'Edit Customer';
          registerButton.style.display = 'none';
          updateCustomerButton.style.display = 'inline-block';
          cancelEditButton.style.display = 'inline-block';
          showSection('customers');
      }
  }

  function registerCustomer() {
      const name = customerNameInput.value;
      const contact = customerContactInput.value;
      const email = customerEmailInput.value;
      const address = customerAddressInput.value;
      const initialBalance = parseFloat(initialBalanceInput.value);

      if (!name || !contact || isNaN(initialBalance)) {
          displayMessage('Please fill in all required fields.', true);
          return;
      }

      const newCustomer = {
          id: 'cust-' + Date.now(),
          name,
          contact,
          email,
          address,
          balance: initialBalance
      };

      customers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(customers));
      displayMessage('Customer registered successfully.');
      clearCustomerForm();
      updateCustomerListDisplay();
  }

  function updateCustomer() {
      if (!editingCustomerId) return;

      const name = customerNameInput.value;
      const contact = customerContactInput.value;
      const email = customerEmailInput.value;
      const address = customerAddressInput.value;
      const balance = parseFloat(initialBalanceInput.value);

      if (!name || !contact || isNaN(balance)) {
          displayMessage('Please fill in all required fields.', true);
          return;
      }

      customers = customers.map(customer => {
          if (customer.id === editingCustomerId) {
              return { ...customer, name, contact, email, address, balance };
          }
          return customer;
      });

      localStorage.setItem('customers', JSON.stringify(customers));
      displayMessage('Customer updated successfully.');
      clearCustomerForm();
      updateCustomerListDisplay();

      // Reset form to register state
      formTitle.textContent = 'Register Customer';
      registerButton.style.display = 'inline-block';
      updateCustomerButton.style.display = 'none';
      cancelEditButton.style.display = 'none';
      editingCustomerId = null;
  }

  function deleteCustomer(customerId) {
      customers = customers.filter(customer => customer.id !== customerId);
      localStorage.setItem('customers', JSON.stringify(customers));
      displayMessage('Customer deleted successfully.');
      updateCustomerListDisplay();
  }

  registerButton.addEventListener('click', registerCustomer);
  updateCustomerButton.addEventListener('click', updateCustomer);
  cancelEditButton.addEventListener('click', () => {
      clearCustomerForm();
      formTitle.textContent = 'Register Customer';
      registerButton.style.display = 'inline-block';
      updateCustomerButton.style.display = 'none';
      cancelEditButton.style.display = 'none';
      editingCustomerId = null;
  });

  // --- Transaction Management ---
  const transactionForm = document.getElementById('transactionForm');
  const transactionCustomerInput = document.getElementById('transactionCustomer');
  const transactionTypeSelect = document.getElementById('transactionType');
  const transactionMethodSelect = document.getElementById('transactionMethod');
  const amountInput = document.getElementById('amount');
  const receiverNameInput = document.getElementById('receiverName');
  const addTransactionButton = document.getElementById('addTransactionButton');
  const transactionTableBody = document.getElementById('transactionTableBody');
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

  function addTransaction() {
      const customerName = transactionCustomerInput.value;
      const type = transactionTypeSelect.value;
      const method = transactionMethodSelect.value;
      const amount = parseFloat(amountInput.value);
      const receiverName = receiverNameInput.value;

       if (!customerName || isNaN(amount) || amount <= 0) {
          displayMessage('Please fill in all required transaction details.', true);
          return;
      }

      // For transfers, ensure receiver name is provided
      if (type === 'Transfer' && !receiverName) {
          displayMessage('Please provide a receiver name for transfers.', true);
          return;
      }

      const customer = customers.find(c => c.name === customerName);
      if (!customer) {
          displayMessage('Customer not found. Please register the customer first.', true);
          return;
      }

      const transaction = {
          id: 'txn-' + Date.now(),
          date: new Date().toLocaleDateString(),
          customerName,
          type,
          method,
          amount,
          receiverName: receiverName || null
      };

      transactions.push(transaction);
      localStorage.setItem('transactions', JSON.stringify(transactions));
      displayMessage('Transaction added successfully.');
      updateTransactionTable();
      updateCustomerBalance(customer, type, amount);
      transactionForm.reset();
  }

  function updateCustomerBalance(customer, type, amount) {
      let updatedBalance = customer.balance;
      if (type === 'Deposit') {
          updatedBalance += amount;
      } else if (type === 'Withdrawal') {
          updatedBalance -= amount;
      } else if (type === 'Transfer') {
          updatedBalance -= amount;
      }

      customers = customers.map(c => {
          if (c.id === customer.id) {
              return { ...c, balance: updatedBalance };
          }
          return c;
      });

      localStorage.setItem('customers', JSON.stringify(customers));
      updateCustomerListDisplay();
      updateDashboardSummary();
  }

  function updateTransactionTable() {
      transactionTableBody.innerHTML = '';
      transactions.forEach(transaction => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${transaction.date}</td>
              <td>${transaction.customerName}</td>
              <td>${transaction.type}</td>
              <td>${transaction.method}</td>
              <td>$${transaction.amount.toFixed(2)}</td>
              <td>${transaction.receiverName || 'N/A'}</td>
          `;
          transactionTableBody.appendChild(row);
      });
  }

  addTransactionButton.addEventListener('click', addTransaction);

  // --- Dashboard Summary ---
  const totalBalanceDisplay = document.getElementById('totalBalance');
  const totalDepositsDisplay = document.getElementById('totalDepositsDashboard');
  const totalWithdrawalsDisplay = document.getElementById('totalWithdrawalsDashboard');
  const totalTransfersDisplay = document.getElementById('totalTransfersDashboard');
  const totalTransactionsDisplay = document.getElementById('totalTransactions');

  function updateDashboardSummary() {
      let totalBalance = 0;
      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let totalTransfers = 0;

      customers.forEach(customer => {
          totalBalance += customer.balance;
      });

      transactions.forEach(transaction => {
          if (transaction.type === 'Deposit') {
              totalDeposits += transaction.amount;
          } else if (transaction.type === 'Withdrawal') {
              totalWithdrawals += transaction.amount;
          } else if (transaction.type === 'Transfer') {
              totalTransfers += transaction.amount;
          }
      });

      totalBalanceDisplay.textContent = '$' + totalBalance.toFixed(2);
      totalDepositsDisplay.textContent = '$' + totalDeposits.toFixed(2);
      totalWithdrawalsDisplay.textContent = '$' + totalWithdrawals.toFixed(2);
      totalTransfersDisplay.textContent = '$' + totalTransfers.toFixed(2);
      totalTransactionsDisplay.textContent = transactions.length;
  }

  // --- Settings ---
  const themeSelect = document.getElementById('theme-select');
  const languageSelect = document.getElementById('language-select');
  const emailNotificationsCheckbox = document.getElementById('email-notifications');
  const saveSettingsButton = document.getElementById('save-settings');

  function loadSettings() {
      const settings = JSON.parse(localStorage.getItem('settings')) || {
          theme: 'light',
          language: 'en',
          emailNotifications: false
      };

      themeSelect.value = settings.theme;
      languageSelect.value = settings.language;
      emailNotificationsCheckbox.checked = settings.emailNotifications;

      document.body.className = settings.theme; // Apply theme
  }

  function saveSettings() {
      const settings = {
          theme: themeSelect.value,
          language: languageSelect.value,
          emailNotifications: emailNotificationsCheckbox.checked
      };

      localStorage.setItem('settings', JSON.stringify(settings));
      displayMessage('Settings saved successfully.');
      loadSettings(); // Reload settings to apply changes
  }

  saveSettingsButton.addEventListener('click', saveSettings);

  // --- Initialize ---
  updateCustomerListDisplay();
  updateTransactionTable();
  updateDashboardSummary();
  loadSettings();

  // --- Search Functionality ---
  const searchInput = document.getElementById('searchInput');
  const searchResultsDiv = document.getElementById('searchResults');
  const dashboardCustomerDetailsSection = document.getElementById('dashboardCustomerDetailsSection');

  searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      if (searchTerm.length < 3) {
          searchResultsDiv.style.display = 'none';
          return;
      }

      const filteredCustomers = customers.filter(customer =>
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.contact.includes(searchTerm)
      );

      displaySearchResults(filteredCustomers);
  });

  function displaySearchResults(results) {
      searchResultsDiv.innerHTML = '';
      if (results.length === 0) {
          searchResultsDiv.innerHTML = '<p>No customers found.</p>';
      } else {
          const list = document.createElement('ul');
          results.forEach(customer => {
              const listItem = document.createElement('li');
              listItem.textContent = `${customer.name} (${customer.contact})`;
              listItem.addEventListener('click', () => {
                  showCustomerDetails(customer.id);
                  searchResultsDiv.style.display = 'none';
                  searchInput.value = '';
              });
              list.appendChild(listItem);
          });
          searchResultsDiv.appendChild(list);
      }
      searchResultsDiv.style.display = 'block';
  }

  function showCustomerDetails(customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
          document.getElementById('dashboardCustomerDetailsName').textContent = customer.name;
          document.getElementById('dashboardCustomerDetailsContact').textContent = customer.contact;
          document.getElementById('dashboardCustomerDetailsEmail').textContent = customer.email || 'N/A';
          document.getElementById('dashboardCustomerDetailsAddress').textContent = customer.address || 'N/A';
          document.getElementById('dashboardCustomerDetailsBalance').textContent = '$' + customer.balance.toFixed(2);

          // Display transaction history
          const transactionHistoryList = document.getElementById('dashboardCustomerDetailsTransactionHistory');
          transactionHistoryList.innerHTML = '';
          const customerTransactions = transactions.filter(t => t.customerName === customer.name);
          customerTransactions.forEach(transaction => {
              const transactionItem = document.createElement('li');
              transactionItem.textContent = `${transaction.date} - ${transaction.type}: $${transaction.amount.toFixed(2)}`;
              transactionHistoryList.appendChild(transactionItem);
          });

          dashboardCustomerDetailsSection.style.display = 'block';
      }
  }

  // Close search results when clicking outside
  document.addEventListener('click', function(event) {
      if (!event.target.closest('.search-bar')) {
          searchResultsDiv.style.display = 'none';
      }
  });

    // Initially hide the update and cancel buttons
    updateCustomerButton.style.display = 'none';
    cancelEditButton.style.display = 'none';
});
