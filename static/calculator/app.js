const formatMoney = (value) =>
    new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

const formatPv = (value) =>
    new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);

const quantityInputs = [...document.querySelectorAll(".quantity-input")];
const rows = [...document.querySelectorAll(".product-row")];
const summaryItems = document.getElementById("summary-items");
const grandTotal = document.getElementById("grand-total");
const grandPv = document.getElementById("grand-pv");
const sheetTotal = document.getElementById("sheet-total");
const sheetPv = document.getElementById("sheet-pv");
const customerNameInput = document.getElementById("customer-name");
const summaryCustomer = document.getElementById("summary-customer");
const clearAllButton = document.getElementById("clear-all");

function animateValue(element, nextValue, suffix = "") {
    const currentValue = Number(element.dataset.value || 0);
    const start = performance.now();
    const duration = 280;

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = currentValue + (nextValue - currentValue) * eased;
        element.textContent = `${suffix === "บาท" ? formatMoney(value) : formatPv(value)}${suffix ? ` ${suffix}` : ""}`;
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.dataset.value = String(nextValue);
        }
    }

    requestAnimationFrame(step);
}

function refreshSummary() {
    const selectedItems = [];
    let totalPrice = 0;
    let totalPv = 0;

    rows.forEach((row) => {
        const input = row.querySelector(".quantity-input");
        const quantity = Number(input.value || 0);
        const price = Number(row.dataset.price);
        const pv = Number(row.dataset.pv);
        const itemPv = quantity * pv;
        const itemPrice = quantity * price;

        row.querySelector(".pv-chip").textContent = `${formatPv(itemPv)} PV`;

        if (quantity > 0) {
            selectedItems.push({
                name: row.dataset.name,
                quantity,
                totalPrice: itemPrice,
                totalPv: itemPv,
            });
        }

        totalPrice += itemPrice;
        totalPv += itemPv;
    });

    summaryItems.innerHTML = selectedItems
        .map(
            (item) => `
            <div class="summary-item">
                <span>${item.name}</span>
                <span>${item.quantity}</span>
                <span>${formatMoney(item.totalPrice)}</span>
                <span>${formatPv(item.totalPv)}</span>
            </div>
        `
        )
        .join("");

    animateValue(grandTotal, totalPrice);
    animateValue(sheetTotal, totalPrice, "บาท");
    animateValue(grandPv, totalPv);
    animateValue(sheetPv, totalPv);
}

quantityInputs.forEach((input) => {
    input.addEventListener("input", refreshSummary);
});

customerNameInput.addEventListener("input", () => {
    summaryCustomer.textContent = customerNameInput.value || "ไม่ระบุชื่อลูกค้า";
});

clearAllButton.addEventListener("click", () => {
    quantityInputs.forEach((input) => {
        input.value = 0;
    });
    refreshSummary();
});

refreshSummary();
