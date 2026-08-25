/* ============================================================
   DIGITAL BANKING SYSTEM
   Firebase Authentication + Firestore
   Virtual Money System
   ============================================================ */


/* ============================================================
   1. FIREBASE IMPORTS
   ============================================================ */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    runTransaction,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   2. FIREBASE CONFIG
   ============================================================ */

const firebaseConfig = {

    apiKey: "AIzaSyCPqN_xpObQWGUkYGO4KCFmjANkrPxBNmQ",

    authDomain:
        "digital-banking-system-dd918.firebaseapp.com",

    projectId:
        "digital-banking-system-dd918",

    storageBucket:
        "digital-banking-system-dd918.firebasestorage.app",

    messagingSenderId:
        "955494889382",

    appId:
        "1:955494889382:web:2aaf76e2a78ac0918cc167"
};


/* ============================================================
   3. INITIALIZE FIREBASE
   ============================================================ */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* ============================================================
   4. GLOBAL VARIABLES
   ============================================================ */

let currentUser = null;

let unsubscribeUser = null;
let unsubscribeTransactions = null;


/* ============================================================
   5. HELPER FUNCTIONS
   ============================================================ */


/*
   Get element safely
*/

function $(id) {
    return document.getElementById(id);
}


/*
   Show toast notification
*/

function showToast(message, type = "success") {

    let container = $("toastContainer");

    if (!container) {

        container = document.createElement("div");

        container.id = "toastContainer";

        container.className = "toast-container";

        document.body.appendChild(container);
    }


    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerHTML = `
        <span>${escapeHTML(message)}</span>
    `;


    container.appendChild(toast);


    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform = "translateX(30px)";

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3000);
}


/*
   Prevent HTML injection
*/

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/*
   Format currency
*/

function formatMoney(amount) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 2

    }).format(Number(amount) || 0);
}


/*
   Generate virtual account number
*/

function generateAccountNumber() {

    const random =
        Math.floor(
            10000000 +
            Math.random() * 90000000
        );

    return String(random);
}


/*
   Get current page
*/

function getCurrentPage() {

    return window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();
}


/*
   Redirect
*/

function goTo(page) {

    window.location.href = page;
}


/* ============================================================
   6. CUSTOMER REGISTRATION
   ============================================================ */

