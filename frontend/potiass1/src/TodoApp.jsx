import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Check, X, Edit2 } from 'lucide-react';
import './TodoApp.css';

const API_BASE_URL = 'http://127.0.0.1:3001/todos';

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const inputRef = useRef(null); // To focus the main input after actions

  // (Re-)fetch the todos from the backend whenever todos are changed.
  useEffect(() => {
    // fetch todos from the backend API
    fetchTodos();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const pendingCount = todos.filter(t => !t.completed).length;
    document.title = `Tasks (${pendingCount} pending)`;
  }, [todos]);

  const fetchTodos = async () => {
  try {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : [];

    setTodos(data);
  } catch (error) {
    console.error("Fetch error:", error);
    setTodos([]); // prevent UI crash
  }
  };

  const addTodo = async () => {
    if (input.trim()) {
      try {
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // use str type (instead of int) for id 
            id: new Date(Date.now()).toISOString(),
            text: input.trim(),
            completed: false,
          }),
        });
        if (response.ok) {
          fetchTodos();
        }
      } catch (error) {
        alert("Error saving a new todo.");
        alert(error);
      }

      setInput('');
      inputRef.current?.focus(); // keep focus after adding
    }
  };

  const toggleTodo = async (id) => {
    const todoToToggle = todos.find(todo => todo.id === id);
    if (todoToToggle !== undefined) {
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...todoToToggle,
            completed: !todoToToggle.completed,
          }),
        });
        if (response.ok) {
          fetchTodos();
        }
      } catch (error) {
        alert("Error toggleing a todo's completed status.");
      }
    }
  };

  const deleteTodo = async (id) => {
    const todoToDelete = todos.find(todo => todo.id === id);
    if (window.confirm(`Are you sure you want to delete "${todoToDelete.text}"?`)) {
      if (todoToDelete !== undefined) {
        try {
          const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            fetchTodos();
          }
        } catch (error) {
          alert("Error deleting a todo.");
        }
      }
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = async () => {
    if (editText.trim()) {
      const todoToEdit = todos.find(todo => todo.id === editingId);
      if (todoToEdit !== undefined) {
        try {
          const response = await fetch(`${API_BASE_URL}/${editingId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...todoToEdit,
              text: editText.trim(),
            }),
          });
          if (response.ok) {
            fetchTodos();
            cancelEdit();
          }
        } catch (error) {
          alert("Error toggleing a todo's completed status.");
          alert(error);
        }
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <div className="header">
          <h1 className="header-title">My Tasks</h1>
          <p className="header-subtitle">Stay organized and productive</p>
        </div>

        <div className="input-section">
          <input
            type="text"
            ref={inputRef} // attaching the ref here
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs to be done?"
            className="todo-input"
            disabled={editingId !== null}
          />
          <button onClick={addTodo} className="add-button" disabled={editingId !== null}>
            <Plus size={20} />
            Add
          </button>
        </div>

        <div className="todo-list">
          {todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No tasks yet. Add one above!</p>
            </div>
          ) : (
            <ul className="todo-items">
              {todos.map((todo) => (
                <li key={todo.id} className="todo-item">
                  {/* the current todo is being edited */}
                  {editingId === todo.id ? (
                    <div className="edit-mode">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="edit-input"
                        autoFocus // Native attribute for focus on mount
                      />
                      <button onClick={saveEdit} className="save-button">
                        <Check size={18} />
                      </button>
                      <button onClick={cancelEdit} className="cancel-button">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    /* The todo is not being edited */
                    <>
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`checkbox ${todo.completed ? 'checkbox-completed' : ''}`}
                        disabled={editingId !== null}
                      >
                        {/* the Button shows a Check icon */}
                        {todo.completed && <Check size={16} className="check-icon" />}
                      </button>
                      <span className={`todo-text ${todo.completed ? 'todo-completed' : ''} ${editingId !== null ? 'disabled' : ''}`}>
                        {todo.text}
                      </span>
                      {/* the Button shows an Edit2 icon */}
                      <button
                        onClick={() => startEdit(todo)}
                        className="edit-button"
                        disabled={editingId !== null}
                      >
                        <Edit2 size={18} />
                      </button>
                      {/* the Button shows a Trash2 icon */}
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="delete-button"
                        disabled={editingId !== null}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {todos.length > 0 && (
          <div className="stats">
            <span>{todos.filter(t => !t.completed).length} tasks remaining</span>
          </div>
        )}
      </div>
    </div>
  );
}
// export default function TodoApp() {
//   return <h1 style={{ color: "red" }}>HELLO WORLD</h1>;
// }