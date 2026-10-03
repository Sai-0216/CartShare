// ===============================
// CartShare - Firebase Version
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyAYUQMfKSLqpf-wPiWETA0_l43asjHHEZ8",
  authDomain: "cartshare-cc7d5.firebaseapp.com",
  databaseURL: "https://cartshare-cc7d5-default-rtdb.firebaseio.com",
  projectId: "cartshare-cc7d5",
  storageBucket: "cartshare-cc7d5.firebasestorage.app",
  messagingSenderId: "312656579741",
  appId: "1:312656579741:web:5738cd1f011a3c54375874"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

let state = {
  roomCode: null,
  userName: null,
  uid: null
};

let roomListener = null;

// -------------------------------
// Helpers
// -------------------------------

const $ = (id) => document.getElementById(id);

function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  return new Date(timestamp).toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// -------------------------------
// Firebase Authentication
// -------------------------------

async function startApp() {
  try {
    if (!auth.currentUser) {
      await auth.signInAnonymously();
    }

    state.uid = auth.currentUser.uid;

    console.log("Firebase connected.");
    console.log("User ID:", state.uid);

  } catch (error) {
    console.error("Firebase authentication error:", error);
    showToast("Firebase connection failed.");
  }
}

startApp();

// -------------------------------
// Room Creation
// -------------------------------

async function createRoom() {

  const name = $("userName").value.trim();

  if (!name) {
    showToast("Please enter your name.");
    return;
  }

  if (!auth.currentUser) {
    showToast("Connecting to Firebase...");
    await startApp();
  }

  let roomCode;
  let roomExists = true;

  // Generate a unique room code
  while (roomExists) {

    roomCode = createRoomCode();

    const snapshot = await db
      .ref("rooms/" + roomCode)
      .once("value");

    roomExists = snapshot.exists();
  }

  const now = Date.now();

  const roomData = {
    createdAt: now,
    createdBy: name,
    items: {},
    participants: {
      [state.uid]: {
        name: name,
        joinedAt: now
      }
    },
    activity: {}
  };

  await db
    .ref("rooms/" + roomCode)
    .set(roomData);

  state.roomCode = roomCode;
  state.userName = name;

  showRoom();

  listenToRoom();

  await addActivity(name + " created the room");

  showToast("Room " + roomCode + " created!");
}

// -------------------------------
// Join Room
// -------------------------------

async function joinRoom() {

  const name = $("userName").value.trim();
  const code = $("roomCodeInput").value.trim().toUpperCase();

  if (!name) {
    showToast("Please enter your name.");
    return;
  }

  if (!code) {
    showToast("Please enter a room code.");
    return;
  }

  if (!auth.currentUser) {
    showToast("Connecting to Firebase...");
    await startApp();
  }

  try {

    const roomRef = db.ref("rooms/" + code);

    const snapshot = await roomRef.once("value");

    if (!snapshot.exists()) {
      showToast("Room not found.");
      return;
    }

    state.roomCode = code;
    state.userName = name;

    await roomRef
      .child("participants")
      .child(state.uid)
      .set({
        name: name,
        joinedAt: Date.now()
      });

    showRoom();

    listenToRoom();

    await addActivity(name + " joined the room");

    showToast("Joined room " + code);

  } catch (error) {

    console.error(error);

    showToast("Unable to join room.");
  }
}

// -------------------------------
// Show Room
// -------------------------------

function showRoom() {

  $("welcomeView").classList.add("d-none");
  $("roomView").classList.remove("d-none");

  $("roomCodeLabel").textContent = state.roomCode;
  $("welcomeName").textContent = state.userName;
}

// -------------------------------
// Listen to Firebase Room
// -------------------------------

function listenToRoom() {

  if (roomListener) {
    roomListener.off();
  }

  roomListener = db.ref("rooms/" + state.roomCode);

  roomListener.on("value", (snapshot) => {

    const data = snapshot.val();

    if (!data) {
      showToast("This room no longer exists.");
      return;
    }

    render(data);
  });
}

// -------------------------------
// Add Item
// -------------------------------

async function addItem(event) {

  event.preventDefault();

  if (!state.roomCode) {
    showToast("Please join a room first.");
    return;
  }

  const name = $("itemName").value.trim();
  const price = Number($("itemPrice").value);
  const qty = Number($("itemQty").value);

  if (!name) {
    showToast("Enter an item name.");
    return;
  }

  if (price < 0 || Number.isNaN(price)) {
    showToast("Enter a valid price.");
    return;
  }

  if (qty < 1 || Number.isNaN(qty)) {
    showToast("Enter a valid quantity.");
    return;
  }

  const itemRef = db
    .ref("rooms/" + state.roomCode + "/items")
    .push();

  await itemRef.set({
    name: name,
    price: price,
    qty: qty,
    addedBy: state.userName,
    addedAt: Date.now()
  });

  await addActivity(
    state.userName + " added " + name + " to the cart"
  );

  $("itemForm").reset();
  $("itemQty").value = 1;

  showToast("Item added.");
}