async function registerCustomer() {

    const name =
        $("registerName")?.value.trim();

    const email =
        $("registerEmail")?.value.trim();

    const password =
        $("registerPassword")?.value;

    const confirmPassword =
        $("confirmPassword")?.value;


    if (!name || !email || !password) {

        showToast(
            "Please fill all required fields.",
            "error"
        );

        return;
    }


    if (password !== confirmPassword) {

        showToast(
            "Passwords do not match.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showToast(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    try {

        const button =
            $("registerButton");

        if (button) {
            button.disabled = true;
            button.textContent = "Creating Account...";
        }


        /*
           Create Firebase Authentication account
        */

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        /*
           Generate account number
        */

        const accountNumber =
            generateAccountNumber();


        /*
           Starting virtual balance

           This is NOT real money.
        */

        const initialBalance = 10000;


        /*
           Create Firestore customer profile
        */

        await setDoc(
            doc(db, "users", user.uid),
            {

                uid: user.uid,

                name: name,

                email: email,

                accountNumber:
                    accountNumber,

                balance:
                    initialBalance,

                role: "customer",

                status: "active",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );


        /*
           Create welcome transaction
        */

        const transactionRef =
            doc(
                collection(
                    db,
                    "transactions"
                )
            );


        await setDoc(
            transactionRef,
            {

                transactionId:
                    transactionRef.id,

                type: "CREDIT",

                category: "WELCOME_BONUS",

                amount:
                    initialBalance,

                fromUid: null,

                toUid:
                    user.uid,

                fromAccount: null,

                toAccount:
                    accountNumber,

                description:
                    "Welcome bonus",

                createdAt:
                    serverTimestamp()
            }
        );


        showToast(
            "Account created successfully!"
        );


        setTimeout(() => {

            goTo(
                "customer-dashboard.html"
            );

        }, 1000);


    } catch (error) {

        console.error(error);

        handleFirebaseError(error);


    } finally {

        const button =
            $("registerButton");

        if (button) {

            button.disabled = false;

            button.textContent =
                "Create Account";
        }
    }
}


/* ============================================================
   7. CUSTOMER LOGIN
   ============================================================ */

async function loginCustomer() {

    const email =
        $("loginEmail")?.value.trim();

    const password =
        $("loginPassword")?.value;


    if (!email || !password) {

        showToast(
            "Enter email and password.",
            "error"
        );

        return;
    }


    try {

        const button =
            $("loginButton");

        if (button) {

            button.disabled = true;

            button.textContent =
                "Signing in...";
        }


        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        const userSnapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );


        if (!userSnapshot.exists()) {

            await signOut(auth);

            showToast(
                "Customer profile not found.",
                "error"
            );

            return;
        }


        const userData =
            userSnapshot.data();


        if (userData.status === "blocked") {

            await signOut(auth);

            showToast(
                "Your account has been blocked.",
                "error"
            );

            return;
        }


        /*
           Prevent admin from entering customer dashboard
        */

        if (userData.role === "admin") {

            await signOut(auth);

            showToast(
                "Please use the administration login.",
                "warning"
            );

            return;
        }


        showToast(
            "Login successful!"
        );


        setTimeout(() => {

            goTo(
                "customer-dashboard.html"
            );

        }, 700);


    } catch (error) {

        console.error(error);

        handleFirebaseError(error);


    } finally {

        const button =
            $("loginButton");

        if (button) {

            button.disabled = false;

            button.textContent =
                "Login";
        }
    }
}


/* ============================================================
   8. ADMIN LOGIN
   ============================================================ */

async function loginAdmin() {

    const email =
        $("adminEmail")?.value.trim();

    const password =
        $("adminPassword")?.value;


    if (!email || !password) {

        showToast(
            "Enter administrator credentials.",
            "error"
        );

        return;
    }


    try {

        const button =
            $("adminLoginButton");

        if (button) {

            button.disabled = true;

            button.textContent =
                "Authenticating...";
        }


        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        /* =====================================================
           CHECK ADMINS COLLECTION
        ===================================================== */

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "admins",
                    user.uid
                )
            );


        if (!snapshot.exists()) {

            await signOut(auth);

            showToast(
                "You do not have administrator privileges.",
                "error"
            );

            return;
        }


        const data =
            snapshot.data();


        if (data.role !== "admin") {

            await signOut(auth);

            showToast(
                "You do not have administrator privileges.",
                "error"
            );

            return;
        }


        if (data.status === "blocked") {

            await signOut(auth);

            showToast(
                "Administrator account is blocked.",
                "error"
            );

            return;
        }


        showToast(
            "Administrator login successful!"
        );


        setTimeout(() => {

            goTo(
                "admin.html"
            );

        }, 700);


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );

        handleFirebaseError(error);


    } finally {

        const button =
            $("adminLoginButton");

        if (button) {

            button.disabled = false;

            button.textContent =
                "Administrator Login";
        }
    }
}
/* ============================================================
   9. AUTH STATE
   ============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser = user;


        if (!user) {

            stopRealtimeListeners();

            return;
        }


        console.log(
            "Authenticated:",
            user.email
        );
    }
);


/* ============================================================
   10. CUSTOMER DASHBOARD
   ============================================================ */

