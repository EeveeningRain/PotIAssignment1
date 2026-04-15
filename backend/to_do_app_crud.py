from sqlmodel import Field, SQLModel, Session, create_engine, select
from typing import List, Optional

# Establish a db connection
username = "root"
password = "root"
database_name = "ass1db"
DATABASE_URL = f"mysql+pymysql://{username}:{password}@localhost:3306/{database_name}"
engine = create_engine(DATABASE_URL, echo=True)


# Create a database table "todo"
class Todo(SQLModel, table=True):
    # Change the id field to str type becuase MySQL's int type cannot hold large numbers
    id: str = Field(max_length=25, primary_key=True)
    text: str = Field(max_length=256)
    completed: bool = False


# If the database and table already exist, it will do nothing to those existing tables
SQLModel.metadata.create_all(engine)


# Helper function: Get a db session based on the existing connection
def get_session():
    """Yields a SQLModel Session instance."""
    with Session(engine) as session:
        yield session


# CRUD operations for Todos


# # the create_todo endpoint calls this function to insert records
async def db_create_todo(session: Session, todo_create: Todo) -> Todo:
    new_todo = Todo.model_validate(todo_create)
    session.add(new_todo)
    return new_todo


# # the get_todo endpoint calls this function to fetch a record by its id field
async def db_get_todo(session: Session, todo_id: int) -> Optional[Todo]:
    return session.get(Todo, todo_id)


# # the get_all_todos endpoint calls this function to fetch multiple records (limited to 100 recrods per fetch)
async def db_get_todos(session: Session, skip: int = 0, limit: int = 100) -> List[Todo]:
    statement = select(Todo).offset(skip).limit(limit)
    return session.exec(statement).all()


# # the update_todo endpoint calls this function to update a record
async def db_update_todo(
    session: Session, todo_id: int, todo_update: Todo
) -> Optional[Todo]:
    todo = await db_get_todo(session, todo_id)
    if not todo:
        return None
    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)
    session.add(todo)
    return todo


# # the delete_todo endpoint calls this function to delete a record by its id field
async def db_delete_todo(session: Session, todo_id: int) -> bool:
    todo = await db_get_todo(session, todo_id)
    if not todo:
        return False
    session.delete(todo)
    return True
