"use strict";

// Haven - Adoption Interest Queue

// Basic limits used throughout the app.
const SECURITY = Object.freeze({

  MAX_NAME_LENGTH: 80,

  MAX_EMAIL_LENGTH: 254,

  MAX_PHONE_LENGTH: 15,

  MAX_ANIMAL_LENGTH: 80,

  MAX_STORAGE_RECORDS: 500,

  ALLOWED_STATUSES: Object.freeze([
    "Pending",
    "Contacted",
    "Approved"
  ])

});


// Initial data shown when there is no saved data yet.
const seedApplicants = [

  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "9876543210",
    animal: "Max",
    status: "Pending",
    date: "2026-10-01"
  },

  {
    id: 2,
    name: "Priya Singh",
    email: "priya@example.com",
    phone: "9876543211",
    animal: "Bruno",
    status: "Contacted",
    date: "2026-09-30"
  },

  {
    id: 3,
    name: "Aman Verma",
    email: "aman@example.com",
    phone: "9876543212",
    animal: "Luna",
    status: "Approved",
    date: "2026-09-29"
  },

  {
    id: 4,
    name: "Neha Kapoor",
    email: "neha@example.com",
    phone: "9876543213",
    animal: "Milo",
    status: "Pending",
    date: "2026-09-28"
  },

  {
    id: 5,
    name: "Arjun Mehta",
    email: "arjun@example.com",
    phone: "9876543214",
    animal: "Daisy",
    status: "Contacted",
    date: "2026-09-26"
  },

  {
    id: 6,
    name: "Sara Khan",
    email: "sara@example.com",
    phone: "9876543215",
    animal: "Oscar",
    status: "Pending",
    date: "2026-09-24"
  }

];


// localStorage key
const storageKey =
  "haven-adoption-applicants-v1";


// Small DOM helper
const $ = (selector) =>
  document.querySelector(selector);


const results =
  $("#queue-results");


const addDialog =
  $("#add-dialog");


const addForm =
  $("#add-form");


// Escape values before putting them inside HTML.
function escapeHtml(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => {

      const entities = {

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#39;"

      };

      return entities[character];

    }
  );

}


// Clean up text before using it.
function normalizeText(value, maxLength) {

  return String(value ?? "")

    .normalize("NFKC")

    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ""
    )

    .trim()

    .slice(0, maxLength);

}


// Name helpers
function normalizeName(value) {

  return normalizeText(
    value,
    SECURITY.MAX_NAME_LENGTH
  );

}


function isValidName(value) {

  return (

    typeof value === "string" &&

    value.length >= 2 &&

    value.length <= SECURITY.MAX_NAME_LENGTH &&

    /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(value)

  );

}


// Email helpers
function normalizeEmail(value) {

  return normalizeText(
    value,
    SECURITY.MAX_EMAIL_LENGTH
  ).toLowerCase();

}


function isValidEmail(value) {

  if (
    typeof value !== "string" ||
    value.length > SECURITY.MAX_EMAIL_LENGTH
  ) {

    return false;

  }


  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
    value
  );

}


// Phone helpers
function normalizePhone(value) {

  return String(value ?? "")
    .replace(/[^\d+]/g, "")
    .slice(0, SECURITY.MAX_PHONE_LENGTH);

}


function isValidPhone(value) {

  return /^\d{10}$/.test(value);

}


// Animal name helpers
function normalizeAnimal(value) {

  return normalizeText(
    value,
    SECURITY.MAX_ANIMAL_LENGTH
  );

}


