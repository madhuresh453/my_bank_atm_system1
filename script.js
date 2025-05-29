// Helper functions
function enhancedXOREncodeDecode(data, keyBase) {
    const dynamicKey = 0xA5A5 + keyBase;
    return data ^ dynamicKey;
}

function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ATMUser Class (JavaScript equivalent of C++ class)
class ATMUser {
    constructor(name, accountNumber, mobileNumber, balance, pin, securityQuestion, securityAnswer, email, address, imageDataUrl = '') {
        this.name = name;
        this.accountNumber = accountNumber;
        this.ifscCode = "BANK0001234"; // Fixed IFSC Code
        this.mobileNumber = mobileNumber;
        this.balance = parseFloat(balance);
        this.encryptedPin = enhancedXOREncodeDecode(parseInt(pin), accountNumber % 1000);
        this.securityQuestion = securityQuestion;
        this.securityAnswer = securityAnswer;
        this.email = email;
        this.address = address;
        this.lastLogin = getCurrentTimestamp();
        this.imageDataUrl = imageDataUrl || '';
    }

    getDecryptedPin() {
        return enhancedXOREncodeDecode(this.encryptedPin, this.accountNumber % 1000);
    }

    checkBalance() {
        return `Your Current Balance: ₹${this.balance.toFixed(2)}`;
    }

    displayDetails() {
        let details = `--- User Profile ---\n` +
               ` Name: ${this.name}\n` +
               ` Account Number: ${this.accountNumber}\n` +
               ` IFSC Code: ${this.ifscCode}\n` +
               ` Mobile Number: ${this.mobileNumber}\n` +
               ` Email: ${this.email}\n` +
               ` Address: ${this.address}\n` +
               ` Balance: ₹${this.balance.toFixed(2)}\n` +
               ` Last Login: ${this.lastLogin}\n` +
               `-------------------------`;
        if (this.imageDataUrl) {
            details = `[IMAGE]\n` + details;
        }
        return details;
    }

    displayDetailsNoBalance() {
        let details = `--- User Profile ---\n` +
               ` Name: ${this.name}\n` +
               ` Account Number: ${this.accountNumber}\n` +
               ` IFSC Code: ${this.ifscCode}\n` +
               ` Mobile Number: ${this.mobileNumber}\n` +
               ` Email: ${this.email}\n` +
               ` Address: ${this.address}\n` +
               ` Last Login: ${this.lastLogin}\n` +
               `-------------------------`;
        if (this.imageDataUrl) {
            details = `[IMAGE]\n` + details;
        }
        return details;
    }

    updateMobileNumber(mob_prev, mob_new) {
        if (mob_prev === this.mobileNumber) {
            if (mob_new.length === 10 && /^\d{10}$/.test(mob_new)) {
                this.mobileNumber = mob_new;
                this.printTransactionReceipt("Mobile Number Updated");
                return "Mobile number updated successfully!";
            } else {
                return "New mobile number must be exactly 10 digits!";
            }
        } else {
            return "Incorrect old mobile number!";
        }
    }

    changePIN(oldPIN, newPIN) {
        if (this.getDecryptedPin() === oldPIN) {
            if (newPIN >= 1000 && newPIN <= 9999) {
                this.encryptedPin = enhancedXOREncodeDecode(newPIN, this.accountNumber % 1000);
                this.printTransactionReceipt("PIN Changed");
                return "PIN changed successfully!";
            } else {
                return "New PIN must be a 4-digit number.";
            }
        } else {
            return "Incorrect old PIN!";
        }
    }

    cashWithdrawal(amount) {
        if (amount <= 0) {
            return "Invalid amount!";
        } else if (amount > this.balance) {
            return "Insufficient balance!";
        } else {
            this.balance -= amount;
            const transactionDetails = `Cash Withdrawal: ₹${amount.toFixed(2)}`;
            this.printTransactionReceipt(transactionDetails);
            transactionHistory[this.accountNumber].push(`${getCurrentTimestamp()} | ${transactionDetails} | Balance: ₹${this.balance.toFixed(2)}`);
            return `Withdrawal successful. Remaining balance: ₹${this.balance.toFixed(2)}`;
        }
    }

    cashDeposit(amount) {
        if (amount <= 0) {
            return "Invalid amount!";
        } else {
            this.balance += amount;
            const transactionDetails = `Cash Deposit: ₹${amount.toFixed(2)}`;
            this.printTransactionReceipt(transactionDetails);
            transactionHistory[this.accountNumber].push(`${getCurrentTimestamp()} | ${transactionDetails} | Balance: ₹${this.balance.toFixed(2)}`);
            return `Deposit successful. New balance: ₹${this.balance.toFixed(2)}`;
        }
    }

    viewTransactionHistory() {
        let history = "\n--- Transaction History ---\n";
        if (transactionHistory[this.accountNumber] && transactionHistory[this.accountNumber].length > 0) {
            history += transactionHistory[this.accountNumber].join('\n');
        } else {
            history += "No transaction history available.";
        }
        history += "\n---------------------------------";
        return history;
    }

    verifyPin(enteredPin) {
        return this.getDecryptedPin() === enteredPin;
    }

    verifySecurityAnswer(answer) {
        return answer.toLowerCase() === this.securityAnswer.toLowerCase();
    }

