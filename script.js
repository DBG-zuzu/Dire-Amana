// Data Storage
let customers = [];
let transactions = [];
let totalBalance = 0;
let totalDeposits = 0;
let totalWithdrawals = 0;
let totalTransfers = 0;

// Initialize Application
// Add at the beginning of the file, after variable declarations
function loadDataFromStorage() {
    const savedCustomers = localStorage.getItem('customers');
    const savedTransactions = localStorage.getItem('transactions');
    const savedTotals = localStorage.getItem('totals');

    if (savedCustomers) customers = JSON.parse(savedCustomers);
    if (savedTransactions) transactions = JSON.parse(savedTransactions);
    if (savedTotals) {
        const totals = JSON.parse(savedTotals);
        totalBalance = totals.balance;
        totalDeposits = totals.deposits;
        totalWithdrawals = totals.withdrawals;
        totalTransfers = totals.transfers;
    }
}

function saveDataToStorage() {
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('totals', JSON.stringify({
        balance: totalBalance,
        deposits: totalDeposits,
        withdrawals: totalWithdrawals,
        transfers: totalTransfers
    }));
}

// Add this function after loadDataFromStorage
function recalculateTotals() {
    totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);
    totalDeposits = transactions
        .filter(t => t.type === "Deposit")
        .reduce((sum, t) => sum + t.amount, 0);
    totalWithdrawals = transactions
        .filter(t => t.type === "Withdrawal")
        .reduce((sum, t) => sum + t.amount, 0);
    totalTransfers = transactions
        .filter(t => t.type === "Transfer")
        .reduce((sum, t) => sum + t.amount, 0);
}

// Modify the DOMContentLoaded event listener
// Update the button initialization
function initializeButtons() {
    // Register button
    document.getElementById("registerButton")?.addEventListener("click", handleRegister);

    // Edit customer buttons
    document.getElementById("editCustomerButton")?.addEventListener("click", handleEdit);
    document.getElementById("updateCustomerButton")?.addEventListener("click", handleUpdateCustomer);
    document.getElementById("cancelEditButton")?.addEventListener("click", handleCancelEdit);

    // Transaction buttons
    document.getElementById("addTransactionButton")?.addEventListener("click", handleTransaction);

    // History buttons
    document.getElementById("viewHistoryButton")?.addEventListener("click", handleViewHistory);
    document.getElementById("hideHistoryButton")?.addEventListener("click", handleHideHistory);

    // Clear data button
    document.getElementById("clearDataButton")?.addEventListener("click", handleClear);

    // Initialize navigation
    initializeNavigation();
}

// Add this to your DOMContentLoaded event listener
// MCP Server Configuration
const MCP_SERVER = {
    host: 'localhost',
    port: 8080,
    protocol: 'ws'
};

// MCP Server Connection
let mcpConnection = null;

function initializeMCPServer() {
    try {
        const wsUrl = `${MCP_SERVER.protocol}://${MCP_SERVER.host}:${MCP_SERVER.port}`;
        mcpConnection = new WebSocket(wsUrl);

        mcpConnection.onopen = () => {
            console.log('Connected to MCP server');
            // Send initial connection data
            sendMCPMessage({
                type: 'init',
                clientId: generateClientId(),
                timestamp: Date.now()
            });
        };

        mcpConnection.onmessage = (event) => {
            handleMCPMessage(JSON.parse(event.data));
        };

        mcpConnection.onerror = (error) => {
            console.error('MCP Connection error:', error);
        };

        mcpConnection.onclose = () => {
            console.log('MCP Connection closed');
            // Attempt to reconnect after 5 seconds
            setTimeout(initializeMCPServer, 5000);
        };
    } catch (error) {
        console.error('Failed to initialize MCP server:', error);
    }
}

function sendMCPMessage(message) {
    if (mcpConnection && mcpConnection.readyState === WebSocket.OPEN) {
        mcpConnection.send(JSON.stringify(message));
    }
}

function handleMCPMessage(message) {
    switch (message.type) {
        case 'transaction':
            handleRemoteTransaction(message.data);
            break;
        case 'customer_update':
            handleRemoteCustomerUpdate(message.data);
            break;
        case 'sync_request':
            sendSyncData();
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
}

function handleRemoteTransaction(transactionData) {
    // Add transaction from remote source
    transactions.push(transactionData);
    recalculateTotals();
    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();
    saveDataToStorage();
}

function handleRemoteCustomerUpdate(customerData) {
    const existingCustomer = customers.find(c => c.id === customerData.id);
    if (existingCustomer) {
        Object.assign(existingCustomer, customerData);
    } else {
        customers.push(customerData);
    }
    updateCustomerList();
    saveDataToStorage();
}

function sendSyncData() {
    sendMCPMessage({
        type: 'sync_response',
        data: {
            customers,
            transactions,
            totals: {
                balance: totalBalance,
                deposits: totalDeposits,
                withdrawals: totalWithdrawals,
                transfers: totalTransfers
            }
        }
    });
}

function generateClientId() {
    return 'client_' + Math.random().toString(36).substr(2, 9);
}

document.addEventListener("DOMContentLoaded", () => {
    loadDataFromStorage();
    recalculateTotals();
    initializeButtons();
    updateCustomerList();
    updateTransactionTable();
    updateTotalBalance();
    updateTransactionReport();
    initializeMCPServer();
});

// Add recalculateTotals() call in these functions before updating UI:
function handleTransaction() {
    const customerName = document.getElementById("transactionCustomer").value;
    const transactionType = document.getElementById("transactionType").value;
    const transactionMethod = document.getElementById("transactionMethod").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const receiverName = document.getElementById("receiverName").value;

    if (!customerName || isNaN(amount) || amount <= 0) {
        showMessage("Please enter valid customer and amount.");
        return;
    }

    const customer = customers.find(c => c.name === customerName);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    let successMessage = "";

    switch(transactionType) {
        case "Withdrawal":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            customer.balance -= amount;
            totalWithdrawals += amount;
            successMessage = `Withdrawal of $${amount.toFixed(2)} successful!`;
            break;
        case "Transfer":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            if (!receiverName) {
                showMessage("Please enter receiver name for transfer.");
                return;
            }
            const receiver = customers.find(c => c.name === receiverName);
            if (!receiver) {
                showMessage("Receiver not found.");
                return;
            }
            customer.balance -= amount;
            receiver.balance += amount;
            totalTransfers += amount;
            successMessage = `Transfer of $${amount.toFixed(2)} to ${receiverName} successful!`;
            break;
        case "Deposit":
            customer.balance += amount;
            totalDeposits += amount;
            successMessage = `Deposit of $${amount.toFixed(2)} successful!`;
            break;
    }

    totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

    transactions.push({
        date: new Date().toLocaleDateString(),
        customer: customerName,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName || "N/A"
    });

    recalculateTotals();
    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();
    saveDataToStorage();

    document.getElementById("transactionForm").reset();
    showMessage(successMessage);
}

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            document.querySelectorAll('.section').forEach(section => {
                section.classList.toggle('active', section.id === targetId);
            });

            if (targetId === 'transactions') {
                updateTransactionTable();
            }
        });
    });
}

