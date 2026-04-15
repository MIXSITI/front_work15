import { useEffect, useState } from 'react';

const NOTES_STORAGE_KEY = 'offlineNotes';

const PAGE_TITLES = {
  home: 'Главная',
  about: 'О приложении'
};

export default function AppShellNotes() {
  const [activePage, setActivePage] = useState('home');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/content/${activePage}.html`);
        if (!response.ok) {
          throw new Error(`Cannot load ${activePage}.html`);
        }

        const html = await response.text();
        if (isMounted) {
          setContent(html);
        }
      } catch (error) {
        if (isMounted) {
          setContent('<p class="offline-notes__empty">Ошибка загрузки страницы.</p>');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();
    return () => {
      isMounted = false;
    };
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'home' || !content) {
      return;
    }

    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const list = document.getElementById('notes-list');

    if (!form || !input || !list) {
      return;
    }

    const escapeHtml = (value) =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const loadNotes = () => {
      const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
      list.innerHTML = notes
        .map((note) => `<li>${escapeHtml(note)}</li>`)
        .join('');
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      const text = input.value.trim();

      if (!text) {
        return;
      }

      const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
      notes.unshift(text);
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      input.value = '';
      loadNotes();
    };

    form.addEventListener('submit', handleSubmit);
    loadNotes();

    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  }, [activePage, content]);

  return (
    <section className="offline-notes">
      <div className="section-header">
        <h2>App Shell</h2>
      </div>

      <div className="categories">
        {Object.entries(PAGE_TITLES).map(([page, title]) => (
          <button
            key={page}
            type="button"
            className={`category-btn ${activePage === page ? 'active' : ''}`}
            onClick={() => setActivePage(page)}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="offline-notes__content" style={{ marginTop: 16 }}>
        {isLoading ? (
          <p className="offline-notes__empty">Загрузка...</p>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </section>
  );
}