    serialize() {
        // Add imageDataUrl (base64) as the 11th field, escape commas
        const safeImage = this.imageDataUrl ? this.imageDataUrl.replace(/,/g, '[COMMA]') : '';
        return `${this.name},${this.accountNumber},${this.ifscCode},${this.mobileNumber},${this.balance},${this.encryptedPin},${this.securityQuestion},${this.securityAnswer},${this.email},${this.address},${safeImage}`;
    }

    static deserialize(line) {
        const tokens = line.split(',');
        // If image is present, join the rest as imageDataUrl (in case it contains commas)
        let imageDataUrl = '';
        if (tokens.length > 10) {
            imageDataUrl = tokens.slice(10).join(',').replace(/\[COMMA\]/g, ',');
        }
        if (tokens.length < 10) {
            throw new Error("Invalid user data format");
        }
        const user = new ATMUser(
            tokens[0],
            parseInt(tokens[1]),
            tokens[3],
            parseFloat(tokens[4]),
            null,
            tokens[6],
            tokens[7],
            tokens[8],
            tokens[9],
            imageDataUrl
        );
        user.ifscCode = tokens[2];
        user.encryptedPin = parseInt(tokens[5]);
        user.updateLastLogin();
        return user;
    }

    updateLastLogin() {
        this.lastLogin = getCurrentTimestamp();
    }

