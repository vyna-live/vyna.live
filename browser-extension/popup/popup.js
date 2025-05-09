function addQuickNote2() {
  const input = document.getElementById("notepad-input");
  const editor = document.getElementById("note-editor-textarea");

  if (input && editor) {
    const note = input.value.trim();

    if (note !== "") {
      // const paragraph = document.createElement("p");
      // paragraph.textContent = note;
      console.log(note);

      editor.appendChild(note);
      input.value = "";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("note-button");
  if (button) {
    button.addEventListener("click", addQuickNote2);
  }
});

function addQuickNote2() {
  const input = document.getElementById("notepad-input");
  const editor = document.getElementById("note-editor-textarea");

  const noteText = input.value.trim();

  if (noteText === "") return; // Don't add empty notes

  // Append with a newline to simulate a new paragraph
  editor.value += (editor.value ? "\n\n" : "") + noteText;

  input.value = ""; // Optionally clear the input after adding
}

const button = document.getElementById("note-button");
if (button) {
  button.addEventListener("click", () => {
    addQuickNote2();
  });
}
