const noteCreate = document.getElementById('note-create');
const titleInput = document.querySelector('.note-title');
const contentInput = document.querySelector('.note-area');
const notesList = document.querySelector('.notes-list');
let editingNodeId = null;
document.addEventListener('click', (e) => {
    const target = e.target;
    if(target.matches('#note-create-btn')) {
        noteCreate.classList.remove('hidden');
    }

    if(target.matches('.cancel-btn')) {
        noteCreate.classList.add('hidden');
    }

    if(target.matches('.save-btn')) {
        handleSave()
    }

    if(target.matches('.delete-btn')) {
        const noteEl = target.closest('.note-item');
        const id = +noteEl.dataset.id;

        deleteNote(id, noteEl);
    }

    if(target.matches('.edit-btn')) {
        const noteEl = target.closest('.note-item');
        const id = +noteEl.dataset.id;

        startEdit(id);
    }
})

// Indexed db logic
let db;
const request = indexedDB.open('notes-db', 1);

request.onupgradeneeded  = (e) => {
    db = e.target.result;
    db.createObjectStore('notes', {keyPath: 'id'})
}

request.onsuccess = (e) => {
    db = e.target.result;
    loadNotes()
}

request.onerror = () => {
    console.log('Error happened with DB')
}

function handleSave() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if(!title && !content) return;

    const note = {
        id: editingNodeId ?? Date.now(),
        title,
        content,
        created_at: new Date().toISOString()
    }
    console.log(db, "DB")

    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    store.put(note);

    tx.oncomplete = () => {
        loadNotes();
        resetForm();
        editingNodeId = null;
        noteCreate.classList.add('hidden');
    }
}

function renderNote(note) {
    const div = document.createElement('div');
    div.className = 'note-item';
    div.dataset.id = note.id;

      div.innerHTML = `
    <div class="note-item-header">
      <h4>${note.title || 'Untitled'}</h4>
      <div class="note-actions">
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑</button>
      </div>
    </div>
    <p class="note-desc">${note.content}</p>
  `;

  notesList.prepend(div);
}

function resetForm() {
    titleInput.value = '';
    contentInput.value = '';
}

function loadNotes() {
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');

    const req = store.getAll();

    req.onsuccess = () => {
        notesList.innerHTML = '';
        req.result.forEach(note => renderNote(note));
    }
}

function deleteNote(id, noteEl) {
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');

    store.delete(id);

    tx.oncomplete = () => {
        noteEl.remove();
    }
}

function startEdit(id) {
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const req = store.get(id);

    req.onsuccess = () => {
        const note = req.result;
        titleInput.value = note.title;
        contentInput.value = note.content;
        editingNodeId = id;
        noteCreate.classList.remove('hidden');
    }
}

// Register Service Worker
if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => console.log("Service worker registered", reg)).catch((err) => console.log("ERROR", err));
    })
}