function isValidAnimal(value) {

  return (

    typeof value === "string" &&

    value.length >= 1 &&

    value.length <= SECURITY.MAX_ANIMAL_LENGTH &&

    /^[\p{L}\p{M}0-9 .'-]+$/u.test(value)

  );

}


// Status helpers
function isValidStatus(status) {

  return SECURITY.ALLOWED_STATUSES.includes(
    status
  );

}


function normalizeStatus(status) {

  return isValidStatus(status)
    ? status
    : "Pending";

}


// Date helpers
function isValidDateString(value) {

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {

    return false;

  }


  const date =
    new Date(`${value}T12:00:00Z`);


  return !Number.isNaN(
    date.getTime()
  );

}


function normalizeDate(value) {

  if (isValidDateString(value)) {

    return value;

  }


  return new Date()
    .toISOString()
    .slice(0, 10);

}


// IDs should always be positive safe integers.
function isValidId(value) {

  return (

    Number.isSafeInteger(value) &&

    value > 0

  );

}


// Check one applicant before using it.
function sanitizeApplicantRecord(record) {

  if (
    !record ||
    typeof record !== "object" ||
    Array.isArray(record)
  ) {

    return null;

  }


  const id =
    Number(record.id);


  const name =
    normalizeName(record.name);


  const email =
    normalizeEmail(record.email);


  const phone =
    normalizePhone(record.phone);


  const animal =
    normalizeAnimal(record.animal);


  const status =
    normalizeStatus(record.status);


  const date =
    normalizeDate(record.date);


  if (!isValidId(id)) {

    return null;

  }


  if (!isValidName(name)) {

    return null;

  }


  if (!isValidEmail(email)) {

    return null;

  }


  if (!isValidPhone(phone)) {

    return null;

  }


  if (!isValidAnimal(animal)) {

    return null;

  }


  if (!isValidDateString(date)) {

    return null;

  }


  return {

    id,

    name,

    email,

    phone,

    animal,

    status,

    date

  };

}


// Validate all records loaded from storage.
function sanitizeApplicantList(value) {

  if (!Array.isArray(value)) {

    return [];

  }


  const limited =
    value.slice(
      0,
      SECURITY.MAX_STORAGE_RECORDS
    );


  const sanitized =
    limited

      .map(sanitizeApplicantRecord)

      .filter(Boolean);


  // Remove duplicate IDs.
  const seenIds =
    new Set();


  return sanitized.filter(
    (person) => {

      if (seenIds.has(person.id)) {

        return false;

      }


      seenIds.add(person.id);

      return true;

    }
  );

}


// Read localStorage without assuming that its contents are safe.
function loadApplicants() {

  try {

    const raw =
      localStorage.getItem(storageKey);


    if (!raw) {

      return [...seedApplicants];

    }


    const parsed =
      JSON.parse(raw);


    const safeApplicants =
      sanitizeApplicantList(parsed);


    // If everything in storage is broken, start with the seed data.
    if (
      parsed.length > 0 &&
      safeApplicants.length === 0
    ) {

      console.warn(
        "[Security] Invalid localStorage data rejected."
      );


      return [...seedApplicants];

    }


    return safeApplicants;

  } catch (error) {

    console.warn(
      "[Security] Storage data could not be trusted. Using safe defaults.",
      error
    );


    return [...seedApplicants];

  }

}


let applicants =
  loadApplicants();


// Current UI state.
const state = {

  search: "",

  status: "All Statuses",

  sort: "newest",

  loading: false,

  error: !navigator.onLine

};


// Save the current list.
function persist() {

  try {

    // Check the data again before saving it.
    const safeApplicants =
      sanitizeApplicantList(
        applicants
      );


    localStorage.setItem(
      storageKey,
      JSON.stringify(
        safeApplicants
      )
    );


  } catch (error) {

    console.warn(
      "[Security] Unable to persist applicant data.",
      error
    );


    showToast(
      "Unable to save changes on this device."
    );

  }

}


// Simple analytics placeholder.
function analytics(eventName) {

  console.info(
    `[Analytics] ${eventName}`
  );

}


// Format dates for the UI.
function formatDate(date) {

  if (!isValidDateString(date)) {

    return "Unknown date";

  }


  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }
  ).format(
    new Date(`${date}T12:00:00Z`)
  );

}


// Create initials for the avatar.
function initials(name) {

  return normalizeName(name)

    .split(/\s+/)

    .slice(0, 2)

    .map(
      (part) =>
        part[0]?.toUpperCase() || ""
    )

    .join("");

}


// Update the numbers shown above the table.
function renderStats() {

  const totalCount =
    applicants.length;


  const pendingCount =
    applicants.filter(
      (person) =>
        person.status === "Pending"
    ).length;


  const approvedCount =
    applicants.filter(
      (person) =>
        person.status === "Approved"
    ).length;


  $("#total-count").textContent =
    String(totalCount);


  $("#pending-count").textContent =
    String(pendingCount);


  $("#approved-count").textContent =
    String(approvedCount);


  $("#heading-count").textContent =
    String(totalCount);


  $("#nav-count").textContent =
    String(totalCount);

}


