import { initializeApp } from "https://gstatic.com";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://gstatic.com";
import { getFirestore, doc, onSnapshot, getDoc, updateDoc, setDoc, collection, addDoc } from "https://gstatic.com";

// [REPLACE THIS WITH YOUR OWN FIREBASE CONFIG]
const firebaseConfig = {
    apiKey: "AIzaSyAVEwTJEHFRnGnbl4wuTTPzRBDVTFBDtrg",
    authDomain: "://firebaseapp.com",
    projectId: "coding-shop"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const services = [
    { id: 'wa', name: 'WhatsApp', price: 0.50, icon: 'https://icons8.com' },
    { id: 'tg', name: 'Telegram', price: 0.25, icon: 'https://icons8.com' },
    { id: 'gl', name: 'Google', price: 0.60, icon: 'https://icons8.com' }
];

// --- APP CORE ---
onAuthStateChanged(auth, async (user) => {
    if (user && window.location.pathname.includes('dashboard.html')) {
        document.getElementById('userName').innerText = user.displayName || "User";
        document.getElementById('userAvatar').src = user.photoURL || `https://ui-avatars.com{user.email}`;

        onSnapshot(doc(db, "users", user.uid), (s) => {
            const bal = s.data()?.balance || 0;
            document.getElementById('userBalance').innerText = `$${bal.toFixed(2)}`;
        });
        loadServices();
    }
});

function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if(!grid) return;
    grid.innerHTML = services.map(s => `
        <div class="col-md-4 col-6">
            <div class="service-card" onclick="openOrder('${s.name}', ${s.price}, '${s.icon}')">
                <img src="${s.icon}" width="50" class="mb-3">
                <h6 class="fw-bold">${s.name}</h6>
                <div class="text-primary fw-bold">$${s.price}</div>
            </div>
        </div>
    `).join('');
}

window.openOrder = (name, price, icon) => {
    document.getElementById('m-name').innerText = name;
    document.getElementById('m-price').innerText = `$${price}`;
    document.getElementById('m-icon').src = icon;
    new bootstrap.Modal(document.getElementById('buyModal')).show();
};

document.getElementById('confirmOrder')?.addEventListener('click', async () => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(userRef);
    const bal = snap.data()?.balance || 0;
    const price = parseFloat(document.getElementById('m-price').innerText.replace('$',''));

    if(bal >= price) {
        await addDoc(collection(db, "orders"), {
            uid: auth.currentUser.uid,
            service: document.getElementById('m-name').innerText,
            status: 'Pending Verification',
            time: new Date()
        });
        await updateDoc(userRef, { balance: bal - price });
        alert("Success! Check Orders page for your code.");
        location.reload();
    } else {
        alert("Insufficient Credit!");
    }
});

// RAZORPAY
document.getElementById('depositBtn')?.addEventListener('click', () => {
    const amt = document.getElementById('depositAmt').value;
    const options = {
        key: "rzp_test_YOUR_KEY", 
        amount: amt * 100 * 80, // In Paise
        currency: "INR",
        handler: async (res) => {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const s = await getDoc(userRef);
            await setDoc(userRef, { balance: (s.data()?.balance || 0) + parseFloat(amt) }, { merge: true });
            alert("Deposit Successful!");
        }
    };
    new Razorpay(options).open();
});
