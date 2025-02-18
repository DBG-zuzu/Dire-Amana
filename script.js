import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { Chart } from 'chart.js/auto';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKbw9qZaki04ohco3ldOMKXPzpCeYYziM",
  authDomain: "amana-app-52e2b.firebaseapp.com",
  projectId: "amana-app-52e2b",
  storageBucket: "amana-app-52e2b.firebasestorage.app",
  messagingSenderId: "1081225568411",
  appId: "1:1081225568411:web:aecc93dc986339c8a4263e",
  measurementId: "G-GRM70VZMGM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Customer Form Elements
const customerForm = document.getElementById('customerForm');
const customerNameInput = document.getElementById('customerName');
const customerContactInput = document.getElementById('customerContact');
const customerEmailInput = document.getElementById('customerEmail');
const customerAddressInput = document.getElementById('customerAddress');
const initialBalanceInput = document.getElementById('initialBalance');
const registerButton = document.getElementById('registerButton');
const updateCustomerButton = document.getElementById('updateCustomerButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const formTitle = document.getElementById('formTitle');
const messageDisplay = document.getElementById('message');

// Customer Balance Section Elements
const searchInput = document.getElementById('searchInput');
const searchResultsDiv = document.getElementById('searchResults');
const customerNameDisplay = document.getElementById('customerNameDisplay');
const customerBalanceDisplay = document.getElementById('customerBalanceDisplay');
const lastTransactionDisplay = document.getElementById('lastTransactionDisplay'); // Corrected ID
const editCustomerButton = document.getElementById('editCustomerButton');
const clearDataButton = document.getElementById('clearDataButton');
const viewHistoryButton = document.getElementById('viewHistoryButton');
const customerBalanceList = document.getElementById('customerBalanceList');

// Transaction Form Elements
const transactionForm = document.getElementById('transactionForm');
const transactionCustomerInput = document.getElementById('transactionCustomer');
const transactionTypeSelect = document.getElementById('transactionType');
const transactionMethodSelect = document.getElementById('transactionMethod');
const amountInput = document.getElementById('amount');
const receiverNameInput = document.getElementById('receiverName');
const addTransactionButton = document.getElementById('addTransactionButton');

// Transaction List Elements
const transactionTableBody = document.getElementById('transactionTableBody');

// Transaction History Section Elements
const transactionHistorySection = document.getElementById('transactionHistorySection');
const transactionHistoryList = document.getElementById('transactionHistoryList');
const hideHistoryButton = document.getElementById('hideHistoryButton');

// Report Section Elements
const totalBalanceDisplay = document.getElementById('totalBalance');
const unpaidOrdersDisplay = document.getElementById('unpaidOrders');
const totalTransactionsDisplay = document.getElementById('totalTransactions');
const totalDepositsDisplay = document.getElementById('totalDeposits');
const totalWithdrawalsDisplay = document.getElementById('totalWithdrawals');
const totalTransfersDisplay = document.getElementById('totalTransfers');
const transactionChartCanvas = document.getElementById('transactionChart');
let transactionChart;

// Order Form Elements
const orderForm = document.getElementById('orderForm');
const supplierNameInput = document.getElementById('supplierName');
const orderTypeSelect = document.getElementById('orderType');
const orderAmountInput = document.getElementById('orderAmount');
const orderRateInput = document.getElementById('orderRate');
const paidAmountInput = document.getElementById('paidAmount');
const addOrderButton = document.getElementById('addOrderButton');

// Menu Elements
const menuLinks = document.querySelectorAll('.menu a');
const dashboardSection = document.getElementById('dashboardSection');
const customersSection = document.getElementById('customersSection');
const transactionsSection = document.getElementById('transactionsSection');
const reportsSection = document.getElementById('reportsSection');
const settingsSection = document.getElementById('settingsSection');

// Settings Elements
const themeSelect = document.getElementById('theme-select');
const languageSelect = document.getElementById('language-select');
const emailNotificationsCheckbox = document.getElementById('email-notifications');
const saveSettingsButton = document.getElementById('save-settings');

let currentCustomerId = null;
let customers = [];
let transactions = [];

// Helper function to display messages
function displayMessage(message, isError = false) {
  messageDisplay.textContent = message;
  messageDisplay.style.color = isError ? 'red' : 'green';
  messageDisplay.style.display = 'block';
  setTimeout(() => {
    messageDisplay.style.display = 'none';
  }, 3000); // Message disappears after 3 seconds
}

// Function to clear the customer form
function clearCustomerForm() {
  customerNameInput.value = '';
  customerContactInput.value = '';
  customerEmailInput.value = '';
  customerAddressInput.value = '';
  initialBalanceInput.value = '';
}

// Function to clear the transaction form
function clearTransactionForm() {
  transactionCustomerInput.value = '';
  transactionTypeSelect.value = 'Deposit';
  transactionMethodSelect.value = 'Cash';
  amountInput.value = '';
  receiverNameInput.value = '';
}

// Function to calculate total balance
function calculateTotalBalance() {
  let total = 0;
  customers.forEach(customer => {
    total += parseFloat(customer.balance);
  });
  totalBalanceDisplay.textContent = '$' + total.toFixed(2);
}

// Function to calculate total transactions
function calculateTotalTransactions() {
  totalTransactionsDisplay.textContent = transactions.length;
}

// Function to update customer balances list
function updateCustomerBalancesList() {
  customerBalanceList.innerHTML = '';
  customers.forEach(customer => {
    const listItem = document.createElement('li');
    listItem.textContent = `${customer.name}: $${customer.balance.toFixed(2)}`;
    customerBalanceList.appendChild(listItem);
  });
}

// Function to update transaction chart
function updateTransactionChart() {
  const deposits = transactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
  const withdrawals = transactions.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
  const transfers = transactions.filter(t => t.type === 'Transfer').reduce((sum, t) => sum + t.amount, 0);

  if (transactionChart) {
    transactionChart.destroy();
  }

  transactionChart = new Chart(transactionChartCanvas, {
    type: 'bar',
    data: {
      labels: ['Deposits', 'Withdrawals', 'Transfers'],
      datasets: [{
        label: 'Amount ($)',
        data: [deposits, withdrawals, transfers],
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 205, 86, 0.2)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
          'rgb(255, 205, 86)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  totalDepositsDisplay.textContent = '$' + deposits.toFixed(2);
  totalWithdrawalsDisplay.textContent = '$' + withdrawals.toFixed(2);
  totalTransfersDisplay.textContent = '$' + transfers.toFixed(2);
}

// Function to fetch customers from Firebase
async function fetchCustomers() {
  const customersCollection = collection(db, 'customers');
  const customersSnapshot = await getDocs(customersCollection);
  customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  updateCustomerBalancesList();
  calculateTotalBalance();
}

// Function to fetch transactions from Firebase
async function fetchTransactions() {
  const transactionsCollection = collection(db, 'transactions');
  const transactionsSnapshot = await getDocs(transactionsCollection);
  transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  populateTransactionTable();
  updateTransactionChart();
  calculateTotalTransactions();
}

// Function to register a new customer
async function registerCustomer() {
  const customerName = customerNameInput.value;
  const customerContact = customerContactInput.value;
  const customerEmail = customerEmailInput.value;
  const customerAddress = customerAddressInput.value;
  const initialBalance = parseFloat(initialBalanceInput.value);

  if (!customerName || !customerContact || isNaN(initialBalance)) {
    displayMessage('Please fill in all required fields.', true);
    return;
  }

  // Check if customer already exists
  const existingCustomer = customers.find(
    (customer) =>
      customer.name === customerName || customer.contact === customerContact
  );

  if (existingCustomer) {
    displayMessage('Customer with this name or contact already exists.', true);
    return;
  }

  try {
    const customersCollection = collection(db, 'customers');
    await addDoc(customersCollection, {
      name: customerName,
      contact: customerContact,
      email: customerEmail,
      address: customerAddress,
      balance: initialBalance
    });

    displayMessage('Customer registered successfully!');
    clearCustomerForm();
    await fetchCustomers(); // Refresh customer list
    calculateTotalBalance(); // Recalculate total balance
  } catch (error) {
    console.error('Error registering customer:', error);
    displayMessage('Error registering customer.', true);
  }
}

// Function to populate the transaction table
function populateTransactionTable() {
  transactionTableBody.innerHTML = '';
  transactions.forEach(transaction => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(transaction.date).toLocaleDateString()}</td>
      <td>${transaction.customer}</td>
      <td>${transaction.type}</td>
      <td>${transaction.method}</td>
      <td>$${transaction.amount.toFixed(2)}</td>
      <td>${transaction.receiver || 'N/A'}</td>
    `;
    transactionTableBody.appendChild(row);
  });
}

// Function to add a new transaction
async function addTransaction() {
  const transactionCustomer = transactionCustomerInput.value;
  const transactionType = transactionTypeSelect.value;
  const transactionMethod = transactionMethodSelect.value;
  const amount = parseFloat(amountInput.value);
  const receiverName = receiverNameInput.value;

  if (!transactionCustomer || isNaN(amount)) {
    displayMessage('Please fill in all transaction details.', true);
    return;
  }

  if (transactionType === 'Transfer') {
    if (!receiverName) {
      displayMessage('Please provide a receiver name for transfers.', true);
      return;
    }

    // Find the sender and receiver customers
    const senderCustomer = customers.find(c => c.name === transactionCustomer);
    const receiverCustomer = customers.find(c => c.name === receiverName);

    if (!senderCustomer) {
      displayMessage('Sender customer not found.', true);
      return;
    }

    if (!receiverCustomer) {
      displayMessage('Receiver customer not found.', true);
      return;
    }

    if (senderCustomer.balance < amount) {
      displayMessage('Insufficient balance for the transfer.', true);
      return;
    }

    try {
      // Update sender's balance
      const senderNewBalance = senderCustomer.balance - amount;
      const senderDocRef = doc(db, 'customers', senderCustomer.id);
      await updateDoc(senderDocRef, { balance: senderNewBalance });

      // Update receiver's balance
      const receiverNewBalance = receiverCustomer.balance + amount;
      const receiverDocRef = doc(db, 'customers', receiverCustomer.id);
      await updateDoc(receiverDocRef, { balance: receiverNewBalance });

      // Add transaction to the transaction collection
      const transactionsCollection = collection(db, 'transactions');
      await addDoc(transactionsCollection, {
        customer: transactionCustomer,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName,
        date: new Date().getTime()
      });

      displayMessage('Transaction added successfully!');
      clearTransactionForm();
      await fetchTransactions(); // Refresh transaction list
      await fetchCustomers(); // Refresh customer list
      displayCustomerDetails(senderCustomer.id); // Refresh displayed customer details
    } catch (error) {
      console.error('Error adding transaction:', error);
      displayMessage('Error adding transaction.', true);
    }
  } else {
    try {
      const transactionsCollection = collection(db, 'transactions');
      await addDoc(transactionsCollection, {
        customer: transactionCustomer,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName,
        date: new Date().getTime()
      });

      displayMessage('Transaction added successfully!');
      clearTransactionForm();
      await fetchTransactions(); // Refresh transaction list
      await updateCustomerBalance(transactionCustomer, transactionType, amount); // Update customer balance
    } catch (error) {
      console.error('Error adding transaction:', error);
      displayMessage('Error adding transaction.', true);
    }
  }
}

// Function to update customer balance after a transaction
async function updateCustomerBalance(customerName, transactionType, amount) {
  const customer = customers.find(c => c.name === customerName);
  if (!customer) {
    displayMessage('Customer not found.', true);
    return;
  }

  let newBalance = parseFloat(customer.balance);
  if (transactionType === 'Deposit') {
    newBalance += amount;
  } else if (transactionType === 'Withdrawal') {
    newBalance -= amount;
  }

  try {
    const customerDocRef = doc(db, 'customers', customer.id);
    await updateDoc(customerDocRef, { balance: newBalance });
    await fetchCustomers(); // Refresh customer list
    displayCustomerDetails(customer.id); // Refresh displayed customer details
    calculateTotalBalance(); // Recalculate total balance
  } catch (error) {
    console.error('Error updating customer balance:', error);
    displayMessage('Error updating customer balance.', true);
  }
}

// Function to display customer details
async function displayCustomerDetails(customerId) {
  currentCustomerId = customerId; // Set the current customer ID
  const customer = customers.find(c => c.id === customerId);
  if (customer) {
    customerNameDisplay.textContent = customer.name;
    customerBalanceDisplay.textContent = '$' + customer.balance.toFixed(2);

    // Fetch the last transaction for this customer
    const lastTransaction = transactions.filter(t => t.customer === customer.name).sort((a, b) => b.date - a.date)[0];
    if (lastTransaction) {
      lastTransactionDisplay.textContent = `${lastTransaction.type} of $${lastTransaction.amount.toFixed(2)} on ${new Date(lastTransaction.date).toLocaleDateString()}`;
    } else {
      lastTransactionDisplay.textContent = 'No transactions yet.';
    }

    // Show the customer balance section
    document.getElementById('customerBalanceSection').style.display = 'block';
  } else {
    customerNameDisplay.textContent = 'Customer not found';
    customerBalanceDisplay.textContent = '$0.00';
    lastTransactionDisplay.textContent = 'N/A';
    document.getElementById('customerBalanceSection').style.display = 'none';
  }
}

// Function to handle search input
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm) ||
    customer.contact.includes(searchTerm)
  );

  searchResultsDiv.innerHTML = '';
  if (searchTerm && filteredCustomers.length > 0) {
    const ul = document.createElement('ul');
    filteredCustomers.forEach(customer => {
      const li = document.createElement('li');
      li.textContent = customer.name;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        displayCustomerDetails(customer.id);
        searchResultsDiv.style.display = 'none';
      });
      ul.appendChild(li);
    });
    searchResultsDiv.appendChild(ul);
    searchResultsDiv.style.display = 'block';
  } else {
    searchResultsDiv.style.display = 'none';
  }
});

// Function to edit customer details
editCustomerButton.addEventListener('click', async () => {
  if (!currentCustomerId) {
    displayMessage('Please select a customer to edit.', true);
    return;
  }

  const customer = customers.find(c => c.id === currentCustomerId);
  if (customer) {
    formTitle.textContent = 'Edit Customer';
    customerNameInput.value = customer.name;
    customerContactInput.value = customer.contact;
    customerEmailInput.value = customer.email || '';
    customerAddressInput.value = customer.address || '';
    initialBalanceInput.value = customer.balance;

    registerButton.style.display = 'none';
    updateCustomerButton.style.display = 'inline-block';
    cancelEditButton.style.display = 'inline-block';
  }
});

// Function to update customer
updateCustomerButton.addEventListener('click', async () => {
  if (!currentCustomerId) {
    displayMessage('No customer selected.', true);
    return;
  }

  const customerName = customerNameInput.value;
  const customerContact = customerContactInput.value;
  const customerEmail = customerEmailInput.value;
  const customerAddress = customerAddressInput.value;
  const initialBalance = parseFloat(initialBalanceInput.value);

  if (!customerName || !customerContact || isNaN(initialBalance)) {
    displayMessage('Please fill in all required fields.', true);
    return;
  }

  try {
    const customerDocRef = doc(db, 'customers', currentCustomerId);
    await updateDoc(customerDocRef, {
      name: customerName,
      contact: customerContact,
      email: customerEmail,
      address: customerAddress,
      balance: initialBalance
    });

    displayMessage('Customer updated successfully!');
    clearCustomerForm();
    await fetchCustomers(); // Refresh customer list
    displayCustomerDetails(currentCustomerId); // Refresh displayed customer details
    cancelEditMode(); // Hide update/cancel buttons
  } catch (error) {
    console.error('Error updating customer:', error);
    displayMessage('Error updating customer.', true);
  }
});

// Function to cancel edit mode
function cancelEditMode() {
  formTitle.textContent = 'Register Customer';
  customerForm.reset();
  registerButton.style.display = 'inline-block';
  updateCustomerButton.style.display = 'none';
  cancelEditButton.style.display = 'none';
}

// Cancel Edit Button Event Listener
cancelEditButton.addEventListener('click', cancelEditMode);

// Function to clear all data (customers and transactions)
clearDataButton.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    return;
  }

  try {
    // Delete all customers
    for (const customer of customers) {
      const customerDocRef = doc(db, 'customers', customer.id);
      await deleteDoc(customerDocRef);
    }

    // Delete all transactions
    for (const transaction of transactions) {
      const transactionDocRef = doc(db, 'transactions', transaction.id);
      await deleteDoc(transactionDocRef);
    }

    displayMessage('All data cleared successfully!');
    await fetchCustomers(); // Refresh customer list
    await fetchTransactions(); // Refresh transaction list
    displayCustomerDetails(null); // Clear displayed customer details
  } catch (error) {
    console.error('Error clearing data:', error);
    displayMessage('Error clearing data.', true);
  }
});

// Function to view transaction history
viewHistoryButton.addEventListener('click', () => {
  if (!currentCustomerId) {
    displayMessage('Please select a customer to view history.', true);
    return;
  }

  const customer = customers.find(c => c.id === currentCustomerId);
  if (customer) {
    const customerTransactions = transactions.filter(t => t.customer === customer.name);
    transactionHistoryList.innerHTML = '';
    customerTransactions.forEach(transaction => {
      const listItem = document.createElement('li');
      listItem.textContent = `${transaction.type} of $${transaction.amount.toFixed(2)} on ${new Date(transaction.date).toLocaleDateString()}`;
      transactionHistoryList.appendChild(listItem);
    });

    transactionHistorySection.style.display = 'block';
  } else {
    displayMessage('Customer not found.', true);
  }
});

// Function to hide transaction history
hideHistoryButton.addEventListener('click', () => {
  transactionHistorySection.style.display = 'none';
});

// Function to handle menu clicks
menuLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const section = link.dataset.section;
    showSection(section);
  });
});

// Function to show a section and hide others
function showSection(sectionId) {
  dashboardSection.style.display = 'none';
  customersSection.style.display = 'none';
  transactionsSection.style.display = 'none';
  reportsSection.style.display = 'none';
  settingsSection.style.display = 'none';

  switch (sectionId) {
    case 'dashboard':
      dashboardSection.style.display = 'block';
      break;
    case 'customers':
      customersSection.style.display = 'block';
      break;
    case 'transactions':
      transactionsSection.style.display = 'block';
      break;
    case 'reports':
      reportsSection.style.display = 'block';
      break;
    case 'settings':
      settingsSection.style.display = 'block';
      break;
  }
}

// Function to handle saving settings
function saveSettings() {
  const selectedTheme = themeSelect.value;
  const selectedLanguage = languageSelect.value;
  const emailNotificationsEnabled = emailNotificationsCheckbox.checked;

  // Save settings to local storage or Firebase (depending on your needs)
  // For this example, we'll just log the settings to the console
  console.log('Theme:', selectedTheme);
  console.log('Language:', selectedLanguage);
  console.log('Email Notifications:', emailNotificationsEnabled);

  displayMessage('Settings saved successfully!');
}

// Add event listener for the save settings button
saveSettingsButton.addEventListener('click', saveSettings);

// Add event listener for the register button
registerButton.addEventListener('click', registerCustomer);

// Add event listener for the add transaction button
addTransactionButton.addEventListener('click', addTransaction);

// Initial data load
fetchCustomers();
fetchTransactions();

// Show default section (Dashboard)
showSection('dashboard');