// Apply the current search, status filter and sort order.
function filteredApplicants() {

  const query =
    state.search
      .trim()
      .toLowerCase();


  return applicants

    .filter((person) => {

      const matchesStatus =
        state.status === "All Statuses" ||
        person.status === state.status;


      const matchesSearch =
        [
          person.name,
          person.email,
          person.phone,
          person.animal
        ].some(
          (value) =>
            value
              .toLowerCase()
              .includes(query)
        );


      return (
        matchesStatus &&
        matchesSearch
      );

    })

    .sort((a, b) => {

      if (state.sort === "newest") {

        return (
          b.date.localeCompare(a.date) ||
          b.id - a.id
        );

      }


      return (
        a.date.localeCompare(b.date) ||
        a.id - b.id
      );

    });

}


// Build the status badge.
function createStatusBadge(status) {

  const safeStatus =
    normalizeStatus(status);


  const statusClass =
    safeStatus.toLowerCase();


  return `

    <span
      class="status-badge status-${escapeHtml(
        statusClass
      )}"
    >

      <span
        class="badge-dot"
        aria-hidden="true"
      ></span>

      ${escapeHtml(safeStatus)}

    </span>

  `;

}


// Build a mailto link only after checking the email.
function safeMailto(email) {

  const safeEmail =
    normalizeEmail(email);


  if (!isValidEmail(safeEmail)) {

    return "#";

  }


  return `mailto:${encodeURIComponent(
    safeEmail
  )}`;

}


// Build a phone link only after checking the number.
function safeTel(phone) {

  const safePhone =
    normalizePhone(phone);


  if (!isValidPhone(safePhone)) {

    return "#";

  }


  return `tel:${safePhone}`;

}


// Create a table row.
function createTableRow(person) {

  const safeId =
    Number(person.id);


  return `

    <tr>

      <td>

        <div class="applicant-cell">

          <span
            class="applicant-avatar"
            aria-hidden="true"
          >
            ${escapeHtml(
              initials(person.name)
            )}
          </span>


          <strong>
            ${escapeHtml(person.name)}
          </strong>

        </div>

      </td>


      <td>

        <a
          href="${escapeHtml(
            safeMailto(person.email)
          )}"
          class="table-link"
          aria-label="Email ${escapeHtml(
            person.name
          )}"
        >
          ${escapeHtml(person.email)}
        </a>

      </td>


      <td>

        <a
          href="${escapeHtml(
            safeTel(person.phone)
          )}"
          class="table-link"
          aria-label="Call ${escapeHtml(
            person.name
          )}"
        >
          ${escapeHtml(person.phone)}
        </a>

      </td>


      <td>

        <span class="animal-name">
          ${escapeHtml(person.animal)}
        </span>

      </td>


      <td>
        ${createStatusBadge(person.status)}
      </td>


      <td class="date-cell">
        ${escapeHtml(
          formatDate(person.date)
        )}
      </td>


      <td class="actions-col">

        <button
          class="row-action icon-button"
          type="button"
          data-view="${safeId}"
          aria-label="View application for ${escapeHtml(
            person.name
          )}"
        >

          <svg
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >

            <circle
              cx="5"
              cy="12"
              r="1"
            ></circle>

            <circle
              cx="12"
              cy="12"
              r="1"
            ></circle>

            <circle
              cx="19"
              cy="12"
              r="1"
            ></circle>

          </svg>

        </button>

      </td>

    </tr>

  `;

}


// Mobile version of the applicant row.
function createMobileCard(person) {

  const safeId =
    Number(person.id);


  return `

    <article class="mobile-card">

      <div class="mobile-card-top">

        <div class="applicant-cell">

          <span
            class="applicant-avatar"
            aria-hidden="true"
          >
            ${escapeHtml(
              initials(person.name)
            )}
          </span>


          <div>

            <strong>
              ${escapeHtml(person.name)}
            </strong>


            <span class="mobile-date">

              Applied
              ${escapeHtml(
                formatDate(person.date)
              )}

            </span>

          </div>

        </div>


        <button
          class="row-action icon-button"
          type="button"
          data-view="${safeId}"
          aria-label="View application for ${escapeHtml(
            person.name
          )}"
        >

          <svg
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >

            <circle
              cx="5"
              cy="12"
              r="1"
            ></circle>

            <circle
              cx="12"
              cy="12"
              r="1"
            ></circle>

            <circle
              cx="19"
              cy="12"
              r="1"
            ></circle>

          </svg>

        </button>

      </div>


      <div class="mobile-card-info">

        <div>

          <span>Animal</span>

          <strong>
            ${escapeHtml(person.animal)}
          </strong>

        </div>


        <div>

          <span>Status</span>

          ${createStatusBadge(
            person.status
          )}

        </div>


        <div>

          <span>Email</span>

          <a
            href="${escapeHtml(
              safeMailto(person.email)
            )}"
            aria-label="Email ${escapeHtml(
              person.name
            )}"
          >
            ${escapeHtml(person.email)}
          </a>

        </div>


        <div>

          <span>Phone</span>

          <a
            href="${escapeHtml(
              safeTel(person.phone)
            )}"
            aria-label="Call ${escapeHtml(
              person.name
            )}"
          >
            ${escapeHtml(person.phone)}
          </a>

        </div>

      </div>

    </article>

  `;

}