async function loadCustomerDashboard() {

    if (!auth.currentUser) {

        goTo("customer-login.html");

        return;
    }


    const uid =
        auth.currentUser.uid;


    /*
       Real-time customer profile
    */

    unsubscribeUser =
        onSnapshot(

            doc(
                db,
                "users",
                uid
            ),

            (snapshot) => {

                if (!snapshot.exists()) {

                    showToast(
                        "Customer profile not found.",
                        "error"
                    );

                    return;
                }


                const data =
                    snapshot.data();


                updateCustomerUI(data);
            },

            (error) => {

                console.error(error);

                showToast(
                    "Unable to load account.",
                    "error"
                );
            }
        );


    /*
       Real-time transactions
    */

    const transactionsQuery =
        query(

            collection(
                db,
                "transactions"
            ),

            where(
                "toUid",
                "==",
                uid
            ),

            orderBy(
                "createdAt",
                "desc"
            ),

            limit(20)
        );


    unsubscribeTransactions =
        onSnapshot(

            transactionsQuery,

            (snapshot) => {

                loadIncomingTransactions(
                    snapshot
                );
            },

            (error) => {

                console.error(error);

                /*
                   If Firestore asks for an index,
                   Firebase console will provide
                   an index creation link.
                */

                showToast(
                    "Unable to load transactions.",
                    "error"
                );
            }
        );


    /*
       Also load sent transactions
    */

    loadSentTransactions(uid);
}


/* ============================================================
   11. UPDATE CUSTOMER UI
   ============================================================ */

function updateCustomerUI(data) {

    /*
       Customer name
    */

    const nameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    nameElements.forEach(
        element => {

            element.textContent =
                data.name || "Customer";
        }
    );


    /*
       Email
    */

    const emailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    emailElements.forEach(
        element => {

            element.textContent =
                data.email || "";
        }
    );


    /*
       Account number
    */

    const accountElements =
        document.querySelectorAll(
            "[data-account-number]"
        );


    accountElements.forEach(
        element => {

            element.textContent =
                data.accountNumber || "--------";
        }
    );


    /*
       Balance
    */

    const balanceElements =
        document.querySelectorAll(
            "[data-balance]"
        );


    balanceElements.forEach(
        element => {

            element.textContent =
                formatMoney(
                    data.balance
                );
        }
    );


    /*
       Avatar initials
    */

    const avatarElements =
        document.querySelectorAll(
            "[data-user-avatar]"
        );


    avatarElements.forEach(
        element => {

            element.textContent =
                getInitials(
                    data.name
                );
        }
    );
}


/* ============================================================
   12. GET INITIALS
   ============================================================ */

function getInitials(name) {

    if (!name) {
        return "U";
    }


    return name
        .split(" ")
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
                    .toUpperCase()
        )
        .join("");
}


/* ============================================================
   13. SEND MONEY
   ============================================================ */

