from fastapi import FastAPI, HTTPException, Depends, Response, status
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from sqlmodel import Session
from to_do_app_crud import (
    get_session,
    Todo,
    db_get_todos,
    db_update_todo,
    db_create_todo,
    db_delete_todo,
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- Endpoints ---


@app.get("/todos", response_model=List[Todo])
async def get_all_todos(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_session)
):
    """Fetch the entire to-do list."""
    return await db_get_todos(db, skip=skip, limit=limit)


@app.post("/todos", response_model=Todo)
async def create_todo(todo: Todo, db: Session = Depends(get_session)):
    """Add a new task to the list."""
    db_todo = await db_create_todo(db, todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(
    todo_id: str, updated_object: Todo, db: Session = Depends(get_session)
):
    """Update an existing task by its ID."""
    db_todo = await db_update_todo(db, todo_id, updated_object)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo item not found")
    db.commit()
    db.refresh(db_todo)
    return db_todo


@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, db: Session = Depends(get_session)):
    """Remove a task from the list."""
    db_todo = await db_delete_todo(db, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo item not found")
    db.commit()
    # This code indicates the action was successful, the resource is gone, and no body content needs to be returned.
    return Response(status_code=status.HTTP_204_NO_CONTENT)