// Loading screen
function renderLoadingState() {

  results.innerHTML = `

    <div
      class="state-panel"
      role="status"
      aria-live="polite"
    >

      <span
        class="spinner"
        aria-hidden="true"
      ></span>


      <h3>
        Loading adoption queue...
      </h3>


      <p>
        Getting the latest applications ready for you.
      </p>

    </div>

  `;

}


// Error screen
function renderErrorState() {

  results.innerHTML = `

    <div class="state-panel">

      <div class="state-icon">

        <svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >

          <circle
            cx="12"
            cy="12"
            r="9"
          ></circle>

          <path d="M12 7.5v5.5"></path>

          <path d="M12 16.5h.01"></path>

        </svg>

      </div>


      <h3>
        Unable to load adoption queue.
      </h3>


      <p>
        Please check your connection and try again.
      </p>


      <button
        type="button"
        class="button button-secondary state-action"
        id="retry-button"
        aria-label="Retry loading adoption queue"
      >

        Try Again

        <svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >

          <path d="M5 12h14"></path>

          <path d="m13 6 6 6-6 6"></path>

        </svg>

      </button>

    </div>

  `;


  $("#retry-button")
    ?.addEventListener(
      "click",
      retryLoad
    );

}


// Empty search/filter result
function renderEmptyState() {

  const addButton =
    applicants.length === 0

      ? `

        <button
          type="button"
          class="button button-secondary state-action"
          data-open-add
          aria-label="Add new applicant"
        >

          <svg
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >

            <path d="M12 5v14"></path>

            <path d="M5 12h14"></path>

          </svg>

          Add Applicant

        </button>

      `

      : "";


  results.innerHTML = `

    <div class="state-panel">

      <div class="state-icon">

        <svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >

          <path d="M4.5 4.5h15l2 11v4h-19v-4l2-11Z"></path>

          <path d="M2.5 15.5h5l2 3h5l2-3h5"></path>

        </svg>

      </div>


      <h3>
        No data found
      </h3>


      <p>
        Try changing your search or filter,
        or add a new adoption application.
      </p>


      ${addButton}

    </div>

  `;

}


// Main queue renderer
function renderQueue() {

  if (!results) {

    return;

  }


  results.setAttribute(
    "aria-busy",
    String(state.loading)
  );


  if (state.loading) {

    renderLoadingState();

    return;

  }


  if (state.error) {

    renderErrorState();

    return;

  }


  const items =
    filteredApplicants();


  if (!items.length) {

    renderEmptyState();

    return;

  }


  const tableRows =
    items
      .map(createTableRow)
      .join("");


  const mobileCards =
    items
      .map(createMobileCard)
      .join("");


  results.innerHTML = `

    <div class="table-scroll">

      <table>

        <thead>

          <tr>

            <th scope="col">
              Applicant
            </th>

            <th scope="col">
              Email
            </th>

            <th scope="col">
              Phone
            </th>

            <th scope="col">
              Animal
            </th>

            <th scope="col">
              Status
            </th>

            <th scope="col">
              Applied Date
            </th>

            <th
              scope="col"
              class="actions-col"
            >
              Actions
            </th>

          </tr>

        </thead>


        <tbody>
          ${tableRows}
        </tbody>

      </table>

    </div>


    <div class="mobile-list">
      ${mobileCards}
    </div>


    <div class="table-footer">

      <span>

        Showing
        <strong>
          ${items.length}
        </strong>

        of

        <strong>
          ${applicants.length}
        </strong>

        applications

      </span>


      <span class="footer-helper">

        Keep your queue up to date for faster adoptions.

      </span>

    </div>

  `;

}


