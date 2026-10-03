"use strict";

/* =========================================
   INITIAL DATA
========================================= */

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


/* =========================================
   LOCAL STORAGE
========================================= */

const storageKey = "haven-adoption-applicants-v1";

let applicants = [...seedApplicants];

try {
  const savedApplicants = JSON.parse(
    localStorage.getItem(storageKey)
  );

  if (Array.isArray(savedApplicants)) {
    applicants = savedApplicants;
  }
} catch (error) {
  console.warn(
    "Local storage unavailable. Using in-memory data.",
    error
  );
}


/* =========================================
   APPLICATION STATE
========================================= */

const state = {
  search: "",
  status: "All Statuses",
  sort: "newest",
  loading: false,
  error: !navigator.onLine
};


/* =========================================
   DOM HELPERS
========================================= */

const $ = (selector) => {
  return document.querySelector(selector);
};

const results = $("#queue-results");


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value) {
  return String(value).replace(
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


/* =========================================
   DATE FORMATTER
========================================= */

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(
    new Date(`${date}T12:00:00Z`)
  );
}


/* =========================================
   INITIALS
========================================= */

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() || ""
    )
    .join("");
}


/* =========================================
   PERSIST DATA
========================================= */

function persist() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(applicants)
    );
  } catch (error) {
    console.warn(
      "Unable to save data to localStorage.",
      error
    );
  }
}


/* =========================================
   RENDER STATISTICS
========================================= */

function renderStats() {

  const totalCount = applicants.length;

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
    totalCount;

  $("#pending-count").textContent =
    pendingCount;

  $("#approved-count").textContent =
    approvedCount;

  $("#heading-count").textContent =
    totalCount;

  $("#nav-count").textContent =
    totalCount;
}


/* =========================================
   FILTER + SORT
========================================= */

function filteredApplicants() {

  const query =
    state.search.trim().toLowerCase();


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
        ].some((value) =>
          String(value)
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


/* =========================================
   STATUS BADGE
========================================= */

function createStatusBadge(status) {

  const statusClass =
    status.toLowerCase();

  return `
    <span class="status-badge status-${statusClass}">
      <span class="badge-dot"></span>
      ${escapeHtml(status)}
    </span>
  `;
}


/* =========================================
   TABLE ROW
========================================= */

function createTableRow(person) {

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
          href="mailto:${encodeURIComponent(person.email)}"
          class="table-link"
        >
          ${escapeHtml(person.email)}
        </a>
      </td>


      <td>
        <a
          href="tel:${escapeHtml(person.phone)}"
          class="table-link"
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
        ${formatDate(person.date)}
      </td>


      <td class="actions-col">

        <button
          class="row-action icon-button"
          type="button"
          data-view="${person.id}"
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
            <circle cx="5" cy="12" r="1"></circle>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
          </svg>

        </button>

      </td>

    </tr>
  `;
}


/* =========================================
   MOBILE CARD
========================================= */

function createMobileCard(person) {

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
              Applied ${formatDate(person.date)}
            </span>

          </div>

        </div>


        <button
          class="row-action icon-button"
          type="button"
          data-view="${person.id}"
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
            <circle cx="5" cy="12" r="1"></circle>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
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

          ${createStatusBadge(person.status)}

        </div>


        <div>

          <span>Email</span>

          <a
            href="mailto:${encodeURIComponent(person.email)}"
          >
            ${escapeHtml(person.email)}
          </a>

        </div>


        <div>

          <span>Phone</span>

          <a href="tel:${escapeHtml(person.phone)}">
            ${escapeHtml(person.phone)}
          </a>

        </div>

      </div>

    </article>
  `;
}


/* =========================================
   LOADING STATE
========================================= */

function renderLoadingState() {

  results.innerHTML = `
    <div
      class="state-panel"
      role="status"
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


/* =========================================
   ERROR STATE
========================================= */

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
          <circle cx="12" cy="12" r="9"></circle>
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
    .addEventListener(
      "click",
      retryLoad
    );
}


/* =========================================
   EMPTY STATE
========================================= */

function renderEmptyState() {

  const addButton =
    applicants.length === 0
      ? `
        <button
          type="button"
          class="button button-secondary state-action"
          data-open-add
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


/* =========================================
   QUEUE RENDER
========================================= */

function renderQueue() {

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

    <!-- DESKTOP TABLE -->

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


    <!-- MOBILE LIST -->

    <div class="mobile-list">
      ${mobileCards}
    </div>


    <!-- FOOTER -->

    <div class="table-footer">

      <span>
        Showing
        <strong>${items.length}</strong>
        of
        <strong>${applicants.length}</strong>
        applications
      </span>

      <span class="footer-helper">
        Keep your queue up to date for faster adoptions.
      </span>

    </div>
  `;
}


/* =========================================
   RETRY
========================================= */

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


/* =========================================
   TOAST
========================================= */

let toastTimeout;

function showToast(message) {

  const toast =
    $("#toast");

  const toastMessage =
    $("#toast-message");


  toastMessage.textContent =
    message;

  toast.hidden = false;


  clearTimeout(toastTimeout);


  toastTimeout =
    setTimeout(() => {

      toast.hidden = true;

    }, 4500);
}


/* =========================================
   ADD APPLICANT FORM
========================================= */

const addDialog =
  $("#add-dialog");

const addForm =
  $("#add-form");


const fieldIds = {

  name: "applicant-name",

  email: "applicant-email",

  phone: "applicant-phone",

  animal: "animal-name"

};


/* =========================================
   VALIDATION
========================================= */

function errorFor(field) {

  const value =
    addForm.elements[field]
      .value
      .trim();


  if (
    field === "name" &&
    !value
  ) {
    return "Name is required";
  }


  if (
    field === "email" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value
    )
  ) {
    return "Enter a valid email address";
  }


  if (
    field === "phone" &&
    !/^\d{10}$/.test(value)
  ) {
    return "Enter a valid 10-digit phone number";
  }


  if (
    field === "animal" &&
    !value
  ) {
    return "Animal name is required";
  }


  return "";
}


function validateField(field) {

  const error =
    errorFor(field);


  const input =
    $(`#${fieldIds[field]}`);


  const message =
    $(`#${field}-error`);


  input.setAttribute(
    "aria-invalid",
    String(Boolean(error))
  );


  message.textContent =
    error;


  return !error;
}


/* =========================================
   OPEN ADD MODAL
========================================= */

function openAdd() {

  addForm.reset();


  Object.keys(fieldIds)
    .forEach((field) => {

      const input =
        $(`#${fieldIds[field]}`);


      const errorMessage =
        $(`#${field}-error`);


      input.removeAttribute(
        "aria-invalid"
      );


      errorMessage.textContent = "";

    });


  addDialog.showModal();


  $("#applicant-name")
    .focus();
}


/* =========================================
   CLOSE ADD MODAL
========================================= */

function closeAdd() {

  addDialog.close();
}


/* =========================================
   EVENT DELEGATION
========================================= */

document.addEventListener(
  "click",
  (event) => {

    const openButton =
      event.target.closest(
        "[data-open-add]"
      );


    if (openButton) {
      openAdd();
    }


    const closeAddButton =
      event.target.closest(
        "[data-close-add]"
      );


    if (closeAddButton) {
      closeAdd();
    }


    const closeDetailButton =
      event.target.closest(
        "[data-close-detail]"
      );


    if (closeDetailButton) {
      $("#detail-dialog").close();
    }


    const viewButton =
      event.target.closest(
        "[data-view]"
      );


    if (viewButton) {

      openDetails(
        Number(
          viewButton.dataset.view
        )
      );

    }

  }
);


/* =========================================
   ADD FORM SUBMIT
========================================= */

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

      $(
        `#${fieldIds[invalidFields[0]]}`
      ).focus();

      return;
    }


    const formData =
      new FormData(addForm);


    const newApplicant = {

      id: Date.now(),

      name:
        formData
          .get("name")
          .trim(),

      email:
        formData
          .get("email")
          .trim(),

      phone:
        formData
          .get("phone")
          .trim(),

      animal:
        formData
          .get("animal")
          .trim(),

      status:
        formData
          .get("status"),

      date:
        new Date()
          .toISOString()
          .slice(0, 10)

    };


    applicants.unshift(
      newApplicant
    );


    persist();


    state.search = "";
    state.status = "All Statuses";
    state.sort = "newest";


    $("#search").value = "";

    $("#status-filter").value =
      "All Statuses";

    $("#sort-filter").value =
      "newest";


    addDialog.close();


    renderStats();

    renderQueue();


    showToast(
      "Applicant added to the interest queue."
    );
  }
);


