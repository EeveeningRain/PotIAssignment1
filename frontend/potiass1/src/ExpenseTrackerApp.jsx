import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Check, X, Edit2 } from 'lucide-react';
import './ExpenseTrackerApp.css';

const API_BASE_URL = 'http://127.0.0.1:3001/expenses';

export default function ExpenseTrackerApp() {
  const [expenses, setExpenses] = useState([]);
  const [totalCost, setTotalCost] = useState(null);
  const [costOverCategories, setCostOverCategories] = useState(null);
  const [input, setInput] = useState('');
  const [category, setCategory] =  useState('');
  const [amount, setAmount] = useState('');
  const [cost, setCost] = useState('');
  const [desc, setDesc]  = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState(null);
  const [fieldName, setFieldName] = useState('');

  const inputRef = useRef(null); // To focus the main input after actions

  // (Re-)fetch the Expenses from the backend whenever expenses are changed.
  useEffect(() => {
    // fetch expenses from the backend API
    fetchExpenses();
    inputRef.current?.focus();
  }, []);

  // Fetch the correct title for document at load
  useEffect(() => {
    document.title = `Expenses (${expenses.length} on tracker)`;
    setTotalCost(calculateCostOfExpenses());
    setCostOverCategories(calculateCostOverCategories());
  }, [expenses]);

  // used for the useEffect hook, grabs expenses from api url
  const fetchExpenses = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  //add expense logic, note need to grab input from multiple fields
  const addExpense = async () => {
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
            title: input.trim(),
            category: category.trim(),
            amount: parseInt(amount.trim()),
            cost: parseFloat(cost.trim()),
            date: new Date(Date.now()).toDateString(),
            desc: desc.trim(),
          }),
        });
        if (response.ok) {
          fetchExpenses();
        }
      } catch (error) {
        alert("Error saving a new expense.");
        alert(error);
      }

      // make sure to set fields back to empty
      setInput('');
      setCategory('');
      setAmount('');
      setCost('');
      setDesc('');
      inputRef.current?.focus(); // keep focus after adding
    }
  };

  //find an expense by id, then ask db to delete it
  const deleteExpense = async (id) => {
    const expenseToDelete = expenses.find(expense => expense.id === id);
    if (window.confirm(`Are you sure you want to delete "${expenseToDelete.title}"?`)) {
      if (expenseToDelete !== undefined) {
        try {
          const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            fetchExpenses();
          }
        } catch (error) {
          alert("Error deleting an expense.");
        }
      }
    }
  };

  //start edit logic - note need to specify which property in entry will be edited
  const startEdit = (expense, expenseField) => {
    setEditingId(expense.id);
    setEditText(expenseField);
    if(expenseField === expense.title) setFieldName('title');
    else if(expenseField === expense.category) setFieldName('category');
    else if(expenseField === expense.amount) setFieldName('amount');
    else if(expenseField === expense.cost) setFieldName('cost');
    else if(expenseField === expense.desc) setFieldName('desc');

  };

  //take input data, insert in to specified property in "body" aka table
  const saveEdit = async () => {
    //different case for if we're editing the numeric values
    // if(editText === expense.amount || editText === expense.cost){
    //   const expenseToEdit = expenses.find(expense => expense.id === editingId);
    //   if (expenseToEdit !== undefined) {
    //     try {
    //       const response = await fetch(`${API_BASE_URL}/${editingId}`, {
    //         method: 'PUT',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //           ...expenseToEdit,
    //           [fieldName]: editText,
    //         })
    //       })
    //     } catch (error) {
    //       alert("Error saving a numeric edit to a field in an expense.");
    //       alert(error);
    //     }
    //   }
    // }

    //otherwise, edit string vals
    if (editText.trim()) {
      const expenseToEdit = expenses.find(expense => expense.id === editingId);
      if (expenseToEdit !== undefined) {

        try {
          const response = await fetch(`${API_BASE_URL}/${editingId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...expenseToEdit,
              [fieldName]: editText.trim(),
            }),
          });
          if (response.ok) {
            fetchExpenses();
            cancelEdit();
          }
        } catch (error) {
          alert("Error saving a string edit to a field in an expense.");
          alert(error);
        }
      }
    }
  };

  //cancel editorining
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // helper func to calc cost of expenses
  const calculateCostOfExpenses = () => {
    //console.log('here');
    //console.log(expenses.length);
    let cost = 0.0;
    for(let i = 0; i < expenses.length; i++){
        cost += parseFloat(expenses[i].cost * expenses[i].amount);
        console.log(cost);
    }
    //console.log(cost);
    return cost;
  };

  //helper func to fill a map of category : cost pairs for use elsewhere
  const calculateCostOverCategories = () => {
    let category_costs = new Map();

    for(let i = 0; i < expenses.length; i++){
      let category = expenses[i].category;
      let cost = expenses[i].cost * expenses[i].amount;

      if(category_costs.get(category)){
        category_costs.set(category, category_costs.get(category) + cost);
      }
      else{
        category_costs.set(category, cost);
      }
    }
    //console.log(category_costs);
    return category_costs;
  }

  //helper func that converts teh category cost map in to an array and that uses it to dynamically generate and return a list
  const categoryCostList = (category_costs) => {
    return (
      <ul>
        {(Array.from(category_costs.entries()).map((entry, index) => (
          <li key={entry}>"{entry[0]}" costed ${entry[1]} across all expenses!</li>
        )))}
      </ul>
    )
  }

  //html / js mix (remember react returns html)
  return (
    <div className="app-container">
      <div className="app-wrapper">
        <div className="header">
          <h1 className="header-title">My expenses</h1>
          <p className="header-subtitle">Stay organized and on budget!</p>
        </div>

        <div className="input-section">
          <input
            type="text"
            ref={inputRef} // attaching the ref here
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExpense()}
            placeholder="Name of expense?"
            className="expense-input"
            disabled={editingId !== null}
          />

          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExpense()}
            placeholder="Category?"
            className="expense-input"
            disabled={editingId !== null}
          />

          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExpense()}
            placeholder="Amount purchased?"
            className="expense-input"
            disabled={editingId !== null}
          />

          <input
            type="text"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExpense()}
            placeholder="Unit cost of item?"
            className="expense-input"
            disabled={editingId !== null}
          />

          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExpense()}
            placeholder="Description (optional)?"
            className="expense-input"
            disabled={editingId !== null}
          />

          <button onClick={addExpense} className="add-button" disabled={editingId !== null}>
            <Plus size={20} />
            Add
          </button>
        </div>

        <br/>

        <div className="container">
          <p className="item">Title</p>
          <p className="item">Category</p>
          <p className="item">Amount</p>
          <p className="item">Unit Cost</p>
          <p className="item">Description</p>
          <p className="item">Date Created</p>
        </div>

        <br/>

        <div className="expense-list">

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No tasks yet. Add one above!</p>
            </div>
          ) : (
            <ul className="expense-items">
              {expenses.map((expense) => (
                <li key={expense.id} className="expense-item">
                  {/* the current expense is being edited - display edit box*/}
                  {editingId === expense.id ? (
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


                    /* The expense is not being edited - display info on expense*/
                    <>

                      {/* Text for title, and edit button */}
                      <span className={`expense-text ${expense.title} ${editingId !== null ? 'disabled' : ''}`}>
                        {expense.title}
                      </span>
                      <button
                        onClick={() => startEdit(expense, expense.title)}
                        className="edit-button"
                        disabled={editingId !== null}
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* Text for category, and edit button */}
                      <span className={`expense-text ${expense.category} ${editingId !== null ? 'disabled' : ''}`}>
                        {expense.category}
                      </span>
                      <button
                        onClick={() => startEdit(expense, expense.category)}
                        className="edit-button"
                        disabled={editingId !== null}
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* Text for amount, and edit button */}
                      <span className={`expense-text ${expense.amount} ${editingId !== null ? 'disabled' : ''}`}>
                        {expense.amount}
                      </span>
                      <button
                        onClick={() => startEdit(expense, expense.amount)}
                        className="edit-button"
                        disabled={editingId !== null}
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* Text for cost, and edit button */}
                      <span className={`expense-text ${expense.cost} ${editingId !== null ? 'disabled' : ''}`}>
                        {expense.cost}
                      </span>
                      <button
                        onClick={() => startEdit(expense, expense.cost)}
                        className="edit-button"
                        disabled={editingId !== null}
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* Text for description, and edit button */}
                      <span className={`expense-text ${expense.desc} ${editingId !== null ? 'disabled' : ''}`}>
                        {expense.desc}
                      </span>
                      <button
                        onClick={() => startEdit(expense, expense.desc)}
                        className="edit-button"
                        disabled={editingId !== null}
                      >
                        <Edit2 size={18} />
                      </button>

                      { /* Text for date - note no editing for this */ }
                      <span className={`expense-text ${expense.date} ${editingId !== null ? 'disabled' : ''}`}>
                        {expense.date}  
                      </span>
                      {/* no edit button for the date */}
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="expense-button"
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
        {expenses.length > 0 && (
          <div className="stats">
            <p>Some stats about your expenses:</p>
            <ul>
              <li><span>${totalCost} spent over all of your expenses.</span></li>
              <li><span>{expenses.length} expenses tracked.</span></li>
            </ul>
            <br/>
            <p>Your costs by category are listed below:</p>
            <span>{categoryCostList(costOverCategories)}</span>
          </div>
        )}
      </div>
    </div>
  );
}