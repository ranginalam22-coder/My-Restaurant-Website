const filterButtons = document.querySelectorAll(".menu-filter");
const dishes = document.querySelectorAll(".dish");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const reservationForm = document.querySelector("#reservation-form");

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