/* =========================================
   REAL-TIME FORM VALIDATION
========================================= */

Object.keys(fieldIds)
  .forEach((field) => {

    const input =
      $(`#${fieldIds[field]}`);


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


/* =========================================
   DETAILS MODAL
========================================= */

let selectedApplicantId =
  null;


function openDetails(id) {

  const person =
    applicants.find(
      (item) => item.id === id
    );


  if (!person) {
    return;
  }


  selectedApplicantId =
    id;


  $("#detail-content").innerHTML = `

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
            href="mailto:${encodeURIComponent(
              person.email
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
            href="tel:${escapeHtml(
              person.phone
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
          ${formatDate(person.date)}
        </dd>

      </div>

    </dl>


    <div class="field detail-status">

      <label for="detail-status-select">
        Application status
      </label>


      <div class="select-wrap form-select">

        <select
          id="detail-status-select"
        >

          <option
            ${person.status === "Pending"
              ? "selected"
              : ""}
          >
            Pending
          </option>


          <option
            ${person.status === "Contacted"
              ? "selected"
              : ""}
          >
            Contacted
          </option>


          <option
            ${person.status === "Approved"
              ? "selected"
              : ""}
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


  $("#detail-dialog")
    .showModal();
}


/* =========================================
   SAVE STATUS
========================================= */

$("#save-status")
  .addEventListener(
    "click",
    () => {

      const person =
        applicants.find(
          (item) =>
            item.id ===
            selectedApplicantId
        );


      if (!person) {
        return;
      }


      person.status =
        $("#detail-status-select")
          .value;


      persist();


      $("#detail-dialog").close();


      renderStats();

      renderQueue();


      showToast(
        "Application status updated."
      );

    }
  );


/* =========================================
   SEARCH
========================================= */

$("#search")
  .addEventListener(
    "input",
    (event) => {

      state.search =
        event.target.value;

      renderQueue();

    }
  );


/* =========================================
   STATUS FILTER
========================================= */

$("#status-filter")
  .addEventListener(
    "change",
    (event) => {

      state.status =
        event.target.value;

      renderQueue();

    }
  );


/* =========================================
   SORT
========================================= */

$("#sort-filter")
  .addEventListener(
    "change",
    (event) => {

      state.sort =
        event.target.value;

      renderQueue();

    }
  );


/* =========================================
   ONLINE / OFFLINE
========================================= */

window.addEventListener(
  "offline",
  () => {

    state.error = true;

    state.loading = false;

    renderQueue();

  }
);


window.addEventListener(
  "online",
  () => {

    state.error = false;

    renderQueue();

  }
);


/* =========================================
   INITIAL RENDER
========================================= */

renderStats();

renderQueue();