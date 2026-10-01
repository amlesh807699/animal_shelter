const state = {
    applicants: [],
    searchQuery: "",
    statusFilter: "all",
    loading: false,
    error: null
};

function render() {
    const app = document.getElementById("app");

    app.innerHTML = `
        <h1>Adoption Interest Queue</h1>
        <p>Loading application...</p>
    `;
}

render();