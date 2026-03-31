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

const orderRows = document.getElementById("order-rows");
const rowTemplate = document.getElementById("order-row-template");
const customerNameInput = document.getElementById("customer-name");
const summaryCustomer = document.getElementById("summary-customer");
const summaryDatetime = document.getElementById("summary-datetime");
const summaryItems = document.getElementById("summary-items");
const grandTotal = document.getElementById("grand-total");
const grandPv = document.getElementById("grand-pv");
const sheetTotal = document.getElementById("sheet-total");
const sheetPv = document.getElementById("sheet-pv");
const addRowButton = document.getElementById("add-row");
const clearAllButton = document.getElementById("clear-all");
const saveOrderButton = document.getElementById("save-order");
const saveStatus = document.getElementById("save-status");
const snapshotCard = document.getElementById("snapshot-card");
const snapshotPreviewModal = document.getElementById("snapshot-preview-modal");
const snapshotPreviewImage = document.getElementById("snapshot-preview-image");
const sharePreviewButton = document.getElementById("share-preview");
const openPreviewButton = document.getElementById("open-preview");
const closePreviewButton = document.getElementById("close-preview");
let currentSnapshotAsset = null;

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("blob_failed"));
            }
        }, "image/png");
    });
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function shareOrDownloadSnapshot(canvas, customerName, pendingWindow = null) {
    const blob = await canvasToBlob(canvas);
    const safeCustomer = customerName.replace(/\s+/g, "-");
    const filename = `pvsmart-${safeCustomer}-${Date.now()}.png`;
    const blobUrl = URL.createObjectURL(blob);

    if (
        typeof File !== "undefined" &&
        navigator.share &&
        navigator.canShare
    ) {
        const file = new File([blob], filename, { type: "image/png" });

        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: "PV Smart Order Snapshot",
                    text: `สรุปรายการสั่งซื้อของ ${customerName}`,
                    files: [file],
                });
                window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                return "shared";
            } catch (error) {
                // Fall through to open/download flow on mobile browsers that reject sharing.
            }
        }
    }

    if (isMobileDevice()) {
        if (pendingWindow && !pendingWindow.closed) {
            pendingWindow.location.href = blobUrl;
        } else {
            window.location.href = blobUrl;
        }
        return "opened";
    }

    const link = document.createElement("a");
    link.download = filename;
    link.href = blobUrl;
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return "downloaded";
}

async function createSnapshotAsset(canvas, customerName) {
    const blob = await canvasToBlob(canvas);
    const safeCustomer = customerName.replace(/\s+/g, "-");
    const filename = `pvsmart-${safeCustomer}-${Date.now()}.png`;
    const blobUrl = URL.createObjectURL(blob);
    const asset = {
        blob,
        blobUrl,
        filename,
        file: typeof File !== "undefined" ? new File([blob], filename, { type: "image/png" }) : null,
    };
    return asset;
}

function revokeCurrentSnapshotAsset() {
    if (currentSnapshotAsset?.blobUrl) {
        URL.revokeObjectURL(currentSnapshotAsset.blobUrl);
    }
    currentSnapshotAsset = null;
}

function openSnapshotPreview(asset) {
    revokeCurrentSnapshotAsset();
    currentSnapshotAsset = asset;
    snapshotPreviewImage.src = asset.blobUrl;
    snapshotPreviewModal.hidden = false;
}

function closeSnapshotPreview() {
    snapshotPreviewModal.hidden = true;
}

async function shareCurrentPreview() {
    if (!currentSnapshotAsset) {
        return;
    }

    if (
        currentSnapshotAsset.file &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [currentSnapshotAsset.file] })
    ) {
        await navigator.share({
            title: "PV Smart Order Snapshot",
            files: [currentSnapshotAsset.file],
        });
        return;
    }

    window.open(currentSnapshotAsset.blobUrl, "_blank", "noopener,noreferrer");
}

function openCurrentPreview() {
    if (!currentSnapshotAsset) {
        return;
    }
    window.open(currentSnapshotAsset.blobUrl, "_blank", "noopener,noreferrer");
}

function getCsrfToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split("; csrftoken=");
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
    return "";
}

function updateTimestamp() {
    summaryDatetime.textContent = new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date());
}

function animateValue(element, nextValue, options = {}) {
    const { suffix = "", formatter = "pv" } = options;
    const currentValue = Number(element.dataset.value || 0);
    const start = performance.now();
    const duration = 240;

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = currentValue + (nextValue - currentValue) * eased;
        const formattedValue = formatter === "money" ? formatMoney(value) : formatPv(value);
        element.textContent = `${formattedValue}${suffix ? ` ${suffix}` : ""}`;
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.dataset.value = String(nextValue);
        }
    }

    requestAnimationFrame(step);
}

function createRow() {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".order-row");

    row.querySelector(".product-select").addEventListener("change", refreshSummary);
    row.querySelector(".quantity-input").addEventListener("input", refreshSummary);
    row.querySelector(".increment").addEventListener("click", () => {
        const input = row.querySelector(".quantity-input");
        input.value = Number(input.value || 0) + 1;
        refreshSummary();
    });
    row.querySelector(".decrement").addEventListener("click", () => {
        const input = row.querySelector(".quantity-input");
        input.value = Math.max(1, Number(input.value || 1) - 1);
        refreshSummary();
    });
    row.querySelector(".remove-row").addEventListener("click", () => {
        row.remove();
        if (!orderRows.children.length) {
            orderRows.appendChild(createRow());
        }
        refreshSummary();
    });

    return row;
}