// Fake retry request for the demo.
function retryLoad() {

  state.loading = true;

  state.error = false;

  renderQueue();


  setTimeout(() => {

    state.loading = false;

    state.error =
      !navigator.onLine;


    renderQueue();

  }, 550);

}


// Toast messages
let toastTimeout = null;


function showToast(message) {

  const toast =
    $("#toast");


  const toastMessage =
    $("#toast-message");


  if (!toast || !toastMessage) {

    return;

  }


  toastMessage.textContent =
    String(message);


  toast.hidden = false;


  clearTimeout(
    toastTimeout
  );


  toastTimeout =
    setTimeout(() => {

      toast.hidden = true;

    }, 4500);

}


// Form field IDs
const fieldIds = {

  name: "applicant-name",

  email: "applicant-email",

  phone: "applicant-phone",

  animal: "animal-name"

};


// Return a validation message for a form field.
function errorFor(field) {

  const input =
    addForm?.elements?.[field];


  if (!input) {

    return "Invalid field";

  }


  const value =
    String(input.value ?? "")
      .trim();


  if (
    field === "name"
  ) {

    const name =
      normalizeName(value);


    if (!name) {

      return "Name is required";

    }


    if (!isValidName(name)) {

      return "Enter a valid name";

    }

  }


  if (
    field === "email"
  ) {

    const email =
      normalizeEmail(value);


    if (!isValidEmail(email)) {

      return "Enter a valid email address";

    }

  }


  if (
    field === "phone"
  ) {

    const phone =
      normalizePhone(value);


    if (!isValidPhone(phone)) {

      return "Enter a valid 10-digit phone number";

    }

  }


  if (
    field === "animal"
  ) {

    const animal =
      normalizeAnimal(value);


    if (!isValidAnimal(animal)) {

      return "Enter a valid animal name";

    }

  }


  return "";

}


// Validate one field and update its error message.
function validateField(field) {

  const error =
    errorFor(field);


  const input =
    $(`#${fieldIds[field]}`);


  const message =
    $(`#${field}-error`);


  if (!input || !message) {

    return false;

  }


  input.setAttribute(
    "aria-invalid",
    String(Boolean(error))
  );


  message.textContent =
    error;


  return !error;

}


// Open add applicant modal.
function openAdd() {

  if (!addDialog || !addForm) {

    return;

  }


  addForm.reset();


  Object.keys(fieldIds)
    .forEach((field) => {

      const input =
        $(`#${fieldIds[field]}`);


      const errorMessage =
        $(`#${field}-error`);


      if (input) {

        input.removeAttribute(
          "aria-invalid"
        );

      }


      if (errorMessage) {

        errorMessage.textContent =
          "";

      }

    });


  addDialog.showModal();


  $("#applicant-name")
    ?.focus();

}


// Close add applicant modal.
function closeAdd() {

  if (
    addDialog &&
    addDialog.open
  ) {

    addDialog.close();

  }

}


// Handle buttons created dynamically inside the queue.
document.addEventListener(
  "click",
  (event) => {

    const target =
      event.target;


    if (!(target instanceof Element)) {

      return;

    }


    const openButton =
      target.closest(
        "[data-open-add]"
      );


    if (openButton) {

      openAdd();

      return;

    }


    const closeAddButton =
      target.closest(
        "[data-close-add]"
      );


    if (closeAddButton) {

      closeAdd();

      return;

    }


    const closeDetailButton =
      target.closest(
        "[data-close-detail]"
      );


    if (closeDetailButton) {

      const detailDialog =
        $("#detail-dialog");


      if (
        detailDialog &&
        detailDialog.open
      ) {

        detailDialog.close();

      }


      return;

    }


    const viewButton =
      target.closest(
        "[data-view]"
      );


    if (viewButton) {

      const id =
        Number(
          viewButton.dataset.view
        );


      if (!isValidId(id)) {

        return;

      }


      openDetails(id);

    }

  }
);