    exportTransactions(type) {
        const historyData = transactionHistory[this.accountNumber] || [];
        let content = '';
        let filename = '';

        if (type === 'txt') {
            filename = `transaction_history_${this.accountNumber}.txt`;
            content = historyData.join('\n');
            if (historyData.length === 0) content = "No transaction history available.";
        } else if (type === 'pdf') {
            filename = `transaction_history_${this.accountNumber}.pdf`;
            content = `Transaction History (PDF Export)\n`;
            content += `Account Number: ${this.accountNumber}\n`;
            content += `Name: ${this.name}\n`;
            content += `-----------------------------\n`;
            if (historyData.length > 0) {
                content += historyData.join('\n');
            } else {
                content += "No transaction history available.\n";
            }
        }

        if (historyData.length === 0 && type !== 'pdf') { // For PDF, we still generate a file with the header
            return `No transaction history available to export as ${type.toUpperCase()}.`;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return `Transaction history exported to: ${filename}`;
    }

    printTransactionHistory() {
        let printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Transaction History</title>');
        printWindow.document.write('<style>body { font-family: monospace; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>--- Printing Transaction History ---</h2>');
        if (transactionHistory[this.accountNumber] && transactionHistory[this.accountNumber].length > 0) {
            printWindow.document.write('<pre>' + transactionHistory[this.accountNumber].join('\n') + '</pre>');
            printWindow.document.write('<p>Transaction history sent to printer (simulated).</p>');
        } else {
            printWindow.document.write('<p>No transaction history available to print.</p>');
        }
        printWindow.document.write('-----------------------------------');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
        return "Printing transaction history (simulated).";
    }

    transferMoney(usersArray, recipientIdentifier, transferAmount, transferType) {
        let recipient = null;

        if (transferType === 'account') {
            const recipientAccNum = parseInt(recipientIdentifier);
            recipient = usersArray.find(u => u.accountNumber === recipientAccNum);
        } else if (transferType === 'name') {
            recipient = usersArray.find(u => u.name.toLowerCase() === recipientIdentifier.toLowerCase());
        }

        if (!recipient) {
            return { success: false, message: "Recipient not found." };
        }
        if (recipient.accountNumber === this.accountNumber) {
            return { success: false, message: "Cannot transfer to your own account." };
        }
        if (transferAmount <= 0) {
            return { success: false, message: "Invalid amount!" };
        }
        if (transferAmount > this.balance) {
            return { success: false, message: "Insufficient balance!" };
        }

        this.balance -= transferAmount;
        recipient.balance += transferAmount;

        const outMsg = `Transferred ₹${transferAmount.toFixed(2)} to ${recipient.name} (Acc: ${recipient.accountNumber}, IFSC: ${recipient.ifscCode})`;
        const inMsg = `Received ₹${transferAmount.toFixed(2)} from ${this.name} (Acc: ${this.accountNumber}, IFSC: ${this.ifscCode})`;

        transactionHistory[this.accountNumber].push(`${getCurrentTimestamp()} | ${outMsg} | Balance: ₹${this.balance.toFixed(2)}`);
        if (!transactionHistory[recipient.accountNumber]) {
            transactionHistory[recipient.accountNumber] = [];
        }
        transactionHistory[recipient.accountNumber].push(`${getCurrentTimestamp()} | ${inMsg} | Balance: ₹${recipient.balance.toFixed(2)}`);

        this.printTransactionReceipt(outMsg);
        recipient.printTransactionReceipt(inMsg); // In a real web app, this would be a notification/email

        return { success: true, message: "Transfer successful!" };
    }

    printTransactionReceipt(transaction) {
        const timestamp = getCurrentTimestamp();
        const receiptContent = `--- Transaction Receipt ---\n` +
                               ` Date/Time: ${timestamp}\n` +
                               ` Account Number: ${this.accountNumber}\n` +
                               ` Name: ${this.name}\n` +
                               ` Transaction: ${transaction}\n` +
                               ` Available Balance: ₹${this.balance.toFixed(2)}\n` +
                               ` Thank you for banking with us!\n` +
                               `-----------------------------------\n\n`;

        displayReceipt(receiptContent);

        // Simulate saving to a file (in browser, this would be a local download)
        // For demonstration, we'll just log it.
        console.log("Saving receipt to file (simulated):", receiptContent);
    }
}

// Global data and state
const USERS_STORAGE_KEY = 'atmUsers';
const TRANSACTION_HISTORY_STORAGE_KEY = 'atmTransactionHistory';
let users = [];
let transactionHistory = {}; // Using a plain object as a map for transaction history
let currentUser = null;
let currentRole = ''; // "admin", "manager", "cashier", or "" (not logged in)

const staffAccounts = [
    { username: "admin", password: "secure123", role: "admin" },
    { username: "manager1", password: "managerpass", role: "manager" },
    { username: "cashier1", password: "cashierpass", role: "cashier" }
];

// DOM Elements
const staffLoginSection = document.getElementById('staff-login');
const mainMenuSection = document.getElementById('main-menu');
const userManagementSection = document.getElementById('user-management');
const userDisplaySection = document.getElementById('user-display');
const userMenuSection = document.getElementById('user-menu');
const cashierMenuSection = document.getElementById('cashier-menu');

const staffUsernameInput = document.getElementById('staff-username');
const staffPasswordInput = document.getElementById('staff-password');
const staffLoginBtn = document.getElementById('staff-login-btn');
const staffLoginMessage = document.getElementById('staff-login-message');
const currentRoleSpan = document.getElementById('current-role');

// Main Menu Buttons
const viewAllUsersBtn = document.getElementById('view-all-users-btn');
const addUserBtn = document.getElementById('add-user-btn');
const selectUserByAccountBtn = document.getElementById('select-user-by-account-btn');
const deleteUserBtn = document.getElementById('delete-user-btn');
const findUserByNameBtn = document.getElementById('find-user-by-name-btn');
const forgotPinBtn = document.getElementById('forgot-pin-btn');
const logoutBtn = document.getElementById('logout-btn');
const totalMoneyBtn = document.getElementById('total-money-btn'); // Add this line

// User Management Forms
const addUserForm = document.getElementById('add-user-form');
const newUserNameInput = document.getElementById('new-user-name');
const newUserMobileInput = document.getElementById('new-user-mobile');
const newUserEmailInput = document.getElementById('new-user-email');
const newUserAddressInput = document.getElementById('new-user-address');
const newUserBalanceInput = document.getElementById('new-user-balance');
const newUserPinInput = document.getElementById('new-user-pin');
const newUserSQInput = document.getElementById('new-user-sq');
const newUserSAInput = document.getElementById('new-user-sa');
const newUserImageInput = document.getElementById('new-user-image');
const submitAddUserBtn = document.getElementById('submit-add-user-btn');
const addUserMessage = document.getElementById('add-user-message');

const selectUserForm = document.getElementById('select-user-form');
const selectAccNumInput = document.getElementById('select-acc-num');
const submitSelectUserBtn = document.getElementById('submit-select-user-btn');
const selectUserMessage = document.getElementById('select-user-message');

const deleteUserForm = document.getElementById('delete-user-form');
const deleteUserNameInput = document.getElementById('delete-user-name');
const deleteAccNumInput = document.getElementById('delete-acc-num');
const deletePinInput = document.getElementById('delete-pin');
const submitDeleteUserBtn = document.getElementById('submit-delete-user-btn');
const deleteUserMessage = document.getElementById('delete-user-message');

const findUserByNameForm = document.getElementById('find-user-by-name-form');
const findUserNameInput = document.getElementById('find-user-name');
const submitFindUserBtn = document.getElementById('submit-find-user-btn');
const findUserNameMessage = document.getElementById('find-user-name-message');

const forgotPinForm = document.getElementById('forgot-pin-form');
const forgotPinAccNumInput = document.getElementById('forgot-pin-acc-num');
const submitForgotPinBtn = document.getElementById('submit-forgot-pin-btn');
const forgotPinMessage = document.getElementById('forgot-pin-message');

const displayArea = document.getElementById('display-area');
const userDetailImage = document.getElementById('user-detail-image');

// User Menu Elements
const currentUserHeader = document.getElementById('current-user-header');
const userPinInput = document.getElementById('user-pin');
const authenticateUserBtn = document.getElementById('authenticate-user-btn');
const userAuthMessage = document.getElementById('user-auth-message');
const authenticatedUserOptions = document.getElementById('authenticated-user-options');

const checkBalanceBtn = document.getElementById('check-balance-btn');
const viewProfileBtn = document.getElementById('view-profile-btn');
const updateMobileBtn = document.getElementById('update-mobile-btn');
const withdrawCashBtn = document.getElementById('withdraw-cash-btn');
const changePinBtn = document.getElementById('change-pin-btn');
const viewTransactionsBtn = document.getElementById('view-transactions-btn');
const depositCashBtn = document.getElementById('deposit-cash-btn');
const exportTxtBtn = document.getElementById('export-txt-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const transferMoneyBtn = document.getElementById('transfer-money-btn');
const printHistoryBtn = document.getElementById('print-history-btn');
const exitUserMenuBtn = document.getElementById('exit-user-menu-btn');

const transactionInputArea = document.getElementById('transaction-input-area');
const transactionAmountInput = document.getElementById('transaction-amount');
const confirmTransactionBtn = document.getElementById('confirm-transaction-btn');
const cancelTransactionBtn = document.getElementById('cancel-transaction-btn');
const transactionMessage = document.getElementById('transaction-message');

const mobileUpdateInputArea = document.getElementById('mobile-update-input-area');
const oldMobileNumInput = document.getElementById('old-mobile-num');
const newMobileNumInput = document.getElementById('new-mobile-num');
const confirmMobileUpdateBtn = document.getElementById('confirm-mobile-update-btn');
const cancelMobileUpdateBtn = document.getElementById('cancel-mobile-update-btn');
const mobileUpdateMessage = document.getElementById('mobile-update-message');

const pinChangeInputArea = document.getElementById('pin-change-input-area');
const currentPinInput = document.getElementById('current-pin');
const newPinInput = document.getElementById('new-pin');
const confirmPinChangeBtn = document.getElementById('confirm-pin-change-btn');
const cancelPinChangeBtn = document.getElementById('cancel-pin-change-btn');
const pinChangeMessage = document.getElementById('pin-change-message');

const transferMoneyInputArea = document.getElementById('transfer-money-input-area');
const transferOptionSelect = document.getElementById('transfer-option');
const transferAccountInputDiv = document.getElementById('transfer-account-input');
const transferNameInputDiv = document.getElementById('transfer-name-input');
const transferRecipientAccInput = document.getElementById('transfer-recipient-acc');
const transferRecipientNameInput = document.getElementById('transfer-recipient-name');
const transferAmountInput = document.getElementById('transfer-amount');
const confirmTransferBtn = document.getElementById('confirm-transfer-btn');
const cancelTransferBtn = document.getElementById('cancel-transfer-btn');
const transferMessage = document.getElementById('transfer-message');

const receiptDisplay = document.getElementById('receipt-display');
const receiptContentPre = document.getElementById('receipt-content');
const transactionHistoryDisplay = document.getElementById('transaction-history-display');
const historyContentPre = document.getElementById('history-content');

const userMenuBackToMainBtn = document.getElementById('user-menu-back-to-main');

// Cashier Menu Elements
const cashierDepositBtn = document.getElementById('cashier-deposit-btn');
const cashierWithdrawBtn = document.getElementById('cashier-withdraw-btn');
const exitCashierMenuBtn = document.getElementById('exit-cashier-menu-btn');
const cashierTransactionInputArea = document.getElementById('cashier-transaction-input-area');
const cashierAccNumInput = document.getElementById('cashier-acc-num');
const cashierAmountInput = document.getElementById('cashier-amount');
const confirmCashierTransactionBtn = document.getElementById('confirm-cashier-transaction-btn');
const cancelCashierTransactionBtn = document.getElementById('cancel-cashier-transaction-btn');
const cashierTransactionMessage = document.getElementById('cashier-transaction-message');
const cashierMenuBackToMainBtn = document.getElementById('cashier-menu-back-to-main');

const exportAllUsersCustomBtn = document.getElementById('export-all-users-custom-btn');



// Utility Functions

function hideAllSections() {
    staffLoginSection.classList.add('hidden');
    mainMenuSection.classList.add('hidden');
    userManagementSection.classList.add('hidden');
    userDisplaySection.classList.add('hidden');
    userMenuSection.classList.add('hidden');
    cashierMenuSection.classList.add('hidden');
    // Hide all sub-forms within user-management and user-menu as well
    addUserForm.classList.add('hidden');
    selectUserForm.classList.add('hidden');
    deleteUserForm.classList.add('hidden');
    findUserByNameForm.classList.add('hidden');
    forgotPinForm.classList.add('hidden');
    transactionInputArea.classList.add('hidden');
    mobileUpdateInputArea.classList.add('hidden');
    pinChangeInputArea.classList.add('hidden');
    transferMoneyInputArea.classList.add('hidden');
    receiptDisplay.classList.add('hidden');
    transactionHistoryDisplay.classList.add('hidden');
    authenticatedUserOptions.classList.add('hidden');
    cashierTransactionInputArea.classList.add('hidden');
    userMenuBackToMainBtn.classList.add('hidden');
    cashierMenuBackToMainBtn.classList.add('hidden');
}

function showSection(sectionElement) {
    hideAllSections();
    sectionElement.classList.remove('hidden');
}

function displayMessage(element, message, isError = false) {
    element.textContent = message;
    element.style.color = isError ? 'red' : 'green';
}

function clearMessages() {
    const messages = [
        staffLoginMessage, addUserMessage, selectUserMessage, deleteUserMessage,
        findUserNameMessage, forgotPinMessage, userAuthMessage, transactionMessage,
        mobileUpdateMessage, pinChangeMessage, transferMessage, cashierTransactionMessage
    ];
    messages.forEach(msg => msg.textContent = '');
}

function loadUsers() {
    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    if (usersData) {
        const lines = usersData.split('\n');
        users = lines.map(line => {
            try {
                return ATMUser.deserialize(line);
            } catch (e) {
                console.warn("Skipping invalid user data:", e.message);
                return null;
            }
        }).filter(user => user !== null);
    } else {
        users = [];
    }
}

function saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, users.map(user => user.serialize()).join('\n'));
}