// Transaction Handling
function handleTransaction() {
    const customerName = document.getElementById("transactionCustomer").value;
    const transactionType = document.getElementById("transactionType").value;
    const transactionMethod = document.getElementById("transactionMethod").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const receiverName = document.getElementById("receiverName").value;

    if (!customerName || isNaN(amount) || amount <= 0) {
        showMessage("Please enter valid customer and amount.");
        return;
    }

    const customer = customers.find(c => c.name === customerName);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    switch(transactionType) {
        case "Withdrawal":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            customer.balance -= amount;
            totalWithdrawals += amount;
            break;
        case "Transfer":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            if (!receiverName) {
                showMessage("Please enter receiver name for transfer.");
                return;
            }
            const receiver = customers.find(c => c.name === receiverName);
            if (!receiver) {
                showMessage("Receiver not found.");
                return;
            }
            customer.balance -= amount;
            receiver.balance += amount;
            totalTransfers += amount;
            break;
        case "Deposit":
            customer.balance += amount;
            totalDeposits += amount;
            break;
    }

    totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

    const transactionData = {
        date: new Date().toLocaleDateString(),
        customer: customerName,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName || "N/A"
    };

    transactions.push(transactionData);

    recalculateTotals();
    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("transactionForm").reset();
    showMessage(`${transactionType} successful!`);
    saveDataToStorage();

    // Broadcast to MCP server
    sendMCPMessage({
        type: 'transaction',
        data: transactionData
    });
}

// Customer Registration
function handleRegister() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const initialBalance = parseFloat(document.getElementById("initialBalance").value) || 0;

    if (!name || !contact) {
        showMessage("Please fill in all required fields.");
        return;
    }

    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showMessage("Customer already exists.");
        return;
    }

    const newCustomer = { 
        id: Date.now(), 
        name, 
        contact, 
        email, 
        address, 
        balance: initialBalance 
    };
    
    customers.push(newCustomer);
    totalBalance += initialBalance;
    totalDeposits += initialBalance;

    if (initialBalance > 0) {
        transactions.push({
            date: new Date().toLocaleDateString(),
            customer: name,
            type: "Deposit",
            method: "Cash",
            amount: initialBalance,
            receiver: "N/A"
        });
    }

    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("customerForm").reset();
    showMessage("Customer registered successfully.");
    saveDataToStorage();
}

// UI Updates
function updateTransactionTable() {
    const tbody = document.getElementById("transactionTableBody");
    if (tbody) {
        tbody.innerHTML = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }
}

// Remove the duplicate updateTransactionsTable function if it exists

function handleEdit() {
    const name = document.getElementById("customerNameDisplay").textContent;
    const customer = customers.find(c => c.name === name);
    
    if (customer) {
        document.getElementById("customerName").value = customer.name;
        document.getElementById("customerContact").value = customer.contact;
        document.getElementById("customerEmail").value = customer.email;
        document.getElementById("customerAddress").value = customer.address;
        
        document.getElementById("updateCustomerButton").style.display = "block";
        document.getElementById("cancelEditButton").style.display = "block";
        document.getElementById("registerButton").style.display = "none";
    }
}

function handleCancelEdit() {
    document.getElementById("customerForm").reset();
    document.getElementById("updateCustomerButton").style.display = "none";
    document.getElementById("cancelEditButton").style.display = "none";
    document.getElementById("registerButton").style.display = "block";
}

function handleUpdateCustomer() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    const customer = customers.find(c => c.name === name);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    customer.contact = contact;
    customer.email = email;
    customer.address = address;

    updateCustomerList();
    handleCancelEdit();
    showMessage("Customer updated successfully.");
    saveDataToStorage();
}

// Update the updateCustomerList function to include click handlers
function updateCustomerList() {
    const list = document.getElementById("customerBalanceList");
    if (list) {
        list.innerHTML = customers
            .map(c => `
                <li onclick="showCustomerDetails('${c.name}')">
                    ${c.name} - Balance: $${c.balance.toFixed(2)}
                </li>
            `).join("");
    }
}

// Add customer details display function
function showCustomerDetails(name) {
    const customer = customers.find(c => c.name === name);
    if (customer) {
        document.getElementById("customerNameDisplay").textContent = customer.name;
        document.getElementById("customerContactDisplay").textContent = customer.contact;
        document.getElementById("customerEmailDisplay").textContent = customer.email;
        document.getElementById("customerAddressDisplay").textContent = customer.address;
        document.getElementById("customerBalanceDisplay").textContent = `$${customer.balance.toFixed(2)}`;
        
        document.getElementById("customerDetails").style.display = "block";
    }
}

function updateTotalBalance() {
    const element = document.getElementById("totalBalance");
    if (element) {
        element.textContent = `$${totalBalance.toFixed(2)}`;
    }
}

function updateTransactionReport() {
    document.getElementById("totalDeposit").textContent = `$${totalDeposits.toFixed(2)}`;
    document.getElementById("totalWithdraw").textContent = `$${totalWithdrawals.toFixed(2)}`;
    document.getElementById("totalTransfer").textContent = `$${totalTransfers.toFixed(2)}`;
}

