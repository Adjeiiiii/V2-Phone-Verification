console.log("upload-result.js loading...");

let recordToReverify = null;
let recordToSendOtp = null;
let recordToDelete = null;
let currentStatusFilter = "all";

let bulkActionType = null;
let bulkIds = [];

console.log("Default filter is:", currentStatusFilter);

function toggleUserDropdown() {
  console.log("toggleUserDropdown() called.");
  const dropdown = document.getElementById("userDropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function openLogoutModal(event) {
  console.log("openLogoutModal() called. Prevent default link behavior.");
  event.preventDefault();
  document.getElementById("logoutModal").style.display = "flex";
}

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("userDropdown");
  const profileIcon = document.getElementById("profileIcon");
  if (
    dropdown.style.display === "block" &&
    e.target !== dropdown &&
    !dropdown.contains(e.target) &&
    e.target !== profileIcon &&
    !profileIcon.contains(e.target)
  ) {
    console.log("Click outside userDropdown => hide it.");
    dropdown.style.display = "none";
  }
});

function toggleStatusDropdown(event) {
  console.log("toggleStatusDropdown() called. Stopping propagation.");
  event.stopPropagation();
  const statusDropdown = document.getElementById("statusDropdown");
  statusDropdown.style.display =
    (statusDropdown.style.display === "block" ? "none" : "block");
  console.log("statusDropdown new display:", statusDropdown.style.display);
}

document.addEventListener("click", (e) => {
  const statusDropdown = document.getElementById("statusDropdown");
  const trigger = document.querySelector(".status-filter-trigger");
  if (
    statusDropdown.style.display === "block" &&
    e.target !== statusDropdown &&
    !statusDropdown.contains(e.target) &&
    e.target !== trigger &&
    !trigger.contains(e.target)
  ) {
    console.log("Clicked outside statusDropdown => hide it.");
    statusDropdown.style.display = "none";
  }
});

function setStatusFilter(value) {
  console.log("setStatusFilter() => ", value);
  currentStatusFilter = value;
  applyFilters();
  document.getElementById("statusDropdown").style.display = "none";
}

