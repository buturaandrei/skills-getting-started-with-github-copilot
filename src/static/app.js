document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: ottieni iniziali da nome/email
  function getInitials(nameOrEmail) {
    if (!nameOrEmail) return "";
    const name = nameOrEmail.split("@")[0].replace(/[._\-]/g, " ");
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear previous options and add default option to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML: avatar + name, plus count in header
        const participantsHTML = details.participants.length
          ? details.participants
              .map((p) =>
                `<li class="participant-item"><span class="participant-avatar">${getInitials(
                  p
                )}</span><span class="participant-name">${p}</span><button class="participant-delete" data-activity="${encodeURIComponent(
                  name
                )}" data-email="${encodeURIComponent(p)}" title="Remove participant">🗑️</button></li>`
              )
              .join("")
          : `<li class="participant-empty">No participants yet</li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <p><strong>Participants (${details.participants.length}):</strong></p>
            <ul class="participants-list">
              ${participantsHTML}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Delegate delete clicks via event listener on the card
          // (we use delegation outside after rendering all activities too)

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Event delegation: handle delete button clicks inside activities list
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest && e.target.closest(".participant-delete");
    if (!btn) return;

    const activityEncoded = btn.dataset.activity;
    const emailEncoded = btn.dataset.email;

    if (!activityEncoded || !emailEncoded) return;

    const activityName = decodeURIComponent(activityEncoded);
    const email = decodeURIComponent(emailEncoded);

    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh the activities list to reflect the change
        fetchActivities();
      } else {
        alert(result.detail || "Failed to remove participant");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      alert("Failed to remove participant. Please try again.");
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