// Utility Functions
function showMessage(message) {
    alert(message);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleClear() {
    if (confirm("Are you sure you want to clear all data?")) {
        // Reset all data structures
        customers = [];
        transactions = [];
        totalBalance = 0;
        totalDeposits = 0;
        totalWithdrawals = 0;
        totalTransfers = 0;

        // Reset UI elements
        document.getElementById("transactionTableBody").innerHTML = "";
        document.getElementById("customerBalanceList").innerHTML = "";
        document.getElementById("totalBalance").textContent = "$0.00";
        document.getElementById("totalDeposit").textContent = "$0.00";
        document.getElementById("totalWithdraw").textContent = "$0.00";
        document.getElementById("totalTransfer").textContent = "$0.00";

        // Reset forms if they exist
        const customerForm = document.getElementById("customerForm");
        const transactionForm = document.getElementById("transactionForm");
        if (customerForm) customerForm.reset();
        if (transactionForm) transactionForm.reset();

        // Hide customer details if visible
        const customerDetails = document.getElementById("customerDetails");
        if (customerDetails) customerDetails.style.display = "none";

        showMessage("All data cleared successfully.");
        localStorage.clear(); // Add this line
        showMessage("All data cleared successfully.");
    }
}

// Add these functions for history handling
// Update the view history functionality
function handleViewHistory() {
    const customerName = document.getElementById("customerNameDisplay").textContent;
    if (!customerName || customerName === "") {
        showMessage("Please select a customer first.");
        return;
    }

    const customerTransactions = transactions.filter(t => 
        t.customer === customerName || t.receiver === customerName
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const historyTable = document.getElementById("customerTransactionHistory");
    if (historyTable) {
        historyTable.innerHTML = customerTransactions
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }

    document.getElementById("mainTransactionHistory").style.display = "block";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

// Add event listener for hide history button
document.getElementById("hideHistoryButton").addEventListener("click", handleHideHistory);

// Settings Management
const settings = {
    loadSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return this.getDefaultSettings();
    },

    getDefaultSettings() {
        return {
            theme: 'light',
            fontSize: 'medium',
            notifications: {
                enabled: false,
                sound: false,
                types: {
                    newTransaction: true,
                    lowBalance: true,
                    systemUpdates: true
                }
            },
            autoBackup: 'never',
            currency: {
                type: 'USD',
                showSymbol: true
            },
            security: {
                sessionTimeout: '30',
                requireConfirmation: true
            }
        };
    },

    saveSettings(settings) {
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    },

    applyTheme(theme) {
        document.body.className = theme;
    },

    applyFontSize(size) {
        document.documentElement.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[size] || '16px';
    }
};

// Initialize Settings
document.addEventListener('DOMContentLoaded', () => {
    const currentSettings = settings.loadSettings();

    // Theme
    document.getElementById('themeSelector').value = currentSettings.theme;
    settings.applyTheme(currentSettings.theme);

    // Font Size
    document.getElementById('fontSizeSelector').value = currentSettings.fontSize;
    settings.applyFontSize(currentSettings.fontSize);

    // Notifications
    document.getElementById('notificationToggle').checked = currentSettings.notifications.enabled;
    document.getElementById('soundToggle').checked = currentSettings.notifications.sound;
    document.getElementById('notifyNewTransaction').checked = currentSettings.notifications.types.newTransaction;
    document.getElementById('notifyLowBalance').checked = currentSettings.notifications.types.lowBalance;
    document.getElementById('notifySystemUpdates').checked = currentSettings.notifications.types.systemUpdates;

    // Auto Backup
    document.getElementById('autoBackupInterval').value = currentSettings.autoBackup;

    // Currency
    document.getElementById('currencySelector').value = currentSettings.currency.type;
    document.getElementById('showCurrencySymbol').checked = currentSettings.currency.showSymbol;

    // Security
    document.getElementById('sessionTimeout').value = currentSettings.security.sessionTimeout;
    document.getElementById('requireConfirmation').checked = currentSettings.security.requireConfirmation;

    // Event Listeners
    document.getElementById('themeSelector').addEventListener('change', (e) => {
        currentSettings.theme = e.target.value;
        settings.applyTheme(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
        currentSettings.fontSize = e.target.value;
        settings.applyFontSize(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('notificationToggle').addEventListener('change', (e) => {
        currentSettings.notifications.enabled = e.target.checked;
        if (e.target.checked) {
            Notification.requestPermission();
        }
        settings.saveSettings(currentSettings);
    });

    // Export Data
    document.getElementById('exportDataButton').addEventListener('click', () => {
        const data = {
            settings: currentSettings,
            transactions: localStorage.getItem('transactions'),
            customers: localStorage.getItem('customers')
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });

    // Import Data
    document.getElementById('importDataButton').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.settings) {
                        settings.saveSettings(data.settings);
                        if (data.transactions) localStorage.setItem('transactions', data.transactions);
                        if (data.customers) localStorage.setItem('customers', data.customers);
                        location.reload();
                    }
                } catch (error) {
                    alert('Invalid backup file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Reset Settings
    document.getElementById('resetSettingsButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            const defaultSettings = settings.getDefaultSettings();
            settings.saveSettings(defaultSettings);
            location.reload();
        }
    });

    // Clear Data
    document.getElementById('clearDataButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    });
});

// Add recalculateTotals() call in these functions before updating UI:
function handleTransaction() {
    const customerName = document.getElementById("transactionCustomer").value;
    const transactionType = document.getElementById("transactionType").value;
    const transactionMethod = document.getElementById("transactionMethod").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const receiverName = document.getElementById("receiverName").value;

    if (!customerName || isNaN(amount) || amount <= 0) {
        showMessage("Please enter valid customer and amount.");
        return;
    }

    const customer = customers.find(c => c.name === customerName);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    switch(transactionType) {
        case "Withdrawal":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            customer.balance -= amount;
            totalWithdrawals += amount;
            break;
        case "Transfer":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            if (!receiverName) {
                showMessage("Please enter receiver name for transfer.");
                return;
            }
            const receiver = customers.find(c => c.name === receiverName);
            if (!receiver) {
                showMessage("Receiver not found.");
                return;
            }
            customer.balance -= amount;
            receiver.balance += amount;
            totalTransfers += amount;
            break;
        case "Deposit":
            customer.balance += amount;
            totalDeposits += amount;
            break;
    }

    totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

    const transactionData = {
        date: new Date().toLocaleDateString(),
        customer: customerName,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName || "N/A"
    };

    transactions.push(transactionData);

    recalculateTotals();
    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("transactionForm").reset();
    showMessage(`${transactionType} successful!`);
    saveDataToStorage();

    // Broadcast to MCP server
    sendMCPMessage({
        type: 'transaction',
        data: transactionData
    });
}

// Customer Registration
function handleRegister() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const initialBalance = parseFloat(document.getElementById("initialBalance").value) || 0;

    if (!name || !contact) {
        showMessage("Please fill in all required fields.");
        return;
    }

    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showMessage("Customer already exists.");
        return;
    }

    const newCustomer = { 
        id: Date.now(), 
        name, 
        contact, 
        email, 
        address, 
        balance: initialBalance 
    };
    
    customers.push(newCustomer);
    totalBalance += initialBalance;
    totalDeposits += initialBalance;

    if (initialBalance > 0) {
        transactions.push({
            date: new Date().toLocaleDateString(),
            customer: name,
            type: "Deposit",
            method: "Cash",
            amount: initialBalance,
            receiver: "N/A"
        });
    }

    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("customerForm").reset();
    showMessage("Customer registered successfully.");
    saveDataToStorage();
}

// UI Updates
function updateTransactionTable() {
    const tbody = document.getElementById("transactionTableBody");
    if (tbody) {
        tbody.innerHTML = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }
}

// Remove the duplicate updateTransactionsTable function if it exists

function handleEdit() {
    const name = document.getElementById("customerNameDisplay").textContent;
    const customer = customers.find(c => c.name === name);
    
    if (customer) {
        document.getElementById("customerName").value = customer.name;
        document.getElementById("customerContact").value = customer.contact;
        document.getElementById("customerEmail").value = customer.email;
        document.getElementById("customerAddress").value = customer.address;
        
        document.getElementById("updateCustomerButton").style.display = "block";
        document.getElementById("cancelEditButton").style.display = "block";
        document.getElementById("registerButton").style.display = "none";
    }
}

function handleCancelEdit() {
    document.getElementById("customerForm").reset();
    document.getElementById("updateCustomerButton").style.display = "none";
    document.getElementById("cancelEditButton").style.display = "none";
    document.getElementById("registerButton").style.display = "block";
}

function handleUpdateCustomer() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    const customer = customers.find(c => c.name === name);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    customer.contact = contact;
    customer.email = email;
    customer.address = address;

    updateCustomerList();
    handleCancelEdit();
    showMessage("Customer updated successfully.");
    saveDataToStorage();
}

// Update the updateCustomerList function to include click handlers
function updateCustomerList() {
    const list = document.getElementById("customerBalanceList");
    if (list) {
        list.innerHTML = customers
            .map(c => `
                <li onclick="showCustomerDetails('${c.name}')">
                    ${c.name} - Balance: $${c.balance.toFixed(2)}
                </li>
            `).join("");
    }
}

// Add customer details display function
function showCustomerDetails(name) {
    const customer = customers.find(c => c.name === name);
    if (customer) {
        document.getElementById("customerNameDisplay").textContent = customer.name;
        document.getElementById("customerContactDisplay").textContent = customer.contact;
        document.getElementById("customerEmailDisplay").textContent = customer.email;
        document.getElementById("customerAddressDisplay").textContent = customer.address;
        document.getElementById("customerBalanceDisplay").textContent = `$${customer.balance.toFixed(2)}`;
        
        document.getElementById("customerDetails").style.display = "block";
    }
}

function updateTotalBalance() {
    const element = document.getElementById("totalBalance");
    if (element) {
        element.textContent = `$${totalBalance.toFixed(2)}`;
    }
}

function updateTransactionReport() {
    document.getElementById("totalDeposit").textContent = `$${totalDeposits.toFixed(2)}`;
    document.getElementById("totalWithdraw").textContent = `$${totalWithdrawals.toFixed(2)}`;
    document.getElementById("totalTransfer").textContent = `$${totalTransfers.toFixed(2)}`;
}

// Utility Functions
function showMessage(message) {
    alert(message);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleClear() {
    if (confirm("Are you sure you want to clear all data?")) {
        // Reset all data structures
        customers = [];
        transactions = [];
        totalBalance = 0;
        totalDeposits = 0;
        totalWithdrawals = 0;
        totalTransfers = 0;

        // Reset UI elements
        document.getElementById("transactionTableBody").innerHTML = "";
        document.getElementById("customerBalanceList").innerHTML = "";
        document.getElementById("totalBalance").textContent = "$0.00";
        document.getElementById("totalDeposit").textContent = "$0.00";
        document.getElementById("totalWithdraw").textContent = "$0.00";
        document.getElementById("totalTransfer").textContent = "$0.00";

        // Reset forms if they exist
        const customerForm = document.getElementById("customerForm");
        const transactionForm = document.getElementById("transactionForm");
        if (customerForm) customerForm.reset();
        if (transactionForm) transactionForm.reset();

        // Hide customer details if visible
        const customerDetails = document.getElementById("customerDetails");
        if (customerDetails) customerDetails.style.display = "none";

        showMessage("All data cleared successfully.");
        localStorage.clear(); // Add this line
        showMessage("All data cleared successfully.");
    }
}

// Add these functions for history handling
// Update the view history functionality
function handleViewHistory() {
    const customerName = document.getElementById("customerNameDisplay").textContent;
    if (!customerName || customerName === "") {
        showMessage("Please select a customer first.");
        return;
    }

    const customerTransactions = transactions.filter(t => 
        t.customer === customerName || t.receiver === customerName
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const historyTable = document.getElementById("customerTransactionHistory");
    if (historyTable) {
        historyTable.innerHTML = customerTransactions
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }

    document.getElementById("mainTransactionHistory").style.display = "block";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

// Add event listener for hide history button
document.getElementById("hideHistoryButton").addEventListener("click", handleHideHistory);

// Settings Management
const settings = {
    loadSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return this.getDefaultSettings();
    },

    getDefaultSettings() {
        return {
            theme: 'light',
            fontSize: 'medium',
            notifications: {
                enabled: false,
                sound: false,
                types: {
                    newTransaction: true,
                    lowBalance: true,
                    systemUpdates: true
                }
            },
            autoBackup: 'never',
            currency: {
                type: 'USD',
                showSymbol: true
            },
            security: {
                sessionTimeout: '30',
                requireConfirmation: true
            }
        };
    },

    saveSettings(settings) {
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    },

    applyTheme(theme) {
        document.body.className = theme;
    },

    applyFontSize(size) {
        document.documentElement.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[size] || '16px';
    }
};

// Initialize Settings
document.addEventListener('DOMContentLoaded', () => {
    const currentSettings = settings.loadSettings();

    // Theme
    document.getElementById('themeSelector').value = currentSettings.theme;
    settings.applyTheme(currentSettings.theme);

    // Font Size
    document.getElementById('fontSizeSelector').value = currentSettings.fontSize;
    settings.applyFontSize(currentSettings.fontSize);

    // Notifications
    document.getElementById('notificationToggle').checked = currentSettings.notifications.enabled;
    document.getElementById('soundToggle').checked = currentSettings.notifications.sound;
    document.getElementById('notifyNewTransaction').checked = currentSettings.notifications.types.newTransaction;
    document.getElementById('notifyLowBalance').checked = currentSettings.notifications.types.lowBalance;
    document.getElementById('notifySystemUpdates').checked = currentSettings.notifications.types.systemUpdates;

    // Auto Backup
    document.getElementById('autoBackupInterval').value = currentSettings.autoBackup;

    // Currency
    document.getElementById('currencySelector').value = currentSettings.currency.type;
    document.getElementById('showCurrencySymbol').checked = currentSettings.currency.showSymbol;

    // Security
    document.getElementById('sessionTimeout').value = currentSettings.security.sessionTimeout;
    document.getElementById('requireConfirmation').checked = currentSettings.security.requireConfirmation;

    // Event Listeners
    document.getElementById('themeSelector').addEventListener('change', (e) => {
        currentSettings.theme = e.target.value;
        settings.applyTheme(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
        currentSettings.fontSize = e.target.value;
        settings.applyFontSize(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('notificationToggle').addEventListener('change', (e) => {
        currentSettings.notifications.enabled = e.target.checked;
        if (e.target.checked) {
            Notification.requestPermission();
        }
        settings.saveSettings(currentSettings);
    });

    // Export Data
    document.getElementById('exportDataButton').addEventListener('click', () => {
        const data = {
            settings: currentSettings,
            transactions: localStorage.getItem('transactions'),
            customers: localStorage.getItem('customers')
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });

    // Import Data
    document.getElementById('importDataButton').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.settings) {
                        settings.saveSettings(data.settings);
                        if (data.transactions) localStorage.setItem('transactions', data.transactions);
                        if (data.customers) localStorage.setItem('customers', data.customers);
                        location.reload();
                    }
                } catch (error) {
                    alert('Invalid backup file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Reset Settings
    document.getElementById('resetSettingsButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            const defaultSettings = settings.getDefaultSettings();
            settings.saveSettings(defaultSettings);
            location.reload();
        }
    });

    // Clear Data
    document.getElementById('clearDataButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    });
});

// Add recalculateTotals() call in these functions before updating UI:
function handleTransaction() {
    const customerName = document.getElementById("transactionCustomer").value;
    const transactionType = document.getElementById("transactionType").value;
    const transactionMethod = document.getElementById("transactionMethod").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const receiverName = document.getElementById("receiverName").value;

    if (!customerName || isNaN(amount) || amount <= 0) {
        showMessage("Please enter valid customer and amount.");
        return;
    }

    const customer = customers.find(c => c.name === customerName);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    switch(transactionType) {
        case "Withdrawal":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            customer.balance -= amount;
            totalWithdrawals += amount;
            break;
        case "Transfer":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            if (!receiverName) {
                showMessage("Please enter receiver name for transfer.");
                return;
            }
            const receiver = customers.find(c => c.name === receiverName);
            if (!receiver) {
                showMessage("Receiver not found.");
                return;
            }
            customer.balance -= amount;
            receiver.balance += amount;
            totalTransfers += amount;
            break;
        case "Deposit":
            customer.balance += amount;
            totalDeposits += amount;
            break;
    }

    totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

    const transactionData = {
        date: new Date().toLocaleDateString(),
        customer: customerName,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName || "N/A"
    };

    transactions.push(transactionData);

    recalculateTotals();
    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("transactionForm").reset();
    showMessage(`${transactionType} successful!`);
    saveDataToStorage();

    // Broadcast to MCP server
    sendMCPMessage({
        type: 'transaction',
        data: transactionData
    });
}

// Customer Registration
function handleRegister() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const initialBalance = parseFloat(document.getElementById("initialBalance").value) || 0;

    if (!name || !contact) {
        showMessage("Please fill in all required fields.");
        return;
    }

    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showMessage("Customer already exists.");
        return;
    }

    const newCustomer = { 
        id: Date.now(), 
        name, 
        contact, 
        email, 
        address, 
        balance: initialBalance 
    };
    
    customers.push(newCustomer);
    totalBalance += initialBalance;
    totalDeposits += initialBalance;

    if (initialBalance > 0) {
        transactions.push({
            date: new Date().toLocaleDateString(),
            customer: name,
            type: "Deposit",
            method: "Cash",
            amount: initialBalance,
            receiver: "N/A"
        });
    }

    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("customerForm").reset();
    showMessage("Customer registered successfully.");
    saveDataToStorage();
}

// UI Updates
function updateTransactionTable() {
    const tbody = document.getElementById("transactionTableBody");
    if (tbody) {
        tbody.innerHTML = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }
}

// Remove the duplicate updateTransactionsTable function if it exists

function handleEdit() {
    const name = document.getElementById("customerNameDisplay").textContent;
    const customer = customers.find(c => c.name === name);
    
    if (customer) {
        document.getElementById("customerName").value = customer.name;
        document.getElementById("customerContact").value = customer.contact;
        document.getElementById("customerEmail").value = customer.email;
        document.getElementById("customerAddress").value = customer.address;
        
        document.getElementById("updateCustomerButton").style.display = "block";
        document.getElementById("cancelEditButton").style.display = "block";
        document.getElementById("registerButton").style.display = "none";
    }
}

function handleCancelEdit() {
    document.getElementById("customerForm").reset();
    document.getElementById("updateCustomerButton").style.display = "none";
    document.getElementById("cancelEditButton").style.display = "none";
    document.getElementById("registerButton").style.display = "block";
}

function handleUpdateCustomer() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    const customer = customers.find(c => c.name === name);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    customer.contact = contact;
    customer.email = email;
    customer.address = address;

    updateCustomerList();
    handleCancelEdit();
    showMessage("Customer updated successfully.");
    saveDataToStorage();
}

// Update the updateCustomerList function to include click handlers
function updateCustomerList() {
    const list = document.getElementById("customerBalanceList");
    if (list) {
        list.innerHTML = customers
            .map(c => `
                <li onclick="showCustomerDetails('${c.name}')">
                    ${c.name} - Balance: $${c.balance.toFixed(2)}
                </li>
            `).join("");
    }
}

// Add customer details display function
function showCustomerDetails(name) {
    const customer = customers.find(c => c.name === name);
    if (customer) {
        document.getElementById("customerNameDisplay").textContent = customer.name;
        document.getElementById("customerContactDisplay").textContent = customer.contact;
        document.getElementById("customerEmailDisplay").textContent = customer.email;
        document.getElementById("customerAddressDisplay").textContent = customer.address;
        document.getElementById("customerBalanceDisplay").textContent = `$${customer.balance.toFixed(2)}`;
        
        document.getElementById("customerDetails").style.display = "block";
    }
}

function updateTotalBalance() {
    const element = document.getElementById("totalBalance");
    if (element) {
        element.textContent = `$${totalBalance.toFixed(2)}`;
    }
}

function updateTransactionReport() {
    document.getElementById("totalDeposit").textContent = `$${totalDeposits.toFixed(2)}`;
    document.getElementById("totalWithdraw").textContent = `$${totalWithdrawals.toFixed(2)}`;
    document.getElementById("totalTransfer").textContent = `$${totalTransfers.toFixed(2)}`;
}

// Utility Functions
function showMessage(message) {
    alert(message);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleClear() {
    if (confirm("Are you sure you want to clear all data?")) {
        // Reset all data structures
        customers = [];
        transactions = [];
        totalBalance = 0;
        totalDeposits = 0;
        totalWithdrawals = 0;
        totalTransfers = 0;

        // Reset UI elements
        document.getElementById("transactionTableBody").innerHTML = "";
        document.getElementById("customerBalanceList").innerHTML = "";
        document.getElementById("totalBalance").textContent = "$0.00";
        document.getElementById("totalDeposit").textContent = "$0.00";
        document.getElementById("totalWithdraw").textContent = "$0.00";
        document.getElementById("totalTransfer").textContent = "$0.00";

        // Reset forms if they exist
        const customerForm = document.getElementById("customerForm");
        const transactionForm = document.getElementById("transactionForm");
        if (customerForm) customerForm.reset();
        if (transactionForm) transactionForm.reset();

        // Hide customer details if visible
        const customerDetails = document.getElementById("customerDetails");
        if (customerDetails) customerDetails.style.display = "none";

        showMessage("All data cleared successfully.");
        localStorage.clear(); // Add this line
        showMessage("All data cleared successfully.");
    }
}

// Add these functions for history handling
// Update the view history functionality
function handleViewHistory() {
    const customerName = document.getElementById("customerNameDisplay").textContent;
    if (!customerName || customerName === "") {
        showMessage("Please select a customer first.");
        return;
    }

    const customerTransactions = transactions.filter(t => 
        t.customer === customerName || t.receiver === customerName
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const historyTable = document.getElementById("customerTransactionHistory");
    if (historyTable) {
        historyTable.innerHTML = customerTransactions
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }

    document.getElementById("mainTransactionHistory").style.display = "block";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

// Add event listener for hide history button
document.getElementById("hideHistoryButton").addEventListener("click", handleHideHistory);

// Settings Management
const settings = {
    loadSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return this.getDefaultSettings();
    },

    getDefaultSettings() {
        return {
            theme: 'light',
            fontSize: 'medium',
            notifications: {
                enabled: false,
                sound: false,
                types: {
                    newTransaction: true,
                    lowBalance: true,
                    systemUpdates: true
                }
            },
            autoBackup: 'never',
            currency: {
                type: 'USD',
                showSymbol: true
            },
            security: {
                sessionTimeout: '30',
                requireConfirmation: true
            }
        };
    },

    saveSettings(settings) {
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    },

    applyTheme(theme) {
        document.body.className = theme;
    },

    applyFontSize(size) {
        document.documentElement.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[size] || '16px';
    }
};

// Initialize Settings
document.addEventListener('DOMContentLoaded', () => {
    const currentSettings = settings.loadSettings();

    // Theme
    document.getElementById('themeSelector').value = currentSettings.theme;
    settings.applyTheme(currentSettings.theme);

    // Font Size
    document.getElementById('fontSizeSelector').value = currentSettings.fontSize;
    settings.applyFontSize(currentSettings.fontSize);

    // Notifications
    document.getElementById('notificationToggle').checked = currentSettings.notifications.enabled;
    document.getElementById('soundToggle').checked = currentSettings.notifications.sound;
    document.getElementById('notifyNewTransaction').checked = currentSettings.notifications.types.newTransaction;
    document.getElementById('notifyLowBalance').checked = currentSettings.notifications.types.lowBalance;
    document.getElementById('notifySystemUpdates').checked = currentSettings.notifications.types.systemUpdates;

    // Auto Backup
    document.getElementById('autoBackupInterval').value = currentSettings.autoBackup;

    // Currency
    document.getElementById('currencySelector').value = currentSettings.currency.type;
    document.getElementById('showCurrencySymbol').checked = currentSettings.currency.showSymbol;

    // Security
    document.getElementById('sessionTimeout').value = currentSettings.security.sessionTimeout;
    document.getElementById('requireConfirmation').checked = currentSettings.security.requireConfirmation;

    // Event Listeners
    document.getElementById('themeSelector').addEventListener('change', (e) => {
        currentSettings.theme = e.target.value;
        settings.applyTheme(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
        currentSettings.fontSize = e.target.value;
        settings.applyFontSize(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('notificationToggle').addEventListener('change', (e) => {
        currentSettings.notifications.enabled = e.target.checked;
        if (e.target.checked) {
            Notification.requestPermission();
        }
        settings.saveSettings(currentSettings);
    });

    // Export Data
    document.getElementById('exportDataButton').addEventListener('click', () => {
        const data = {
            settings: currentSettings,
            transactions: localStorage.getItem('transactions'),
            customers: localStorage.getItem('customers')
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });

    // Import Data
    document.getElementById('importDataButton').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.settings) {
                        settings.saveSettings(data.settings);
                        if (data.transactions) localStorage.setItem('transactions', data.transactions);
                        if (data.customers) localStorage.setItem('customers', data.customers);
                        location.reload();
                    }
                } catch (error) {
                    alert('Invalid backup file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Reset Settings
    document.getElementById('resetSettingsButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            const defaultSettings = settings.getDefaultSettings();
            settings.saveSettings(defaultSettings);
            location.reload();
        }
    });

    // Clear Data
    document.getElementById('clearDataButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    });
});

// Add recalculateTotals() call in these functions before updating UI:
function handleTransaction() {
    const customerName = document.getElementById("transactionCustomer").value;
    const transactionType = document.getElementById("transactionType").value;
    const transactionMethod = document.getElementById("transactionMethod").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const receiverName = document.getElementById("receiverName").value;

    if (!customerName || isNaN(amount) || amount <= 0) {
        showMessage("Please enter valid customer and amount.");
        return;
    }

    const customer = customers.find(c => c.name === customerName);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    switch(transactionType) {
        case "Withdrawal":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            customer.balance -= amount;
            totalWithdrawals += amount;
            break;
        case "Transfer":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            if (!receiverName) {
                showMessage("Please enter receiver name for transfer.");
                return;
            }
            const receiver = customers.find(c => c.name === receiverName);
            if (!receiver) {
                showMessage("Receiver not found.");
                return;
            }
            customer.balance -= amount;
            receiver.balance += amount;
            totalTransfers += amount;
            break;
        case "Deposit":
            customer.balance += amount;
            totalDeposits += amount;
            break;
    }

    totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

    const transactionData = {
        date: new Date().toLocaleDateString(),
        customer: customerName,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName || "N/A"
    };

    transactions.push(transactionData);

    recalculateTotals();
    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("transactionForm").reset();
    showMessage(`${transactionType} successful!`);
    saveDataToStorage();

    // Broadcast to MCP server
    sendMCPMessage({
        type: 'transaction',
        data: transactionData
    });
}

// Customer Registration
function handleRegister() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const initialBalance = parseFloat(document.getElementById("initialBalance").value) || 0;

    if (!name || !contact) {
        showMessage("Please fill in all required fields.");
        return;
    }

    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showMessage("Customer already exists.");
        return;
    }

    const newCustomer = { 
        id: Date.now(), 
        name, 
        contact, 
        email, 
        address, 
        balance: initialBalance 
    };
    
    customers.push(newCustomer);
    totalBalance += initialBalance;
    totalDeposits += initialBalance;

    if (initialBalance > 0) {
        transactions.push({
            date: new Date().toLocaleDateString(),
            customer: name,
            type: "Deposit",
            method: "Cash",
            amount: initialBalance,
            receiver: "N/A"
        });
    }

    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("customerForm").reset();
    showMessage("Customer registered successfully.");
    saveDataToStorage();
}

// UI Updates
function updateTransactionTable() {
    const tbody = document.getElementById("transactionTableBody");
    if (tbody) {
        tbody.innerHTML = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }
}

// Remove the duplicate updateTransactionsTable function if it exists

function handleEdit() {
    const name = document.getElementById("customerNameDisplay").textContent;
    const customer = customers.find(c => c.name === name);
    
    if (customer) {
        document.getElementById("customerName").value = customer.name;
        document.getElementById("customerContact").value = customer.contact;
        document.getElementById("customerEmail").value = customer.email;
        document.getElementById("customerAddress").value = customer.address;
        
        document.getElementById("updateCustomerButton").style.display = "block";
        document.getElementById("cancelEditButton").style.display = "block";
        document.getElementById("registerButton").style.display = "none";
    }
}

function handleCancelEdit() {
    document.getElementById("customerForm").reset();
    document.getElementById("updateCustomerButton").style.display = "none";
    document.getElementById("cancelEditButton").style.display = "none";
    document.getElementById("registerButton").style.display = "block";
}

function handleUpdateCustomer() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    const customer = customers.find(c => c.name === name);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    customer.contact = contact;
    customer.email = email;
    customer.address = address;

    updateCustomerList();
    handleCancelEdit();
    showMessage("Customer updated successfully.");
    saveDataToStorage();
}

// Update the updateCustomerList function to include click handlers
function updateCustomerList() {
    const list = document.getElementById("customerBalanceList");
    if (list) {
        list.innerHTML = customers
            .map(c => `
                <li onclick="showCustomerDetails('${c.name}')">
                    ${c.name} - Balance: $${c.balance.toFixed(2)}
                </li>
            `).join("");
    }
}

// Add customer details display function
function showCustomerDetails(name) {
    const customer = customers.find(c => c.name === name);
    if (customer) {
        document.getElementById("customerNameDisplay").textContent = customer.name;
        document.getElementById("customerContactDisplay").textContent = customer.contact;
        document.getElementById("customerEmailDisplay").textContent = customer.email;
        document.getElementById("customerAddressDisplay").textContent = customer.address;
        document.getElementById("customerBalanceDisplay").textContent = `$${customer.balance.toFixed(2)}`;
        
        document.getElementById("customerDetails").style.display = "block";
    }
}

function updateTotalBalance() {
    const element = document.getElementById("totalBalance");
    if (element) {
        element.textContent = `$${totalBalance.toFixed(2)}`;
    }
}

function updateTransactionReport() {
    document.getElementById("totalDeposit").textContent = `$${totalDeposits.toFixed(2)}`;
    document.getElementById("totalWithdraw").textContent = `$${totalWithdrawals.toFixed(2)}`;
    document.getElementById("totalTransfer").textContent = `$${totalTransfers.toFixed(2)}`;
}

// Utility Functions
function showMessage(message) {
    alert(message);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleClear() {
    if (confirm("Are you sure you want to clear all data?")) {
        // Reset all data structures
        customers = [];
        transactions = [];
        totalBalance = 0;
        totalDeposits = 0;
        totalWithdrawals = 0;
        totalTransfers = 0;

        // Reset UI elements
        document.getElementById("transactionTableBody").innerHTML = "";
        document.getElementById("customerBalanceList").innerHTML = "";
        document.getElementById("totalBalance").textContent = "$0.00";
        document.getElementById("totalDeposit").textContent = "$0.00";
        document.getElementById("totalWithdraw").textContent = "$0.00";
        document.getElementById("totalTransfer").textContent = "$0.00";

        // Reset forms if they exist
        const customerForm = document.getElementById("customerForm");
        const transactionForm = document.getElementById("transactionForm");
        if (customerForm) customerForm.reset();
        if (transactionForm) transactionForm.reset();

        // Hide customer details if visible
        const customerDetails = document.getElementById("customerDetails");
        if (customerDetails) customerDetails.style.display = "none";

        showMessage("All data cleared successfully.");
        localStorage.clear(); // Add this line
        showMessage("All data cleared successfully.");
    }
}

// Add these functions for history handling
// Update the view history functionality
function handleViewHistory() {
    const customerName = document.getElementById("customerNameDisplay").textContent;
    if (!customerName || customerName === "") {
        showMessage("Please select a customer first.");
        return;
    }

    const customerTransactions = transactions.filter(t => 
        t.customer === customerName || t.receiver === customerName
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const historyTable = document.getElementById("customerTransactionHistory");
    if (historyTable) {
        historyTable.innerHTML = customerTransactions
            .map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.customer}</td>
                    <td>${t.type}</td>
                    <td>${t.method}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                    <td>${t.receiver}</td>
                </tr>
            `).join("");
    }

    document.getElementById("mainTransactionHistory").style.display = "block";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

function handleHideHistory() {
    document.getElementById("mainTransactionHistory").style.display = "none";
}

// Add event listener for hide history button
document.getElementById("hideHistoryButton").addEventListener("click", handleHideHistory);

// Settings Management
const settings = {
    loadSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return this.getDefaultSettings();
    },

    getDefaultSettings() {
        return {
            theme: 'light',
            fontSize: 'medium',
            notifications: {
                enabled: false,
                sound: false,
                types: {
                    newTransaction: true,
                    lowBalance: true,
                    systemUpdates: true
                }
            },
            autoBackup: 'never',
            currency: {
                type: 'USD',
                showSymbol: true
            },
            security: {
                sessionTimeout: '30',
                requireConfirmation: true
            }
        };
    },

    saveSettings(settings) {
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    },

    applyTheme(theme) {
        document.body.className = theme;
    },

    applyFontSize(size) {
        document.documentElement.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[size] || '16px';
    }
};

// Initialize Settings
document.addEventListener('DOMContentLoaded', () => {
    const currentSettings = settings.loadSettings();

    // Theme
    document.getElementById('themeSelector').value = currentSettings.theme;
    settings.applyTheme(currentSettings.theme);

    // Font Size
    document.getElementById('fontSizeSelector').value = currentSettings.fontSize;
    settings.applyFontSize(currentSettings.fontSize);

    // Notifications
    document.getElementById('notificationToggle').checked = currentSettings.notifications.enabled;
    document.getElementById('soundToggle').checked = currentSettings.notifications.sound;
    document.getElementById('notifyNewTransaction').checked = currentSettings.notifications.types.newTransaction;
    document.getElementById('notifyLowBalance').checked = currentSettings.notifications.types.lowBalance;
    document.getElementById('notifySystemUpdates').checked = currentSettings.notifications.types.systemUpdates;

    // Auto Backup
    document.getElementById('autoBackupInterval').value = currentSettings.autoBackup;

    // Currency
    document.getElementById('currencySelector').value = currentSettings.currency.type;
    document.getElementById('showCurrencySymbol').checked = currentSettings.currency.showSymbol;

    // Security
    document.getElementById('sessionTimeout').value = currentSettings.security.sessionTimeout;
    document.getElementById('requireConfirmation').checked = currentSettings.security.requireConfirmation;

    // Event Listeners
    document.getElementById('themeSelector').addEventListener('change', (e) => {
        currentSettings.theme = e.target.value;
        settings.applyTheme(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
        currentSettings.fontSize = e.target.value;
        settings.applyFontSize(e.target.value);
        settings.saveSettings(currentSettings);
    });

    document.getElementById('notificationToggle').addEventListener('change', (e) => {
        currentSettings.notifications.enabled = e.target.checked;
        if (e.target.checked) {
            Notification.requestPermission();
        }
        settings.saveSettings(currentSettings);
    });

    // Export Data
    document.getElementById('exportDataButton').addEventListener('click', () => {
        const data = {
            settings: currentSettings,
            transactions: localStorage.getItem('transactions'),
            customers: localStorage.getItem('customers')
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });

    // Import Data
    document.getElementById('importDataButton').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.settings) {
                        settings.saveSettings(data.settings);
                        if (data.transactions) localStorage.setItem('transactions', data.transactions);
                        if (data.customers) localStorage.setItem('customers', data.customers);
                        location.reload();
                    }
                } catch (error) {
                    alert('Invalid backup file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Reset Settings
    document.getElementById('resetSettingsButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            const defaultSettings = settings.getDefaultSettings();
            settings.saveSettings(defaultSettings);
            location.reload();
        }
    });

    // Clear Data
    document.getElementById('clearDataButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    });
});

// Add recalculateTotals() call in these functions before updating UI:
function handleTransaction() {
    const customerName = document.getElementById("transactionCustomer").value;
    const transactionType = document.getElementById("transactionType").value;
    const transactionMethod = document.getElementById("transactionMethod").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const receiverName = document.getElementById("receiverName").value;

    if (!customerName || isNaN(amount) || amount <= 0) {
        showMessage("Please enter valid customer and amount.");
        return;
    }

    const customer = customers.find(c => c.name === customerName);
    if (!customer) {
        showMessage("Customer not found.");
        return;
    }

    switch(transactionType) {
        case "Withdrawal":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            customer.balance -= amount;
            totalWithdrawals += amount;
            break;
        case "Transfer":
            if (customer.balance < amount) {
                showMessage("Insufficient balance.");
                return;
            }
            if (!receiverName) {
                showMessage("Please enter receiver name for transfer.");
                return;
            }
            const receiver = customers.find(c => c.name === receiverName);
            if (!receiver) {
                showMessage("Receiver not found.");
                return;
            }
            customer.balance -= amount;
            receiver.balance += amount;
            totalTransfers += amount;
            break;
        case "Deposit":
            customer.balance += amount;
            totalDeposits += amount;
            break;
    }

    totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);

    const transactionData = {
        date: new Date().toLocaleDateString(),
        customer: customerName,
        type: transactionType,
        method: transactionMethod,
        amount: amount,
        receiver: receiverName || "N/A"
    };

    transactions.push(transactionData);

    recalculateTotals();
    updateTransactionTable();
    updateCustomerList();
    updateTotalBalance();
    updateTransactionReport();

    document.getElementById("transactionForm").reset();
    showMessage(`${transactionType} successful!`);
    saveDataToStorage();

    // Broadcast to MCP server
    sendMCPMessage({
        type: 'transaction',
        data: transactionData
    });
}

// Customer Registration
function handleRegister() {
    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const initialBalance = parseFloat(document.getElementById("initialBalance").value) || 0;

    if (!name || !contact) {
        showMessage("Please fill in all required fields.");
        return;
    }

    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showMessage("Customer already exists.");