// Add applicant form
if (addForm) {

  addForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      const fields =
        Object.keys(fieldIds);


      const invalidFields =
        fields.filter(
          (field) =>
            !validateField(field)
        );


      if (invalidFields.length) {

        const firstInvalid =
          $(
            `#${fieldIds[
              invalidFields[0]
            ]}`
          );


        firstInvalid?.focus();

        return;

      }


      const formData =
        new FormData(addForm);


      // Normalize values before changing the state.
      const name =
        normalizeName(
          formData.get("name")
        );


      const email =
        normalizeEmail(
          formData.get("email")
        );


      const phone =
        normalizePhone(
          formData.get("phone")
        );


      const animal =
        normalizeAnimal(
          formData.get("animal")
        );


      const status =
        normalizeStatus(
          formData.get("status")
        );


      // Validate again before creating the record.
      if (
        !isValidName(name) ||
        !isValidEmail(email) ||
        !isValidPhone(phone) ||
        !isValidAnimal(animal) ||
        !isValidStatus(status)
      ) {

        showToast(
          "Invalid application data."
        );

        return;

      }


      const newApplicant = {

        id: Date.now(),

        name,

        email,

        phone,

        animal,

        status,

        date:
          new Date()
            .toISOString()
            .slice(0, 10)

      };


      // Make sure the complete record is valid.
      const safeApplicant =
        sanitizeApplicantRecord(
          newApplicant
        );


      if (!safeApplicant) {

        showToast(
          "Application could not be added."
        );

        return;

      }


      applicants.unshift(
        safeApplicant
      );


      // Keep local storage from growing indefinitely.
      applicants =
        applicants.slice(
          0,
          SECURITY.MAX_STORAGE_RECORDS
        );


      persist();


      state.search = "";

      state.status =
        "All Statuses";

      state.sort =
        "newest";


      const search =
        $("#search");


      const statusFilter =
        $("#status-filter");


      const sortFilter =
        $("#sort-filter");


      if (search) {

        search.value = "";

      }


      if (statusFilter) {

        statusFilter.value =
          "All Statuses";

      }


      if (sortFilter) {

        sortFilter.value =
          "newest";

      }


      closeAdd();


      renderStats();

      renderQueue();


      analytics(
        "User added an adoption application"
      );


      showToast(
        "Applicant added to the interest queue."
      );

    }
  );

}


// Validate fields while the user is filling the form.
Object.keys(fieldIds)
  .forEach((field) => {

    const input =
      $(`#${fieldIds[field]}`);


    if (!input) {

      return;

    }


    input.addEventListener(
      "blur",
      () => {

        if (
          input.value ||
          input.getAttribute(
            "aria-invalid"
          ) === "true"
        ) {

          validateField(field);

        }

      }
    );


    input.addEventListener(
      "input",
      () => {

        if (
          input.hasAttribute(
            "aria-invalid"
          )
        ) {

          validateField(field);

        }

      }
    );

  });


// Currently selected application.
let selectedApplicantId =
  null;


// Open the application details modal.
function openDetails(id) {

  if (!isValidId(id)) {

    return;

  }


  const person =
    applicants.find(
      (item) =>
        item.id === id
    );


  if (!person) {

    showToast(
      "Application not found."
    );

    return;

  }


  selectedApplicantId =
    id;


  const detailContent =
    $("#detail-content");


  if (!detailContent) {

    return;

  }


  detailContent.innerHTML = `

    <div class="detail-person">

      <span
        class="applicant-avatar large-avatar"
        aria-hidden="true"
      >
        ${escapeHtml(
          initials(person.name)
        )}
      </span>


      <div>

        <strong>
          ${escapeHtml(person.name)}
        </strong>


        <span>
          Interested in
          ${escapeHtml(person.animal)}
        </span>

      </div>

    </div>


    <dl class="detail-list">

      <div>

        <dt>
          Email
        </dt>


        <dd>

          <a
            href="${escapeHtml(
              safeMailto(person.email)
            )}"
          >
            ${escapeHtml(person.email)}
          </a>

        </dd>

      </div>


      <div>

        <dt>
          Phone
        </dt>


        <dd>

          <a
            href="${escapeHtml(
              safeTel(person.phone)
            )}"
          >
            ${escapeHtml(person.phone)}
          </a>

        </dd>

      </div>


      <div>

        <dt>
          Animal
        </dt>


        <dd>
          ${escapeHtml(person.animal)}
        </dd>

      </div>


      <div>

        <dt>
          Applied
        </dt>


        <dd>
          ${escapeHtml(
            formatDate(person.date)
          )}
        </dd>

      </div>

    </dl>


    <div class="field detail-status">

      <label
        for="detail-status-select"
      >
        Application status
      </label>


      <div class="select-wrap form-select">

        <select
          id="detail-status-select"
          aria-label="Application status"
        >

          <option
            value="Pending"
            ${
              person.status === "Pending"
                ? "selected"
                : ""
            }
          >
            Pending
          </option>


          <option
            value="Contacted"
            ${
              person.status === "Contacted"
                ? "selected"
                : ""
            }
          >
            Contacted
          </option>


          <option
            value="Approved"
            ${
              person.status === "Approved"
                ? "selected"
                : ""
            }
          >
            Approved
          </option>

        </select>


        <svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >

          <path d="m6 9 6 6 6-6"></path>

        </svg>

      </div>

    </div>

  `;


  const detailDialog =
    $("#detail-dialog");


  if (detailDialog) {

    detailDialog.showModal();

  }

}


