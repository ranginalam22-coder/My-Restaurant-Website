const filterButtons = document.querySelectorAll(".menu-filter");
const dishes = document.querySelectorAll(".dish");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const reservationForm = document.querySelector("#reservation-form");
const cartToggle = document.querySelector(".cart-toggle");
const cartDrawer = document.querySelector("#cart-drawer");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartItems = document.querySelector(".cart-items");
const cartEmpty = document.querySelector(".cart-empty");
const cartFooter = document.querySelector(".cart-footer");
const cartMessage = document.querySelector(".cart-message");
const cartStatus = document.querySelector(".cart-status");
const menuItems = new Map(Array.from(dishes, (dish) => {
	const price = Number(dish.querySelector(".dish-price").textContent.replace(/[^\d.]/g, ""));
	return [dish.dataset.dishId, {
		id: dish.dataset.dishId,
		name: dish.querySelector("h3").textContent,
		price,
		image: dish.querySelector("img").src,
		alt: dish.querySelector("img").alt
	}];
}));
const cartStorageKey = "royal-table-cart";
let cartStatusTimeout;

const loadCart = () => {
	try {
		const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
		if (!Array.isArray(savedCart) || savedCart.some((item) =>
			!menuItems.has(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1
		)) {
			throw new Error("Saved cart has an invalid format.");
		}
		return savedCart;
	} catch (error) {
		cartMessage.textContent = "We couldn’t restore your saved order. You can start a new one.";
		console.error("Could not read the saved restaurant cart.", error);
		return [];
	}
};

let cart = loadCart();

const formatPrice = (amount) => `$${amount.toFixed(2)}`;

const showCartStatus = (message) => {
	cartStatus.textContent = message;
	cartStatus.classList.add("visible");
	clearTimeout(cartStatusTimeout);
	cartStatusTimeout = setTimeout(() => cartStatus.classList.remove("visible"), 2400);
};

const saveCart = () => {
	try {
		localStorage.setItem(cartStorageKey, JSON.stringify(cart));
		cartMessage.textContent = "";
	} catch (error) {
		cartMessage.textContent = "Your order is available for this visit, but couldn’t be saved on this device.";
		console.error("Could not save the restaurant cart.", error);
	}
	renderCart();
};

const renderCart = () => {
	const count = cart.reduce((total, item) => total + item.quantity, 0);
	const subtotal = cart.reduce((total, item) => total + menuItems.get(item.id).price * item.quantity, 0);
	cartToggle.querySelector(".cart-count").textContent = count;
	cartDrawer.querySelector(".cart-count-label").textContent = `(${count})`;
	cartItems.replaceChildren();

	cart.forEach((item) => {
		const menuItem = menuItems.get(item.id);
		const row = document.createElement("article");
		row.className = "cart-item";
		const image = document.createElement("img");
		image.src = menuItem.image;
		image.alt = menuItem.alt;
		const details = document.createElement("div");
		const name = document.createElement("h3");
		name.textContent = menuItem.name;
		const price = document.createElement("p");
		price.textContent = `${formatPrice(menuItem.price)} each`;
		const quantityControl = document.createElement("div");
		quantityControl.className = "quantity-control";
		quantityControl.setAttribute("aria-label", `Quantity for ${menuItem.name}`);

		[
			{ label: `Remove one ${menuItem.name}`, change: -1, text: "−" },
			{ label: `Add one ${menuItem.name}`, change: 1, text: "+" }
		].forEach(({ label, change, text }, index) => {
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = text;
			button.setAttribute("aria-label", label);
			button.dataset.quantityId = item.id;
			button.dataset.change = change;
			if (index === 0) quantityControl.append(button);
			else {
				const amount = document.createElement("span");
				amount.textContent = item.quantity;
				quantityControl.append(amount, button);
			}
		});

		const total = document.createElement("strong");
		total.className = "cart-item-total";
		total.textContent = formatPrice(menuItem.price * item.quantity);
		details.append(name, price, quantityControl);
		row.append(image, details, total);
		cartItems.append(row);
	});

	cartEmpty.hidden = count > 0;
	cartFooter.hidden = count === 0;
	cartFooter.querySelector(".cart-subtotal strong").textContent = formatPrice(subtotal);
};

const setCartOpen = (open) => {
	cartDrawer.classList.toggle("open", open);
	cartDrawer.setAttribute("aria-hidden", String(!open));
	cartToggle.setAttribute("aria-expanded", String(open));
	document.body.classList.toggle("cart-open", open);
	cartBackdrop.hidden = !open;
	if (open) {
		requestAnimationFrame(() => cartBackdrop.classList.add("visible"));
		cartDrawer.querySelector(".cart-close").focus();
	} else {
		cartBackdrop.classList.remove("visible");
		cartToggle.focus();
	}
};

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
	button.addEventListener("click", () => {
		const id = button.closest(".dish").dataset.dishId;
		const existingItem = cart.find((item) => item.id === id);
		if (existingItem) existingItem.quantity += 1;
		else cart.push({ id, quantity: 1 });
		saveCart();
		showCartStatus(`${menuItems.get(id).name} added to your order.`);
	});
});