function loadTransactionHistory() {
    const historyData = localStorage.getItem(TRANSACTION_HISTORY_STORAGE_KEY);
    if (historyData) {
        transactionHistory = JSON.parse(historyData);
    } else {
        transactionHistory = {};
    }
}

function saveTransactionHistory() {
    localStorage.setItem(TRANSACTION_HISTORY_STORAGE_KEY, JSON.stringify(transactionHistory));
}

function generateAccountNumber() {
    const baseAcc = 124000000000;
    if (users.length === 0) {
        return baseAcc;
    }
    // Filter only numbers, in case of any data issues
    const accNums = users.map(u => Number(u.accountNumber)).filter(n => !isNaN(n));
    const maxAcc = Math.max(...accNums, baseAcc);
    return maxAcc + 1;
}

function findUserByAccount(accNum) {
    return users.find(user => user.accountNumber === accNum);
}

function findUserByName(name) {
    return users.find(user => user.name.toLowerCase() === name.toLowerCase());
}

function displayReceipt(receiptText) {
    receiptContentPre.textContent = receiptText;
    receiptDisplay.classList.remove('hidden');
}

function hideUserMenuOptions() {
    transactionInputArea.classList.add('hidden');
    mobileUpdateInputArea.classList.add('hidden');
    pinChangeInputArea.classList.add('hidden');
    transferMoneyInputArea.classList.add('hidden');
    receiptDisplay.classList.add('hidden');
    transactionHistoryDisplay.classList.add('hidden');
    clearMessages();
}