// Save a changed application status.
const saveStatusButton =
  $("#save-status");


if (saveStatusButton) {

  saveStatusButton.addEventListener(
    "click",
    () => {

      if (
        !isValidId(
          selectedApplicantId
        )
      ) {

        return;

      }


      const person =
        applicants.find(
          (item) =>
            item.id ===
            selectedApplicantId
        );


      if (!person) {

        showToast(
          "Application not found."
        );

        return;

      }


      const select =
        $("#detail-status-select");


      if (!select) {

        return;

      }


      const newStatus =
        select.value;


      // A select value can still be changed through the browser.
      if (!isValidStatus(newStatus)) {

        showToast(
          "Invalid application status."
        );

        return;

      }


      person.status =
        newStatus;


      // Check the record after the update.
      const safePerson =
        sanitizeApplicantRecord(
          person
        );


      if (!safePerson) {

        showToast(
          "Invalid application data detected."
        );

        return;

      }


      person.status =
        safePerson.status;


      persist();


      const detailDialog =
        $("#detail-dialog");


      if (
        detailDialog &&
        detailDialog.open
      ) {

        detailDialog.close();

      }


      renderStats();

      renderQueue();


      analytics(
        "User updated adoption application status"
      );


      showToast(
        "Application status updated."
      );

    }
  );

}


// Search
const searchInput =
  $("#search");


if (searchInput) {

  searchInput.addEventListener(
    "input",
    (event) => {

      state.search =
        normalizeText(
          event.target.value,
          100
        );


      renderQueue();

    }
  );

}


// Status filter
const statusFilter =
  $("#status-filter");


if (statusFilter) {

  statusFilter.addEventListener(
    "change",
    (event) => {

      const value =
        event.target.value;


      state.status =
        value === "All Statuses" ||
        isValidStatus(value)

          ? value

          : "All Statuses";


      renderQueue();

    }
  );

}


// Sort order
const sortFilter =
  $("#sort-filter");


if (sortFilter) {

  sortFilter.addEventListener(
    "change",
    (event) => {

      const value =
        event.target.value;


      state.sort =
        value === "oldest"
          ? "oldest"
          : "newest";


      renderQueue();

    }
  );

}


// Handle going offline.
window.addEventListener(
  "offline",
  () => {

    state.error = true;

    state.loading = false;

    renderQueue();

    showToast(
      "You appear to be offline."
    );

  }
);


// Handle connection coming back.
window.addEventListener(
  "online",
  () => {

    state.error = false;

    renderQueue();

    showToast(
      "Connection restored."
    );

  }
);


// If another tab changes the stored data, reload it.
window.addEventListener(
  "storage",
  (event) => {

    if (
      event.key !== storageKey
    ) {

      return;

    }


    applicants =
      loadApplicants();


    renderStats();

    renderQueue();

  }
);


// Close dialogs with Escape.
document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key !== "Escape"
    ) {

      return;

    }


    if (
      addDialog &&
      addDialog.open
    ) {

      addDialog.close();

      return;

    }


    const detailDialog =
      $("#detail-dialog");


    if (
      detailDialog &&
      detailDialog.open
    ) {

      detailDialog.close();

    }

  }
);


// First render
renderStats();

renderQueue();


console.info(
  "[Security] Adoption Interest Queue initialized with client-side input validation, output encoding, storage validation and controlled state."
);