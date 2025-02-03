let recordToReverify = null;
let recordToDelete = null;
let recordToSendOtp = null;
let allRecords = [];
let currentStatusFilter = "all";


let bulkActionType = null;
let bulkIds = [];


function toggleUserDropdown() {
  const dropdown = document.getElementById("userDropdown");
  dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
}

function openLogoutModal(event) {
  event.preventDefault();
  document.getElementById("logoutModal").style.display = "flex";
}


function toggleStatusDropdown(event) {
  event.stopPropagation();
  const statusDropdown = document.getElementById("statusDropdown");
  if (statusDropdown.style.display === "block") {
    statusDropdown.style.display = "none";
  } else {
    statusDropdown.style.display = "block";
  }
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
    statusDropdown.style.display = "none";
  }
});

function setStatusFilter(value) {
  currentStatusFilter = value;
  applyFilters();
  document.getElementById("statusDropdown").style.display = "none";
}


async function loadVerifiedList() {
  try {
    const response = await fetch("/verified-list");
    if (!response.ok) {
      console.error("Error fetching verified list:", response.statusText);
      return;
    }
    const data = await response.json();
    allRecords = data;
    populateTable(data);
  } catch (error) {
    console.error("Error loading verified list:", error);
  }
}

function populateTable(records) {
  const tableBody = document.querySelector("#verifiedTable tbody");
  tableBody.innerHTML = "";

  records.forEach((rec) => {
    const tr = document.createElement("tr");

    tr.dataset.id = rec.id;


    const checkboxTd = document.createElement("td");
    const rowCheckbox = document.createElement("input");
    rowCheckbox.type = "checkbox";
    rowCheckbox.classList.add("row-checkbox");
    checkboxTd.appendChild(rowCheckbox);

    const firstNameTd = document.createElement("td");
    firstNameTd.textContent = rec.first_name;

    const lastNameTd = document.createElement("td");
    lastNameTd.textContent = rec.last_name;

    const emailTd = document.createElement("td");
    emailTd.textContent = rec.email;

    const phoneTd = document.createElement("td");
    phoneTd.textContent = rec.phone_number;

    const statusTd = document.createElement("td");
    statusTd.textContent = rec.status;

    const createdTd = document.createElement("td");
    createdTd.textContent = rec.created_at
      ? new Date(rec.created_at).toLocaleString()
      : "";

    const actionsTd = document.createElement("td");
    const reverifyBtn = document.createElement("button");
    reverifyBtn.classList.add("action-btn", "reverify-btn");
    reverifyBtn.textContent = "Re-verify";
    reverifyBtn.addEventListener("click", () => openReverifyModal(rec.id));

    const sendOtpBtn = document.createElement("button");
    sendOtpBtn.classList.add("action-btn", "send-otp-btn");
    sendOtpBtn.textContent = "Send OTP";
    sendOtpBtn.addEventListener("click", () => openSendOtpModal(rec.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("action-btn", "delete-btn");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => openDeleteModal(rec.id));

    actionsTd.appendChild(reverifyBtn);
    actionsTd.appendChild(sendOtpBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(checkboxTd);
    tr.appendChild(firstNameTd);
    tr.appendChild(lastNameTd);
    tr.appendChild(emailTd);
    tr.appendChild(phoneTd);
    tr.appendChild(statusTd);
    tr.appendChild(createdTd);
    tr.appendChild(actionsTd);

    tableBody.appendChild(tr);
  });
}


function openReverifyModal(id) {
  recordToReverify = id;
  document.getElementById("reverifyModal").style.display = "flex";
}

function openDeleteModal(id) {
  recordToDelete = id;
  document.getElementById("deleteModal").style.display = "flex";
}

function openSendOtpModal(id) {
  recordToSendOtp = id;
  document.getElementById("sendOtpModal").style.display = "flex";
}

async function reverifyRecord(id) {
  try {
    const response = await fetch(`/revalidate/${id}`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to re-verify");
    const data = await response.json();


    const idx = allRecords.findIndex(r => r.id === data.id);
    if (idx !== -1) {
      allRecords[idx].status = data.status;
    }
    applyFilters();
  } catch (error) {
    console.error("Error re-verifying record:", error);
  }
}

async function deleteRecord(id) {
  try {
    const response = await fetch(`/delete-verified/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete");
    console.log("Record deleted successfully");

    allRecords = allRecords.filter(r => r.id !== id);
    applyFilters();
  } catch (error) {
    console.error("Error deleting record:", error);
  }
}

async function sendOTPRecord(id) {
  try {
    const response = await fetch(`/send-otp/${id}`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to send OTP");
    const data = await response.json();
    console.log("OTP send response:", data.message || data.error || "OTP sent!");
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
}


function getSelectedRowIds() {
  const rows = document.querySelectorAll("#verifiedTable tbody tr");
  let selectedIds = [];
  rows.forEach((row) => {
    const checkbox = row.querySelector(".row-checkbox");
    if (checkbox && checkbox.checked) {
      const rowId = row.dataset.id;
      if (rowId) {
        selectedIds.push(parseInt(rowId));
      }
    }
  });
  return selectedIds;
}

async function bulkReverify(ids) {
  for (const id of ids) {
    await reverifyRecord(id);
  }
}

async function bulkDelete(ids) {
  for (const id of ids) {
    await deleteRecord(id);
  }
}

async function bulkSendOtp(ids) {
  for (const id of ids) {
    await sendOTPRecord(id);
  }
}

function openBulkModal(actionType, ids) {
  bulkActionType = actionType;
  bulkIds = ids;

  const count = ids.length;
  let message = "";
  switch (actionType) {
    case "reverify":
      message = `Are you sure you want to re-verify ${count} record(s)?`;
      break;
    case "sendOtp":
      message = `Are you sure you want to send OTP to ${count} record(s)?`;
      break;
    case "delete":
      message = `Are you sure you want to delete ${count} record(s)?`;
      break;
    default:
      message = `Are you sure you want to do this action for ${count} record(s)?`;
      break;
  }

  document.getElementById("bulkModalMessage").textContent = message;
  document.getElementById("bulkModal").style.display = "flex";
}

function closeBulkModal() {
  document.getElementById("bulkModal").style.display = "none";
  bulkActionType = null;
  bulkIds = [];
}

function applyFilters() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allRecords.filter(rec => {
    const rowText = `${rec.first_name} ${rec.last_name} ${rec.email} ${rec.phone_number} ${rec.status}`.toLowerCase();
    const matchesSearch = rowText.includes(searchText);

    let matchesStatus = true;
    if (currentStatusFilter !== "all") {
      matchesStatus = (rec.status === currentStatusFilter);
    }
    return matchesSearch && matchesStatus;
  });

  populateTable(filtered);
}


document.addEventListener("DOMContentLoaded", () => {

  const logoutModal = document.getElementById("logoutModal");
  document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
    window.location.href = "/logout";
  });
  document.getElementById("cancelLogoutBtn").addEventListener("click", () => {
    logoutModal.style.display = "none";
  });


  const reverifyModal = document.getElementById("reverifyModal");
  document.getElementById("confirmReverifyBtn").addEventListener("click", () => {
    if (recordToReverify !== null) reverifyRecord(recordToReverify);
    reverifyModal.style.display = "none";
    recordToReverify = null;
  });
  document.getElementById("cancelReverifyBtn").addEventListener("click", () => {
    reverifyModal.style.display = "none";
    recordToReverify = null;
  });


  const deleteModal = document.getElementById("deleteModal");
  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    if (recordToDelete !== null) deleteRecord(recordToDelete);
    deleteModal.style.display = "none";
    recordToDelete = null;
  });
  document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
    deleteModal.style.display = "none";
    recordToDelete = null;
  });


  const sendOtpModal = document.getElementById("sendOtpModal");
  document.getElementById("confirmSendOtpBtn").addEventListener("click", () => {
    if (recordToSendOtp !== null) sendOTPRecord(recordToSendOtp);
    sendOtpModal.style.display = "none";
    recordToSendOtp = null;
  });
  document.getElementById("cancelSendOtpBtn").addEventListener("click", () => {
    sendOtpModal.style.display = "none";
    recordToSendOtp = null;
  });


  const profileDropdown = document.getElementById("userDropdown");
  const profileIcon = document.getElementById("profileIcon");
  document.addEventListener("click", (event) => {
    if (
      profileDropdown.style.display === "block" &&
      event.target !== profileDropdown &&
      !profileDropdown.contains(event.target) &&
      event.target !== profileIcon &&
      !profileIcon.contains(event.target)
    ) {
      profileDropdown.style.display = "none";
    }
  });


  document.querySelectorAll(".status-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      const val = opt.getAttribute("data-value");
      setStatusFilter(val);
    });
  });

  document.getElementById("searchIcon").addEventListener("click", applyFilters);
  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") applyFilters();
  });

  document.getElementById("bulkReverifyBtn").addEventListener("click", () => {
    const ids = getSelectedRowIds();
    if (ids.length > 0) {
      openBulkModal("reverify", ids);
    }
  });
  document.getElementById("bulkSendOtpBtn").addEventListener("click", () => {
    const ids = getSelectedRowIds();
    if (ids.length > 0) {
      openBulkModal("sendOtp", ids);
    }
  });
  document.getElementById("bulkDeleteBtn").addEventListener("click", () => {
    const ids = getSelectedRowIds();
    if (ids.length > 0) {
      openBulkModal("delete", ids);
    }
  });

  document.getElementById("selectAllCheckbox").addEventListener("change", (e) => {
    const checked = e.target.checked;
    const rowCheckboxes = document.querySelectorAll(".row-checkbox");
    rowCheckboxes.forEach((cb) => {
      cb.checked = checked;
    });
  });


  document.getElementById("confirmBulkBtn").addEventListener("click", async () => {
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
    closeBulkModal();
  });


  loadVerifiedList();
});