// -------------------------------
// Remove Item
// -------------------------------

async function removeItem(id) {

  if (!state.roomCode) return;

  const itemRef = db.ref(
    "rooms/" + state.roomCode + "/items/" + id
  );

  const snapshot = await itemRef.once("value");

  if (!snapshot.exists()) return;

  const item = snapshot.val();

  await itemRef.remove();

  await addActivity(
    state.userName + " removed " + item.name + " from the cart"
  );

  showToast("Item removed.");
}

// -------------------------------
// Activity Log
// -------------------------------

async function addActivity(message) {

  if (!state.roomCode) return;

  const activityRef = db
    .ref("rooms/" + state.roomCode + "/activity")
    .push();

  await activityRef.set({
    message: message,
    user: state.userName,
    time: Date.now()
  });
}

// -------------------------------
// Render Dashboard
// -------------------------------

function render(data) {

  const items = data.items
    ? Object.entries(data.items).map(([id, item]) => ({
        id,
        ...item
      }))
    : [];

  const participants = data.participants
    ? Object.values(data.participants)
    : [];

  const activities = data.activity
    ? Object.values(data.activity)
        .sort((a, b) => b.time - a.time)
        .slice(0, 40)
    : [];

  // Item count
  const itemCount = items.reduce(
    (total, item) => total + Number(item.qty),
    0
  );

  $("itemCount").textContent =
    itemCount + (itemCount === 1 ? " item" : " items");

  // Cart
  const list = $("cartList");

  $("emptyCart").style.display =
    items.length === 0 ? "block" : "none";

  list.innerHTML = "";

  let total = 0;

  items.forEach((item) => {

    const lineTotal =
      Number(item.price) * Number(item.qty);

    total += lineTotal;

    const row = document.createElement("div");

    row.className = "cart-item";

    row.innerHTML = `
      <div class="item-main">
        <div class="item-name">
          ${escapeHtml(item.name)}
        </div>

        <div class="item-meta">
          ${item.qty} × ₹${Number(item.price).toFixed(2)}
          • added by ${escapeHtml(item.addedBy)}
        </div>
      </div>

      <div class="item-price">
        ₹${lineTotal.toFixed(2)}

        <button
          class="btn btn-sm btn-outline-danger ms-2 delete-item"
          data-id="${item.id}">
          Remove
        </button>
      </div>
    `;

    list.appendChild(row);
  });

  $("cartTotal").textContent =
    "₹" + total.toFixed(2);

  // Remove buttons
  document
    .querySelectorAll(".delete-item")
    .forEach((button) => {

      button.addEventListener("click", () => {
        removeItem(button.dataset.id);
      });

    });

  // Participants
  $("participants").innerHTML =
    participants.map((participant) => `
      <div class="participant">

        <div class="avatar">
          ${escapeHtml(
            participant.name.charAt(0).toUpperCase()
          )}
        </div>

        <div>
          <strong>
            ${escapeHtml(participant.name)}
          </strong>

          <br>

          <small class="text-muted">
            Participant
          </small>
        </div>

      </div>
    `).join("")
    ||
    '<p class="text-muted">No participants yet.</p>';

  // Activity
  $("activityLog").innerHTML =
    activities.map((activity) => `
      <div class="activity">

        <strong>
          ${escapeHtml(activity.user)}
        </strong>

        ${escapeHtml(activity.message)}

        <div class="activity-time">
          ${formatTime(activity.time)}
        </div>

      </div>
    `).join("")
    ||
    '<p class="text-muted py-3">No activity yet.</p>';
}

// -------------------------------
// Copy Room Code
// -------------------------------

$("copyRoomBtn").addEventListener(
  "click",
  async () => {

    try {

      await navigator.clipboard.writeText(
        state.roomCode
      );

      showToast("Room code copied!");

    } catch {

      showToast(
        "Room code: " + state.roomCode
      );
    }
  }
);

// -------------------------------
// Print Receipt
// -------------------------------

$("printBtn").addEventListener(
  "click",
  () => {
    window.print();
  }
);

// -------------------------------
// Leave Room
// -------------------------------

$("leaveBtn").addEventListener(
  "click",
  async () => {

    if (state.roomCode && state.uid) {

      await db
        .ref(
          "rooms/" +
          state.roomCode +
          "/participants/" +
          state.uid
        )
        .remove();
    }

    if (roomListener) {
      roomListener.off();
      roomListener = null;
    }

    state.roomCode = null;
    state.userName = null;

    $("roomView").classList.add("d-none");
    $("welcomeView").classList.remove("d-none");

    showToast("You left the room.");
  }
);

// -------------------------------
// Button Events
// -------------------------------

$("createRoomBtn").addEventListener(
  "click",
  createRoom
);

$("joinRoomBtn").addEventListener(
  "click",
  joinRoom
);

$("itemForm").addEventListener(
  "submit",
  addItem
);