function updateMainMenuVisibility() {
    // Hide all main menu buttons initially
    viewAllUsersBtn.classList.add('hidden');
    addUserBtn.classList.add('hidden');
    selectUserByAccountBtn.classList.add('hidden');
    deleteUserBtn.classList.add('hidden');
    findUserByNameBtn.classList.add('hidden');
    forgotPinBtn.classList.add('hidden');
    totalMoneyBtn.classList.add('hidden'); // Add this line

    currentRoleSpan.textContent = currentRole;

    if (currentRole === 'admin') {
        viewAllUsersBtn.classList.remove('hidden');
        addUserBtn.classList.remove('hidden');
        selectUserByAccountBtn.classList.remove('hidden');
        findUserByNameBtn.classList.remove('hidden');
        forgotPinBtn.classList.remove('hidden');
    } else if (currentRole === 'manager') {
        viewAllUsersBtn.classList.remove('hidden');
        addUserBtn.classList.remove('hidden');
        deleteUserBtn.classList.remove('hidden');
        findUserByNameBtn.classList.remove('hidden');
        totalMoneyBtn.classList.remove('hidden'); // Show for manager
    } else if (currentRole === 'cashier') {
        // Cashier has a separate menu, so main menu buttons are handled differently
    }
}

// Event Listeners

// Staff Login
staffLoginBtn.addEventListener('click', () => {
    const username = staffUsernameInput.value;
    const password = staffPasswordInput.value;
    const staff = staffAccounts.find(s => s.username === username && s.password === password);

    if (staff) {
        currentRole = staff.role;
        displayMessage(staffLoginMessage, `Login successful. Role: ${currentRole}`, false);
        setTimeout(() => {
            if (currentRole === 'cashier') {
                showSection(cashierMenuSection);
            } else {
                showSection(mainMenuSection);
                updateMainMenuVisibility();
            }
            staffUsernameInput.value = '';
            staffPasswordInput.value = '';
        }, 1000);
    } else {
        displayMessage(staffLoginMessage, "Invalid username or password.", true);
    }
});

logoutBtn.addEventListener('click', () => {
    currentRole = '';
    currentUser = null;
    displayMessage(staffLoginMessage, "Logged out successfully.", false);
    showSection(staffLoginSection);
});

document.querySelectorAll('.back-to-main-menu').forEach(button => {
    button.addEventListener('click', () => {
        showSection(mainMenuSection);
        updateMainMenuVisibility();
        clearMessages();
        // Clear all input fields when returning to main menu
        const inputs = userManagementSection.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
        displayArea.textContent = ''; // Clear display area
    });
});

// Main Menu Actions
viewAllUsersBtn.addEventListener('click', () => {
    if (currentRole === 'manager' || currentRole === 'admin') {
        showSection(userDisplaySection);
        if (users.length === 0) {
            displayArea.textContent = "No users found.";
            userDetailImage.style.display = 'none';
        } else {
            // Only show image if one user is displayed
            if (users.length === 1 && users[0].imageDataUrl) {
                userDetailImage.src = users[0].imageDataUrl;
                userDetailImage.style.display = 'block';
            } else {
                userDetailImage.style.display = 'none';
            }
            displayArea.textContent = users.map(user => user.displayDetailsNoBalance()).join('\n\n');
        }
    } else {
        displayMessage(staffLoginMessage, "Access denied.", true);
    }
});

addUserBtn.addEventListener('click', () => {
    if (currentRole === 'manager' || currentRole === 'admin') {
        showSection(userManagementSection);
        addUserForm.classList.remove('hidden');
        clearMessages();
    } else {
        displayMessage(staffLoginMessage, "Access denied.", true);
    }
});