function applyFilters() {
  console.log("applyFilters() called. Current filter:", currentStatusFilter);
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  console.log("Search text:", searchText);

  const rows = document.querySelectorAll("#resultsTable tbody tr");
  rows.forEach((row) => {
    const rowStatus = row.getAttribute("data-status");
    const rowText = row.textContent.toLowerCase();

    const matchesSearch = rowText.includes(searchText);
    let matchesStatus = true;
    if (currentStatusFilter !== "all") {
      matchesStatus = (rowStatus === currentStatusFilter);
    }

    if (matchesSearch && matchesStatus) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
  console.log("Filtering done.");
}

function openReverifyModal(id) {
  console.log("openReverifyModal() for ID=", id);
  recordToReverify = id;
  document.getElementById("reverifyModal").style.display = "flex";
}
function openSendOtpModal(id) {
  console.log("openSendOtpModal() for ID=", id);
  recordToSendOtp = id;
  document.getElementById("sendOtpModal").style.display = "flex";
}
function openDeleteModal(id) {
  console.log("openDeleteModal() for ID=", id);
  recordToDelete = id;
  document.getElementById("deleteModal").style.display = "flex";
}

async function reverifyRecord(id) {
  console.log("reverifyRecord() => about to fetch /revalidate/", id);
  try {
    const response = await fetch(`/revalidate/${id}`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to re-verify");
    const data = await response.json();
    console.log("Reverify response:", data);

    const row = document.querySelector(`tr[data-id='${id}']`);
    if (row && data.status) {
      row.setAttribute("data-status", data.status.toLowerCase());
      row.children[5].textContent = data.status.toLowerCase();
      console.log("Updated row status to:", data.status.toLowerCase());
    }
    applyFilters();
    updateStatusCounts();
  } catch (error) {
    console.error("Error re-verifying:", error);
  }
}

async function sendOTPRecord(id) {
  console.log("sendOTPRecord() => about to fetch /send-otp/", id);
  try {
    const response = await fetch(`/send-otp/${id}`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to send OTP");
    const data = await response.json();
    console.log("Send OTP response:", data);
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
}

async function deleteRecord(id) {
  console.log("deleteRecord() => about to fetch /delete-verified/", id);
  try {
    const response = await fetch(`/delete-verified/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete");
    console.log("Deleted record ID:", id);

    const row = document.querySelector(`tr[data-id='${id}']`);
    if (row) row.remove();
    applyFilters();
    updateStatusCounts();
  } catch (error) {
    console.error("Error deleting record:", error);
  }
}

function getSelectedRowIds() {
  console.log("getSelectedRowIds() called.");
  const rows = document.querySelectorAll("#resultsTable tbody tr");
  const selected = [];
  rows.forEach((row) => {
    const cb = row.querySelector(".row-checkbox");
    if (cb && cb.checked) {
      selected.push(parseInt(row.dataset.id));
    }
  });
  console.log("Selected IDs:", selected);
  return selected;
}

async function bulkReverify(ids) {
  console.log("bulkReverify() for IDs:", ids);
  for (const id of ids) {
    await reverifyRecord(id);
  }
}
async function bulkSendOtp(ids) {
  console.log("bulkSendOtp() for IDs:", ids);
  for (const id of ids) {
    await sendOTPRecord(id);
  }
}
async function bulkDelete(ids) {
  console.log("bulkDelete() for IDs:", ids);
  for (const id of ids) {
    await deleteRecord(id);
  }
}

function openBulkModal(actionType, ids) {
  console.log("openBulkModal() =>", actionType, ids);
  bulkActionType = actionType;
  bulkIds = ids;

  const count = ids.length;
  let msg = "";
  if (actionType === "reverify") {
    msg = `Are you sure you want to re-verify ${count} record(s)?`;
  } else if (actionType === "sendOtp") {
    msg = `Are you sure you want to send OTP to ${count} record(s)?`;
  } else if (actionType === "delete") {
    msg = `Are you sure you want to delete ${count} record(s)?`;
  }
  document.getElementById("bulkModalMessage").textContent = msg;
  document.getElementById("bulkModal").style.display = "flex";
}
function closeBulkModal() {
  console.log("closeBulkModal()");
  document.getElementById("bulkModal").style.display = "none";
  bulkActionType = null;
  bulkIds = [];
}

function updateStatusCounts() {
  console.log("updateStatusCounts() called.");
  let validCount = 0,
      invalidCount = 0,
      duplicateCount = 0;

  const rows = document.querySelectorAll("#resultsTable tbody tr");
  rows.forEach((r) => {
    const st = r.getAttribute("data-status");
    if (st === "valid") validCount++;
    else if (st === "invalid") invalidCount++;
    else if (st === "duplicate") duplicateCount++;
  });

  document.getElementById("validCountSpan").textContent = validCount;
  document.getElementById("invalidCountSpan").textContent = invalidCount;
  document.getElementById("duplicateCountSpan").textContent = duplicateCount;
  console.log("New counts => valid:", validCount, ", invalid:", invalidCount, ", duplicate:", duplicateCount);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded => hooking up event listeners.");

  document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
    console.log("confirmLogoutBtn clicked => window.location=/logout");
    window.location.href = "/logout";
  });
  document.getElementById("cancelLogoutBtn").addEventListener("click", () => {
    console.log("cancelLogoutBtn clicked => hide logoutModal");
    document.getElementById("logoutModal").style.display = "none";
  });

  document.getElementById("confirmReverifyBtn").addEventListener("click", () => {
    console.log("confirmReverifyBtn => reverifyRecord for ID:", recordToReverify);
    if (recordToReverify !== null) reverifyRecord(recordToReverify);
    document.getElementById("reverifyModal").style.display = "none";
    recordToReverify = null;
  });
  document.getElementById("cancelReverifyBtn").addEventListener("click", () => {
    console.log("cancelReverifyBtn => hide reverifyModal");
    document.getElementById("reverifyModal").style.display = "none";
    recordToReverify = null;
  });

  document.getElementById("confirmSendOtpBtn").addEventListener("click", () => {
    console.log("confirmSendOtpBtn => sendOTPRecord for ID:", recordToSendOtp);
    if (recordToSendOtp !== null) sendOTPRecord(recordToSendOtp);
    document.getElementById("sendOtpModal").style.display = "none";
    recordToSendOtp = null;
  });
  document.getElementById("cancelSendOtpBtn").addEventListener("click", () => {
    console.log("cancelSendOtpBtn => hide sendOtpModal");
    document.getElementById("sendOtpModal").style.display = "none";
    recordToSendOtp = null;
  });

  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    console.log("confirmDeleteBtn => deleteRecord for ID:", recordToDelete);
    if (recordToDelete !== null) deleteRecord(recordToDelete);
    document.getElementById("deleteModal").style.display = "none";
    recordToDelete = null;
  });
  document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
    console.log("cancelDeleteBtn => hide deleteModal");
    document.getElementById("deleteModal").style.display = "none";
    recordToDelete = null;
  });

  document.getElementById("confirmBulkBtn").addEventListener("click", async () => {
    console.log("confirmBulkBtn => bulkAction:", bulkActionType, "IDs:", bulkIds);
    if (bulkIds.length > 0) {
      if (bulkActionType === "reverify") {
        await bulkReverify(bulkIds);
      } else if (bulkActionType === "sendOtp") {
        await bulkSendOtp(bulkIds);
      } else if (bulkActionType === "delete") {
        await bulkDelete(bulkIds);
      }
    }
    closeBulkModal();
  });
  document.getElementById("cancelBulkBtn").addEventListener("click", () => {
    console.log("cancelBulkBtn => hide bulkModal");
    closeBulkModal();
  });

  document.getElementById("selectAllCheckbox").addEventListener("change", (e) => {
    console.log("SelectAllCheckbox changed =>", e.target.checked);
    const rowCheckboxes = document.querySelectorAll(".row-checkbox");
    rowCheckboxes.forEach((cb) => {
      cb.checked = e.target.checked;
    });
  });


  document.getElementById("bulkReverifyBtn").addEventListener("click", () => {
    console.log("bulkReverifyBtn clicked => gather IDs");
    const ids = getSelectedRowIds();
    if (ids.length > 0) openBulkModal("reverify", ids);
  });
  document.getElementById("bulkSendOtpBtn").addEventListener("click", () => {
    console.log("bulkSendOtpBtn clicked => gather IDs");
    const ids = getSelectedRowIds();
    if (ids.length > 0) openBulkModal("sendOtp", ids);
  });
  document.getElementById("bulkDeleteBtn").addEventListener("click", () => {
    console.log("bulkDeleteBtn clicked => gather IDs");
    const ids = getSelectedRowIds();
    if (ids.length > 0) openBulkModal("delete", ids);
  });


  const tableBody = document.querySelector("#resultsTable tbody");
  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const row = btn.closest("tr");
    const recordId = row.dataset.id;
    console.log("Clicked a table button => recordId:", recordId);

    if (btn.classList.contains("reverify-btn")) {
      console.log("-> reverify-btn => openReverifyModal");
      openReverifyModal(recordId);
    } else if (btn.classList.contains("send-otp-btn")) {
      console.log("-> send-otp-btn => openSendOtpModal");
      openSendOtpModal(recordId);
    } else if (btn.classList.contains("delete-btn")) {
      console.log("-> delete-btn => openDeleteModal");
      openDeleteModal(recordId);
    }
  });

  const statusOptions = document.querySelectorAll(".status-option");
  statusOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      const val = opt.getAttribute("data-value");
      console.log("Status option clicked ->", val);
      setStatusFilter(val);
    });
  });



  console.log("Attaching filters and summary updates on load => applyFilters, updateStatusCounts");
  applyFilters();
  updateStatusCounts();

  console.log("upload-result.js: all event listeners set up. Page is ready.");
});
