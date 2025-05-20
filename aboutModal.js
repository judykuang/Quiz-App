function injectAboutModal() {
    const modalHTML = `
      <div id="about-modal" class="modal">
        <div class="modal-content">
          <span class="close-button" id="close-modal">&times;</span>
          <h2>About Quiz App</h2>
          <p>
            Quiz App is a quiz game that challenges your knowledge across multiple categories.
            Choose a category, difficulty, and number of questions to start playing. Good luck!
          </p>
        </div>
      </div>
    `;
  
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  
    const aboutLink = document.getElementById("about-link");
    const aboutModal = document.getElementById("about-modal");
    const closeModal = document.getElementById("close-modal");
  
    if (aboutLink && aboutModal && closeModal) {
      aboutLink.addEventListener("click", function (e) {
        e.preventDefault();
        aboutModal.style.display = "block";
      });
  
      closeModal.addEventListener("click", function () {
        aboutModal.style.display = "none";
      });
  
      window.addEventListener("click", function (e) {
        if (e.target === aboutModal) {
          aboutModal.style.display = "none";
        }
      });
    }
  }
  
  window.addEventListener("DOMContentLoaded", injectAboutModal);
  