submitAddUserBtn.addEventListener('click', () => {
    loadUsers(); // Ensure users array is up-to-date
    const name = newUserNameInput.value.trim();
    const mobile = newUserMobileInput.value.trim();
    const email = newUserEmailInput.value.trim();
    const address = newUserAddressInput.value.trim();
    const balance = newUserBalanceInput.value.trim();
    const pin = newUserPinInput.value.trim();
    const sq = newUserSQInput.value.trim();
    const sa = newUserSAInput.value.trim();
    const imageFile = newUserImageInput.files[0];

    // Check required fields (image is optional)
    if (
        !name ||
        !mobile ||
        !email ||
        !address ||
        !balance ||
        !pin ||
        !sq ||
        !sa
    ) {
        displayMessage(addUserMessage, "Please fill all required fields before adding a new user.", true);
        return;
    }
    // Validate mobile number
    if (!/^\d{10}$/.test(mobile)) {
        displayMessage(addUserMessage, "Mobile number must be exactly 10 digits.", true);
        return;
    }
    // Validate PIN
    if (!/^\d{4}$/.test(pin)) {
        displayMessage(addUserMessage, "PIN must be a 4-digit number.", true);
        return;
    }
    // Validate balance
    if (isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
        displayMessage(addUserMessage, "Please enter a valid initial balance.", true);
        return;
    }

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDataUrl = e.target.result;
            addUserWithImage(imageDataUrl);
        };
        reader.readAsDataURL(imageFile);
    } else {
        addUserWithImage('');
    }

    function addUserWithImage(imageDataUrl) {
        const newAccountNumber = generateAccountNumber();
        const newUser = new ATMUser(
            name,
            newAccountNumber,
            mobile,
            parseFloat(balance),
            parseInt(pin),
            sq,
            sa,
            email,
            address,
            imageDataUrl
        );
        users.push(newUser);
        saveUsers();
        loadUsers();
        if (!transactionHistory[newAccountNumber]) {
            transactionHistory[newAccountNumber] = [];
        }
        saveTransactionHistory();

        displayMessage(addUserMessage, `User added successfully! Account Number: ${newAccountNumber}`, false);
        // Clear form
        newUserNameInput.value = '';
        newUserMobileInput.value = '';
        newUserEmailInput.value = '';
        newUserAddressInput.value = '';
        newUserBalanceInput.value = '';
        newUserPinInput.value = '';
        newUserSQInput.value = '';
        newUserSAInput.value = '';
        newUserImageInput.value = '';
    }
});

selectUserByAccountBtn.addEventListener('click', () => {
    if (currentRole === 'admin') {
        showSection(userManagementSection);
        selectUserForm.classList.remove('hidden');
        clearMessages();
    } else {
        displayMessage(staffLoginMessage, "Access denied.", true);
    }
});

submitSelectUserBtn.addEventListener('click', () => {
    const accNum = parseInt(selectAccNumInput.value);
    if (isNaN(accNum)) {
        displayMessage(selectUserMessage, "Please enter a valid account number.", true);
        return;
    }
    currentUser = findUserByAccount(accNum);
    if (currentUser) {
        displayMessage(selectUserMessage, `User found: ${currentUser.name}. Proceed to user menu.`, false);
        setTimeout(() => {
            showSection(userMenuSection);
            currentUserHeader.textContent = `Welcome, ${currentUser.name} (Acc: ${currentUser.accountNumber})`;
            userAuthMessage.textContent = 'Enter your PIN to access options.';
            authenticatedUserOptions.classList.add('hidden'); // Ensure options are hidden until authenticated
        }, 1000);
    } else {
        displayMessage(selectUserMessage, "User not found.", true);
    }
});

deleteUserBtn.addEventListener('click', () => {
    if (currentRole === 'manager') {
        showSection(userManagementSection);
        deleteUserForm.classList.remove('hidden');
        clearMessages();
    } else {
        displayMessage(staffLoginMessage, "Access denied.", true);
    }
});

submitDeleteUserBtn.addEventListener('click', () => {
    const name = deleteUserNameInput.value.trim();
    const pin = parseInt(deletePinInput.value);

    if (!name || isNaN(pin)) {
        displayMessage(deleteUserMessage, "Please enter user name and PIN.", true);
        return;
    }

    const initialLength = users.length;
    users = users.filter(user => !(user.name === name && user.verifyPin(pin)));

    if (users.length < initialLength) {
        saveUsers();
        // Remove transaction history for the deleted user(s)
        const deletedUsers = users.filter(user => user.name === name);
        deletedUsers.forEach(user => {
            if (transactionHistory[user.accountNumber]) {
                delete transactionHistory[user.accountNumber];
            }
        });
        saveTransactionHistory();
        displayMessage(deleteUserMessage, "User deleted successfully.", false);
    } else {
        displayMessage(deleteUserMessage, "User not found or invalid PIN.", true);
    }
    deleteUserNameInput.value = '';
    deleteAccNumInput.value = '';
    deletePinInput.value = '';
});

findUserByNameBtn.addEventListener('click', () => {
    if (currentRole === 'manager' || currentRole === 'admin') {
        showSection(userManagementSection);
        findUserByNameForm.classList.remove('hidden');
        clearMessages();
    } else {
        displayMessage(staffLoginMessage, "Access denied.", true);
    }
});

submitFindUserBtn.addEventListener('click', () => {
    const name = findUserNameInput.value.trim();
    if (!name) {
        displayMessage(findUserNameMessage, "Please enter a user name.", true);
        return;
    }
    const user = findUserByName(name);
    if (user) {
        displayMessage(findUserNameMessage, "User found. Displaying details:", false);
        if (user.imageDataUrl) {
            userDetailImage.src = user.imageDataUrl;
            userDetailImage.style.display = 'block';
        } else {
            userDetailImage.style.display = 'none';
        }
        if (currentRole === 'admin' || currentRole === 'manager') {
            displayArea.textContent = user.displayDetailsNoBalance();
        } else {
            displayArea.textContent = user.displayDetails();
        }
        showSection(userDisplaySection);
    } else {
        displayMessage(findUserNameMessage, "User not found with that name.", true);
        displayArea.textContent = '';
        userDetailImage.style.display = 'none';
    }
    findUserNameInput.value = '';
});

forgotPinBtn.addEventListener('click', () => {
    if (currentRole === 'admin') {
        showSection(userManagementSection);
        forgotPinForm.classList.remove('hidden');
        clearMessages();
    } else {
        displayMessage(staffLoginMessage, "Access denied.", true);
    }
});

