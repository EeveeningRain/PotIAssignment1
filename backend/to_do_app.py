from fastapi import FastAPI, HTTPException, Depends, Response, status
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from sqlmodel import Session
from to_do_app_crud import (
    get_session,
    Expense,
    db_get_expenses,
    db_update_expense,
    db_create_expense,
    db_delete_expense
)

app = FastAPI(title="Simple To-Do API")


# Define the origins that are allowed to talk to your server
origins = [
    "http://localhost:3001",  # Default React port
    "http://127.0.0.1:3001",
    "http://localhost:5173",  # Default Vite/React port
    "http://127.0.0.1:5173",
]

# Used for pre-built middleware classes (like CORS or GZip)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- Endpoints ---


@app.get("/expenses", response_model=List[Expense])
async def get_all_expenses(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_session)
):
    """Fetch the entire to-do list."""
    return await db_get_expenses(db, skip=skip, limit=limit)


@app.post("/expenses", response_model=Expense)
async def create_expense(expense: Expense, db: Session = Depends(get_session)):
    """Add a new expense to the list :pray:"""
    db_expense = await db_create_expense(db, expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: str, updated_object: Expense, db: Session = Depends(get_session)
):
    """Update an existing expense by its ID."""
    db_expense = await db_update_expense(db, expense_id, updated_object)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense item not found")
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, db: Session = Depends(get_session)):
    """Remove a task from the list."""
    db_expense = await db_delete_expense(db, expense_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expence item not found")
    db.commit()
    # This code indicates the action was successful, the resource is gone, and no body content needs to be returned.
    return Response(status_code=status.HTTP_204_NO_CONTENT)