function getSelectedItemData(row) {
    const select = row.querySelector(".product-select");
    const selectedOption = select.options[select.selectedIndex];
    const quantity = Math.max(1, Number(row.querySelector(".quantity-input").value || 1));

    if (!select.value) {
        row.querySelector(".unit-price").textContent = "0.00 บาท";
        row.querySelector(".unit-pv").textContent = "0 PV";
        row.querySelector(".line-total").textContent = "0.00 บาท";
        row.querySelector(".line-pv").textContent = "0 PV";
        return null;
    }

    const price = Number(selectedOption.dataset.price);
    const pv = Number(selectedOption.dataset.pv);
    const lineTotal = price * quantity;
    const linePv = pv * quantity;

    row.querySelector(".unit-price").textContent = `${formatMoney(price)} บาท`;
    row.querySelector(".unit-pv").textContent = `${formatPv(pv)} PV`;
    row.querySelector(".line-total").textContent = `${formatMoney(lineTotal)} บาท`;
    row.querySelector(".line-pv").textContent = `${formatPv(linePv)} PV`;

    return {
        productSku: select.value,
        name: selectedOption.dataset.name,
        quantity,
        unitPrice: price,
        unitPv: pv,
        lineTotal,
        linePv,
    };
}

function refreshSummary() {
    updateTimestamp();
    summaryCustomer.textContent = customerNameInput.value.trim() || "ยังไม่ได้ระบุชื่อลูกค้า";

    const selectedItems = [...orderRows.querySelectorAll(".order-row")]
        .map(getSelectedItemData)
        .filter(Boolean);

    const totalPrice = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalPv = selectedItems.reduce((sum, item) => sum + item.linePv, 0);

    summaryItems.innerHTML = selectedItems
        .map(
            (item) => `
            <div class="summary-item">
                <span>${item.name}</span>
                <span>${item.quantity}</span>
                <span>${formatMoney(item.lineTotal)}</span>
                <span>${formatPv(item.linePv)}</span>
            </div>
        `
        )
        .join("");

    animateValue(grandTotal, totalPrice, { formatter: "money" });
    animateValue(grandPv, totalPv);
    animateValue(sheetTotal, totalPrice, { suffix: "บาท", formatter: "money" });
    animateValue(sheetPv, totalPv);
}

async function saveOrder() {
    const customerName = customerNameInput.value.trim();
    const items = [...orderRows.querySelectorAll(".order-row")]
        .map(getSelectedItemData)
        .filter(Boolean)
        .map((item) => ({
            product_sku: item.productSku,
            quantity: item.quantity,
        }));

    if (!customerName) {
        saveStatus.textContent = "กรุณากรอกชื่อลูกค้าก่อนบันทึก";
        return;
    }

    if (!items.length) {
        saveStatus.textContent = "กรุณาเลือกรายการสินค้าอย่างน้อย 1 รายการ";
        return;
    }

    saveOrderButton.disabled = true;
    saveStatus.textContent = "กำลังบันทึกรูปภาพและออเดอร์...";

    try {
        const canvas = await window.html2canvas(snapshotCard, {
            backgroundColor: "#eef5ef",
            scale: 2,
        });
        const snapshotMode = isMobileDevice()
            ? (openSnapshotPreview(await createSnapshotAsset(canvas, customerName)), "preview")
            : await shareOrDownloadSnapshot(canvas, customerName);

        const response = await fetch("/api/orders/save/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken(),
            },
            body: JSON.stringify({
                customer_name: customerName,
                items,
            }),
        });

        if (!response.ok) {
            throw new Error("save_failed");
        }

        const data = await response.json();
        saveStatus.textContent =
            snapshotMode === "shared"
                ? `บันทึกสำเร็จ ออเดอร์ #${data.order_id} และเปิดหน้าส่งรูปภาพแล้ว`
                : snapshotMode === "preview"
                    ? `บันทึกสำเร็จ ออเดอร์ #${data.order_id} แล้ว กดปุ่มแชร์รูปภาพหรือเปิดรูปภาพต่อได้เลย`
                : snapshotMode === "opened"
                    ? `บันทึกสำเร็จ ออเดอร์ #${data.order_id} และเปิดรูปภาพแล้ว กดค้างหรือใช้เมนูแชร์ได้เลย`
                : `บันทึกสำเร็จ ออเดอร์ #${data.order_id} และดาวน์โหลดรูปภาพแล้ว`;
    } catch (error) {
        saveStatus.textContent = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    } finally {
        saveOrderButton.disabled = false;
    }
}

addRowButton.addEventListener("click", () => {
    orderRows.appendChild(createRow());
});

clearAllButton.addEventListener("click", () => {
    orderRows.innerHTML = "";
    orderRows.appendChild(createRow());
    customerNameInput.value = "";
    refreshSummary();
    saveStatus.textContent = "";
});

customerNameInput.addEventListener("input", refreshSummary);
saveOrderButton.addEventListener("click", saveOrder);
sharePreviewButton.addEventListener("click", async () => {
    try {
        await shareCurrentPreview();
    } catch (error) {
        saveStatus.textContent = "แชร์รูปภาพไม่สำเร็จ ลองกดเปิดรูปภาพแทน";
    }
});
openPreviewButton.addEventListener("click", openCurrentPreview);
closePreviewButton.addEventListener("click", closeSnapshotPreview);

orderRows.appendChild(createRow());
updateTimestamp();
refreshSummary();