submitForgotPinBtn.addEventListener('click', () => {
    const accNum = parseInt(forgotPinAccNumInput.value);
    if (isNaN(accNum)) {
        displayMessage(forgotPinMessage, "Please enter a valid account number.", true);
        return;
    }
    const user = findUserByAccount(accNum);
    if (user) {
        const securityAnswer = prompt(`Security Question: ${user.securityQuestion}\nEnter your answer:`);
        if (securityAnswer !== null && user.verifySecurityAnswer(securityAnswer)) {
            displayMessage(forgotPinMessage, `Your PIN is: ${user.getDecryptedPin()}. Please keep it confidential.`, false);
        } else {
            displayMessage(forgotPinMessage, "Incorrect security answer.", true);
        }
    } else {
        displayMessage(forgotPinMessage, "User not found.", true);
    }
    forgotPinAccNumInput.value = '';
});

// User Menu Authentication
authenticateUserBtn.addEventListener('click', () => {
    const enteredPin = parseInt(userPinInput.value);
    if (isNaN(enteredPin)) {
        displayMessage(userAuthMessage, "Please enter a 4-digit PIN.", true);
        return;
    }

    let pinVerified = currentUser.verifyPin(enteredPin);
    let attempts = 1;
    while (!pinVerified && attempts < 3) {
        const reEnterPin = prompt(`Incorrect PIN! ${3 - attempts} attempts remaining. Enter again:`);
        if (reEnterPin !== null && currentUser.verifyPin(parseInt(reEnterPin))) {
            pinVerified = true;
            break;
        }
        attempts++;
    }
    if (!pinVerified) {
        displayMessage(userAuthMessage, "Too many incorrect attempts. Exiting.", true);
        setTimeout(() => {
            showSection(mainMenuSection);
            updateMainMenuVisibility();
            currentUser = null;
            userPinInput.value = '';
        }, 1000);
        return;
    }

    currentUser.updateLastLogin();
    saveUsers();
    displayMessage(userAuthMessage, "PIN verified. Welcome!", false);
    authenticatedUserOptions.classList.remove('hidden');
    userPinInput.value = ''; // Clear PIN after successful login
});

// User Menu Options
checkBalanceBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    displayReceipt(currentUser.checkBalance());
});

viewProfileBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    // Show user image if available
    if (currentUser.imageDataUrl) {
        userDetailImage.src = currentUser.imageDataUrl;
        userDetailImage.style.display = 'block';
    } else {
        userDetailImage.style.display = 'none';
    }
    displayArea.textContent = currentUser.displayDetails();
    showSection(userDisplaySection);
});

updateMobileBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    mobileUpdateInputArea.classList.remove('hidden');
    clearMessages();
});

confirmMobileUpdateBtn.addEventListener('click', () => {
    const oldMob = oldMobileNumInput.value.trim();
    const newMob = newMobileNumInput.value.trim();
    const result = currentUser.updateMobileNumber(oldMob, newMob);
    displayMessage(mobileUpdateMessage, result, result.includes("Incorrect") || result.includes("Invalid"));
    if (result.includes("successfully")) {
        saveUsers();
    }
    oldMobileNumInput.value = '';
    newMobileNumInput.value = '';
});

cancelMobileUpdateBtn.addEventListener('click', () => {
    mobileUpdateInputArea.classList.add('hidden');
    clearMessages();
});

withdrawCashBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    transactionInputArea.classList.remove('hidden');
    confirmTransactionBtn.textContent = 'Withdraw';
    confirmTransactionBtn.dataset.action = 'withdraw';
    transactionAmountInput.value = '';
    clearMessages();
});

depositCashBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    transactionInputArea.classList.remove('hidden');
    confirmTransactionBtn.textContent = 'Deposit';
    confirmTransactionBtn.dataset.action = 'deposit';
    transactionAmountInput.value = '';
    clearMessages();
});

confirmTransactionBtn.addEventListener('click', () => {
    const amount = parseFloat(transactionAmountInput.value);
    const action = confirmTransactionBtn.dataset.action;
    let result = '';

    if (isNaN(amount)) {
        displayMessage(transactionMessage, "Please enter a valid amount.", true);
        return;
    }

    if (action === 'withdraw') {
        result = currentUser.cashWithdrawal(amount);
    } else if (action === 'deposit') {
        result = currentUser.cashDeposit(amount);
    }
    displayMessage(transactionMessage, result, result.includes("Invalid") || result.includes("Insufficient"));
    if (!(result.includes("Invalid") || result.includes("Insufficient"))) {
        saveUsers();
        saveTransactionHistory();
    }
});

cancelTransactionBtn.addEventListener('click', () => {
    transactionInputArea.classList.add('hidden');
    clearMessages();
});

changePinBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    pinChangeInputArea.classList.remove('hidden');
    clearMessages();
});

confirmPinChangeBtn.addEventListener('click', () => {
    const oldPIN = parseInt(currentPinInput.value);
    const newPIN = parseInt(newPinInput.value);

    if (isNaN(oldPIN) || isNaN(newPIN)) {
        displayMessage(pinChangeMessage, "Please enter valid PINs.", true);
        return;
    }

    const result = currentUser.changePIN(oldPIN, newPIN);
    displayMessage(pinChangeMessage, result, result.includes("Incorrect") || result.includes("New PIN must be"));
    if (result.includes("successfully")) {
        saveUsers();
    }
    currentPinInput.value = '';
    newPinInput.value = '';
});