cartItems.addEventListener("click", (event) => {
	const button = event.target.closest("[data-quantity-id]");
	if (!button) return;

	const item = cart.find((entry) => entry.id === button.dataset.quantityId);
	if (!item) return;
	item.quantity += Number(button.dataset.change);
	if (item.quantity < 1) cart = cart.filter((entry) => entry !== item);
	saveCart();
});

cartToggle.addEventListener("click", () => setCartOpen(true));
cartDrawer.querySelector(".cart-close").addEventListener("click", () => setCartOpen(false));
cartDrawer.querySelector(".continue-shopping").addEventListener("click", () => setCartOpen(false));
cartBackdrop.addEventListener("click", () => setCartOpen(false));
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && cartDrawer.classList.contains("open")) setCartOpen(false);
});

renderCart();

filterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		const category = button.dataset.category;
		filterButtons.forEach((filter) => {
			const selected = filter === button;
			filter.classList.toggle("is-active", selected);
			filter.setAttribute("aria-pressed", String(selected));
		});
		dishes.forEach((dish) => {
			dish.hidden = category !== "all" && dish.dataset.category !== category;
		});
	});
});

	menuToggle?.addEventListener("click", () => {
	const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
	menuToggle.setAttribute("aria-expanded", String(!isOpen));
	menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
	mainNav.classList.toggle("is-open", !isOpen);
});

mainNav?.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", () => {
		menuToggle?.setAttribute("aria-expanded", "false");
		menuToggle?.setAttribute("aria-label", "Open navigation");
		mainNav.classList.remove("is-open");
	});
});

if (reservationForm) {
	const formMessage = document.querySelector("#form-message");
	const exportButton = document.querySelector("#reservations-export");
	const dateInput = reservationForm.querySelector('input[name="date"]');
	const reservationsKey = "royal-table-reservations";
	const today = new Date();
	const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
	dateInput.min = localToday;
	document.querySelector("#current-year").textContent = today.getFullYear();

	const readReservations = () => {
		try {
			const savedReservations = JSON.parse(localStorage.getItem(reservationsKey) || "[]");
			return Array.isArray(savedReservations) ? savedReservations : [];
		} catch {
			return [];
		}
	};

	exportButton.hidden = readReservations().length === 0;

	reservationForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const reservation = new FormData(reservationForm);
		const reservations = readReservations();
		reservations.push({
			submittedAt: new Date().toISOString(),
			name: reservation.get("name").trim(),
			email: reservation.get("email").trim(),
			date: reservation.get("date"),
			time: reservation.get("time"),
			guests: reservation.get("guests")
		});

		try {
			localStorage.setItem(reservationsKey, JSON.stringify(reservations));
		} catch {
			formMessage.textContent = "This browser could not save the booking. Please try another browser.";
			return;
		}

		formMessage.textContent = "Booking saved on this device. Download the Excel file to keep a copy.";
		exportButton.hidden = false;
		reservationForm.reset();
		dateInput.min = localToday;
	});

	exportButton.addEventListener("click", () => {
		const rows = [
			["Submitted at", "Name", "Email", "Date", "Time", "Guests"],
			...readReservations().map((reservation) => [
				reservation.submittedAt,
				reservation.name,
				reservation.email,
				reservation.date,
				reservation.time,
				reservation.guests
			])
		];
		const csvCell = (value) => {
			const text = String(value ?? "");
			const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
			return `"${safeText.replace(/"/g, '""')}"`;
		};
		const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
		const downloadUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
		const downloadLink = document.createElement("a");
		downloadLink.href = downloadUrl;
		downloadLink.download = "royal-table-bookings.csv";
		downloadLink.click();
		setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
	});
}