async function sendMoney() {

    if (!auth.currentUser) {

        showToast(
            "Please login first.",
            "error"
        );

        return;
    }


    const recipientAccount =
        $("recipientAccount")
            ?.value.trim();


    const amount =
        Number(
            $("transferAmount")?.value
        );


    const description =
        $("transferDescription")
            ?.value.trim() ||
        "Money transfer";


    /*
       Validation
    */

    if (!recipientAccount) {

        showToast(
            "Enter recipient account number.",
            "error"
        );

        return;
    }


    if (!amount || amount <= 0) {

        showToast(
            "Enter a valid amount.",
            "error"
        );

        return;
    }


    if (amount > 1000000) {

        showToast(
            "Maximum transfer limit is ₹10,00,000.",
            "error"
        );

        return;
    }


    try {

        const button =
            $("sendMoneyButton");

        if (button) {

            button.disabled = true;

            button.textContent =
                "Processing...";
        }


        /*
           Current user
        */

        const senderUid =
            auth.currentUser.uid;


        /*
           Find recipient
        */

        const recipientQuery =
            query(

                collection(
                    db,
                    "users"
                ),

                where(
                    "accountNumber",
                    "==",
                    recipientAccount
                ),

                limit(1)
            );


        const recipientSnapshot =
            await getDocs(
                recipientQuery
            );


        if (recipientSnapshot.empty) {

            showToast(
                "Recipient account not found.",
                "error"
            );

            return;
        }


        const recipientDoc =
            recipientSnapshot.docs[0];


        const recipientUid =
            recipientDoc.id;


        /*
           Prevent self-transfer
        */

        if (recipientUid === senderUid) {

            showToast(
                "You cannot transfer money to yourself.",
                "error"
            );

            return;
        }


        /*
           Sender document
        */

        const senderRef =
            doc(
                db,
                "users",
                senderUid
            );


        /*
           Recipient document
        */

        const recipientRef =
            doc(
                db,
                "users",
                recipientUid
            );


        /*
           Atomic Firestore transaction.

           This is VERY important.

           Both balances change together.
        */

        await runTransaction(
            db,
            async (transaction) => {

                const senderSnapshot =
                    await transaction.get(
                        senderRef
                    );


                const recipientSnapshot =
                    await transaction.get(
                        recipientRef
                    );


                if (
                    !senderSnapshot.exists() ||
                    !recipientSnapshot.exists()
                ) {

                    throw new Error(
                        "Account not found."
                    );
                }


                const senderData =
                    senderSnapshot.data();


                const recipientData =
                    recipientSnapshot.data();


                const senderBalance =
                    Number(
                        senderData.balance || 0
                    );


                const recipientBalance =
                    Number(
                        recipientData.balance || 0
                    );


                /*
                   Check balance
                */

                if (
                    senderBalance < amount
                ) {

                    throw new Error(
                        "INSUFFICIENT_BALANCE"
                    );
                }


                /*
                   Check recipient status
                */

                if (
                    recipientData.status ===
                    "blocked"
                ) {

                    throw new Error(
                        "RECIPIENT_BLOCKED"
                    );
                }


                /*
                   New balances
                */

                const newSenderBalance =
                    senderBalance - amount;


                const newRecipientBalance =
                    recipientBalance + amount;


                /*
                   Update sender
                */

                transaction.update(
                    senderRef,
                    {

                        balance:
                            newSenderBalance,

                        updatedAt:
                            serverTimestamp()
                    }
                );


                /*
                   Update recipient
                */

                transaction.update(
                    recipientRef,
                    {

                        balance:
                            newRecipientBalance,

                        updatedAt:
                            serverTimestamp()
                    }
                );


                /*
                   Transaction record

                   We create ONE transaction
                   containing sender + recipient.
                */

                const transactionRef =
                    doc(
                        collection(
                            db,
                            "transactions"
                        )
                    );


                transaction.set(
                    transactionRef,
                    {

                        transactionId:
                            transactionRef.id,

                        type: "TRANSFER",

                        amount: amount,

                        fromUid:
                            senderUid,

                        toUid:
                            recipientUid,

                        fromAccount:
                            senderData.accountNumber,

                        toAccount:
                            recipientData.accountNumber,

                        description:
                            description,

                        createdAt:
                            serverTimestamp()
                    }
                );
            }
        );


        showToast(
            `Successfully sent ${formatMoney(amount)}!`
        );


        /*
           Clear form
        */

        if ($("recipientAccount")) {
            $("recipientAccount").value = "";
        }

        if ($("transferAmount")) {
            $("transferAmount").value = "";
        }

        if ($("transferDescription")) {
            $("transferDescription").value = "";
        }


        /*
           Close transfer modal if available
        */

        closeModal();


    } catch (error) {

        console.error(
            "Transfer error:",
            error
        );


        if (
            error.message ===
            "INSUFFICIENT_BALANCE"
        ) {

            showToast(
                "Insufficient balance.",
                "error"
            );

        } else if (
            error.message ===
            "RECIPIENT_BLOCKED"
        ) {

            showToast(
                "Recipient account is blocked.",
                "error"
            );

        } else {

            showToast(
                "Transfer failed. Please try again.",
                "error"
            );
        }


    } finally {

        const button =
            $("sendMoneyButton");

        if (button) {

            button.disabled = false;

            button.textContent =
                "Send Money";
        }
    }
}


/* ============================================================
   14. LOAD INCOMING TRANSACTIONS
   ============================================================ */

function loadIncomingTransactions(
    snapshot
) {

    const container =
        $("transactionList");


    if (!container) {
        return;
    }


    /*
       Don't remove everything if we also
       display sent transactions elsewhere.
    */

    const transactions = [];


    snapshot.forEach(
        docSnapshot => {

            transactions.push({

                id:
                    docSnapshot.id,

                ...docSnapshot.data(),

                direction:
                    "received"
            });
        }
    );


    renderTransactions(
        transactions,
        container
    );
}