cancelPinChangeBtn.addEventListener('click', () => {
    pinChangeInputArea.classList.add('hidden');
    clearMessages();
});

viewTransactionsBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    historyContentPre.textContent = currentUser.viewTransactionHistory();
    transactionHistoryDisplay.classList.remove('hidden');
});

exportTxtBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    const result = currentUser.exportTransactions('txt');
    displayReceipt(result); // Display success/failure message in receipt area
});

exportPdfBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    const result = currentUser.exportTransactions('pdf');
    displayReceipt(result); // Display success/failure message in receipt area
});

printHistoryBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    const result = currentUser.printTransactionHistory();
    displayReceipt(result);
});

transferMoneyBtn.addEventListener('click', () => {
    hideUserMenuOptions();
    transferMoneyInputArea.classList.remove('hidden');
    transferOptionSelect.value = 'account'; // Default to account number
    transferAccountInputDiv.classList.remove('hidden');
    transferNameInputDiv.classList.add('hidden');
    transferRecipientAccInput.value = '';
    transferRecipientNameInput.value = '';
    transferAmountInput.value = '';
    clearMessages();
});

transferOptionSelect.addEventListener('change', () => {
    if (transferOptionSelect.value === 'account') {
        transferAccountInputDiv.classList.remove('hidden');
        transferNameInputDiv.classList.add('hidden');
    } else {
        transferAccountInputDiv.classList.add('hidden');
        transferNameInputDiv.classList.remove('hidden');
    }
});

confirmTransferBtn.addEventListener('click', () => {
    const transferType = transferOptionSelect.value;
    let recipientIdentifier;
    if (transferType === 'account') {
        recipientIdentifier = transferRecipientAccInput.value.trim();
        if (isNaN(parseInt(recipientIdentifier))) {
            displayMessage(transferMessage, "Please enter a valid recipient account number.", true);
            return;
        }
    } else {
        recipientIdentifier = transferRecipientNameInput.value.trim();
        if (!recipientIdentifier) {
            displayMessage(transferMessage, "Please enter a recipient name.", true);
            return;
        }
    }
    const amount = parseFloat(transferAmountInput.value);

    if (isNaN(amount) || amount <= 0) {
        displayMessage(transferMessage, "Please enter a valid amount to transfer.", true);
        return;
    }

    const result = currentUser.transferMoney(users, recipientIdentifier, amount, transferType);
    displayMessage(transferMessage, result.message, !result.success);
    if (result.success) {
        saveUsers();
        saveTransactionHistory();
    }
    transferRecipientAccInput.value = '';
    transferRecipientNameInput.value = '';
    transferAmountInput.value = '';
});

cancelTransferBtn.addEventListener('click', () => {
    transferMoneyInputArea.classList.add('hidden');
    clearMessages();
});

exitUserMenuBtn.addEventListener('click', () => {
    currentUser = null;
    displayMessage(userAuthMessage, "Exiting user menu.", false);
    setTimeout(() => {
        showSection(mainMenuSection);
        updateMainMenuVisibility();
        userPinInput.value = ''; // Clear PIN
    }, 1000);
});

userMenuBackToMainBtn.addEventListener('click', () => {
    currentUser = null;
    showSection(mainMenuSection);
    updateMainMenuVisibility();
    clearMessages();
    userPinInput.value = '';
});

// Cashier Menu
cashierDepositBtn.addEventListener('click', () => {
    hideAllSections();
    cashierMenuSection.classList.remove('hidden');
    cashierTransactionInputArea.classList.remove('hidden');
    confirmCashierTransactionBtn.textContent = 'Deposit';
    confirmCashierTransactionBtn.dataset.action = 'deposit';
    cashierAccNumInput.value = '';
    cashierAmountInput.value = '';
    clearMessages();
});

cashierWithdrawBtn.addEventListener('click', () => {
    hideAllSections();
    cashierMenuSection.classList.remove('hidden');
    cashierTransactionInputArea.classList.remove('hidden');
    confirmCashierTransactionBtn.textContent = 'Withdraw';
    confirmCashierTransactionBtn.dataset.action = 'withdraw';
    cashierAccNumInput.value = '';
    cashierAmountInput.value = '';
    clearMessages();
});

confirmCashierTransactionBtn.addEventListener('click', () => {
    const accNum = parseInt(cashierAccNumInput.value);
    const amount = parseFloat(cashierAmountInput.value);
    const action = confirmCashierTransactionBtn.dataset.action;

    if (isNaN(accNum) || isNaN(amount) || amount <= 0) {
        displayMessage(cashierTransactionMessage, "Please enter a valid account number and amount.", true);
        return;
    }

    const user = findUserByAccount(accNum);
    if (!user) {
        displayMessage(cashierTransactionMessage, "User not found.", true);
        return;
    }

    let result = '';
    if (action === 'deposit') {
        result = user.cashDeposit(amount);
    } else if (action === 'withdraw') {
        result = user.cashWithdrawal(amount);
    }

    displayMessage(cashierTransactionMessage, result, result.includes("Invalid") || result.includes("Insufficient"));
    if (!(result.includes("Invalid") || result.includes("Insufficient"))) {
        saveUsers();
        saveTransactionHistory();
    }
});

cancelCashierTransactionBtn.addEventListener('click', () => {
    cashierTransactionInputArea.classList.add('hidden');
    clearMessages();
});

exitCashierMenuBtn.addEventListener('click', () => {
    showSection(mainMenuSection);
    updateMainMenuVisibility();
    clearMessages();
});