/* ============================================================
   15. LOAD SENT TRANSACTIONS
   ============================================================ */

async function loadSentTransactions(uid) {

    const container =
        $("transactionList");


    if (!container) {
        return;
    }


    try {

        const sentQuery =
            query(

                collection(
                    db,
                    "transactions"
                ),

                where(
                    "fromUid",
                    "==",
                    uid
                ),

                orderBy(
                    "createdAt",
                    "desc"
                ),

                limit(20)
            );


        const snapshot =
            await getDocs(
                sentQuery
            );


        const transactions = [];


        snapshot.forEach(
            docSnapshot => {

                transactions.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data(),

                    direction:
                        "sent"
                });
            }
        );


        renderTransactions(
            transactions,
            container
        );


    } catch (error) {

        console.error(error);
    }
}


/* ============================================================
   16. RENDER TRANSACTIONS
   ============================================================ */

function renderTransactions(
    transactions,
    container
) {

    if (!transactions.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ↔
                </div>

                <h3>No transactions yet</h3>

                <p>
                    Your transaction history
                    will appear here.
                </p>

            </div>

        `;

        return;
    }


    /*
       Sort newest first
    */

    transactions.sort(
        (a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;
        }
    );


    container.innerHTML =
        transactions
            .map(
                transaction => {

                    const isSent =
                        transaction.direction ===
                        "sent";


                    const amount =
                        Number(
                            transaction.amount || 0
                        );


                    const sign =
                        isSent ? "-" : "+";


                    const amountClass =
                        isSent
                            ? "amount-negative"
                            : "amount-positive";


                    const otherAccount =
                        isSent
                            ? transaction.toAccount
                            : transaction.fromAccount;


                    return `

                        <div class="transaction">

                            <div class="transaction-left">

                                <div class="transaction-icon">

                                    ${isSent
                                        ? "↑"
                                        : "↓"}

                                </div>


                                <div>

                                    <div class="transaction-name">

                                        ${
                                            isSent
                                                ? "Money Sent"
                                                : "Money Received"
                                        }

                                    </div>


                                    <div class="transaction-date">

                                        ${
                                            otherAccount
                                                ? "Account • " +
                                                  escapeHTML(
                                                      otherAccount
                                                  )
                                                : "Welcome Bonus"
                                        }

                                    </div>

                                </div>

                            </div>


                            <div>

                                <div class="transaction-amount ${amountClass}">

                                    ${sign}${formatMoney(amount)}

                                </div>

                                <div class="transaction-date">

                                    ${escapeHTML(
                                        transaction.description ||
                                        "Transaction"
                                    )}

                                </div>

                            </div>

                        </div>

                    `;
                }
            )
            .join("");
}


/* ============================================================
   17. ADMIN DASHBOARD
   ============================================================ */

async function loadAdminDashboard() {

    if (!auth.currentUser) {

        goTo("admin-login.html");

        return;
    }


    try {

        /* ========================================================
           CHECK ADMIN ACCOUNT
        ======================================================== */

        const adminSnapshot =
            await getDoc(
                doc(
                    db,
                    "admins",
                    auth.currentUser.uid
                )
            );


        if (!adminSnapshot.exists()) {

            await signOut(auth);

            goTo("admin-login.html");

            return;
        }


        const adminData =
            adminSnapshot.data();


        if (adminData.role !== "admin") {

            await signOut(auth);

            showToast(
                "Unauthorized access.",
                "error"
            );

            goTo("customer-login.html");

            return;
        }


        /* ========================================================
           LOAD ALL CUSTOMERS
        ======================================================== */

        const customersSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "accounts"
                    ),

                    where(
                        "role",
                        "==",
                        "customer"
                    )
                )
            );


        const customers = [];


        customersSnapshot.forEach(
            documentSnapshot => {

                customers.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()
                });

            }
        );


        /* ========================================================
           UPDATE ADMIN STATISTICS
        ======================================================== */

        updateAdminStatistics(
            customers
        );


        /* ========================================================
           RENDER CUSTOMER TABLE
        ======================================================== */

        renderCustomers(
            customers
        );


    } catch (error) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );

        showToast(
            "Unable to load administration dashboard.",
            "error"
        );
    }
}


/* ============================================================
   18. ADMIN STATISTICS
   ============================================================ */

function updateAdminStatistics(
    customers
) {

    const totalCustomers =
        customers.length;


    const activeCustomers =
        customers.filter(
            customer =>
                customer.status === "active"
        ).length;


    const blockedCustomers =
        customers.filter(
            customer =>
                customer.status === "blocked"
        ).length;


    const totalVirtualMoney =
        customers.reduce(
            (
                total,
                customer
            ) =>
                total +
                Number(
                    customer.balance || 0
                ),
            0
        );


    setText(
        "totalCustomers",
        totalCustomers
    );


    setText(
        "activeCustomers",
        activeCustomers
    );


    setText(
        "blockedCustomers",
        blockedCustomers
    );


    setText(
        "totalVirtualMoney",
        formatMoney(
            totalVirtualMoney
        )
    );
}


/* ============================================================
   19. RENDER CUSTOMER TABLE
   ============================================================ */

function renderCustomers(
    customers
) {

    const tableBody =
        $("customerTableBody");


    if (!tableBody) {
        return;
    }


    if (!customers.length) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="6"
                    style="text-align:center">

                    No customers found.

                </td>

            </tr>

        `;

        return;
    }


    tableBody.innerHTML =
        customers
            .map(
                customer => {

                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    customer.fullName ||
                                    "Unknown"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    customer.email ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    customer.accountNumber ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${formatMoney(
                                    customer.balance || 0
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    customer.status ||
                                    "unknown"
                                )}
                            </td>

                        </tr>

                    `;
                }
            )
            .join("");
}

/* ============================================================
   20. BLOCK CUSTOMER
   ============================================================ */

async function blockCustomer(
    uid
) {

    if (!confirm(
        "Are you sure you want to block this customer?"
    )) {

        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "users",
                uid
            ),
            {

                status:
                    "blocked",

                updatedAt:
                    serverTimestamp()
            }
        );


        showToast(
            "Customer blocked successfully."
        );


        loadAdminDashboard();


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to block customer.",
            "error"
        );
    }
}


/* ============================================================
   21. UNBLOCK CUSTOMER
   ============================================================ */

async function unblockCustomer(
    uid
) {

    try {

        await updateDoc(
            doc(
                db,
                "users",
                uid
            ),
            {

                status:
                    "active",

                updatedAt:
                    serverTimestamp()
            }
        );


        showToast(
            "Customer account activated."
        );


        loadAdminDashboard();


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to activate customer.",
            "error"
        );
    }
}


/* ============================================================
   22. LOGOUT
   ============================================================ */

async function logout() {

    try {

        stopRealtimeListeners();

        await signOut(auth);

        showToast(
            "Logged out successfully."
        );


        setTimeout(() => {

            goTo("index.html");

        }, 500);


    } catch (error) {

        console.error(error);

        showToast(
            "Logout failed.",
            "error"
        );
    }
}


/* ============================================================
   23. STOP REALTIME LISTENERS
   ============================================================ */

function stopRealtimeListeners() {

    if (unsubscribeUser) {

        unsubscribeUser();

        unsubscribeUser = null;
    }


    if (unsubscribeTransactions) {

        unsubscribeTransactions();

        unsubscribeTransactions = null;
    }
}


/* ============================================================
   24. MODAL FUNCTIONS
   ============================================================ */

function openModal(
    modalId
) {

    const modal =
        $(modalId);


    if (modal) {

        modal.classList.add(
            "show"
        );
    }
}


function closeModal() {

    document
        .querySelectorAll(
            ".modal.show"
        )
        .forEach(
            modal =>
                modal.classList.remove(
                    "show"
                )
        );
}


/* ============================================================
   25. PASSWORD VISIBILITY
   ============================================================ */

function togglePassword(
    inputId,
    button
) {

    const input =
        $(inputId);


    if (!input) {
        return;
    }


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";


        if (button) {
            button.textContent =
                "🙈";
        }

    } else {

        input.type =
            "password";


        if (button) {
            button.textContent =
                "👁";
        }
    }
}


/* ============================================================
   26. SET TEXT
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value;
    }
}


/* ============================================================
   27. FIREBASE ERROR HANDLER
   ============================================================ */

function handleFirebaseError(
    error
) {

    console.error(
        "Firebase error:",
        error
    );


    switch (
        error.code
    ) {

        case "auth/email-already-in-use":

            showToast(
                "This email is already registered.",
                "error"
            );

            break;


        case "auth/invalid-email":

            showToast(
                "Invalid email address.",
                "error"
            );

            break;


        case "auth/weak-password":

            showToast(
                "Password is too weak.",
                "error"
            );

            break;


        case "auth/invalid-credential":

            showToast(
                "Incorrect email or password.",
                "error"
            );

            break;


        case "auth/user-not-found":

            showToast(
                "Account not found.",
                "error"
            );

            break;


        case "auth/wrong-password":

            showToast(
                "Incorrect password.",
                "error"
            );

            break;


        case "auth/too-many-requests":

            showToast(
                "Too many attempts. Try again later.",
                "error"
            );

            break;


        default:

            showToast(
                error.message ||
                "Something went wrong.",
                "error"
            );
    }
}


/* ============================================================
   28. AUTO PAGE INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const page =
            getCurrentPage();


        /*
           Register page
        */

        if (
            page ===
            "customer-register.html"
        ) {

            const form =
                $("registerForm");


            if (form) {

                form.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                        registerCustomer();
                    }
                );
            }
        }


        /*
           Customer login
        */

        if (
            page ===
            "customer-login.html"
        ) {

            const form =
                $("loginForm");


            if (form) {

                form.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                        loginCustomer();
                    }
                );
            }
        }


        /*
           Admin login
        */

        if (
            page ===
            "admin-login.html"
        ) {

            const form =
                $("adminLoginForm");


            if (form) {

                form.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                        loginAdmin();
                    }
                );
            }
        }


        /*
           Customer dashboard
        */

        if (
            page ===
            "customer-dashboard.html"
        ) {

            onAuthStateChanged(
                auth,
                user => {

                    if (user) {

                        loadCustomerDashboard();

                    } else {

                        goTo(
                            "customer-login.html"
                        );
                    }
                }
            );
        }


        /*
           Admin dashboard
        */

        if (
    page ===
    "admin.html"
) {

    onAuthStateChanged(
        auth,
        user => {

            if (user) {

                loadAdminDashboard();

            } else {

                showToast(
                    "Please sign in to Firebase first.",
                    "error"
                );

            }
        }
    );
}


        /*
           Send money form
        */

        const transferForm =
            $("transferForm");


        if (transferForm) {

            transferForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    sendMoney();
                }
            );
        }


        /*
           Logout buttons
        */

        document
            .querySelectorAll(
                "[data-logout]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        logout
                    );
                }
            );


        /*
           Close modal when clicking
           outside modal content
        */

        document
            .querySelectorAll(
                ".modal"
            )
            .forEach(
                modal => {

                    modal.addEventListener(
                        "click",
                        event => {

                            if (
                                event.target ===
                                modal
                            ) {

                                modal.classList.remove(
                                    "show"
                                );
                            }
                        }
                    );
                }
            );
    }
);


/* ============================================================
   29. MAKE FUNCTIONS AVAILABLE TO HTML
   ============================================================ */

window.registerCustomer =
    registerCustomer;

window.loginCustomer =
    loginCustomer;

window.loginAdmin =
    loginAdmin;

window.sendMoney =
    sendMoney;

window.logout =
    logout;

window.openModal =
    openModal;

window.closeModal =
    closeModal;

window.togglePassword =
    togglePassword;

window.blockCustomer =
    blockCustomer;

window.unblockCustomer =
    unblockCustomer;


/* ============================================================
   END OF APPLICATION
   ============================================================ */