from sqlmodel import Field, SQLModel, Session, create_engine, select
from typing import List, Optional

# Establish a db connection
username = "root"
password = "root"
database_name = "ass1db"
DATABASE_URL = f"mysql+pymysql://{username}:{password}@localhost:3306/{database_name}"
engine = create_engine(DATABASE_URL, echo=True)


# Create a database table "expense"
class Expense(SQLModel, table=True):
    # Change the id field to str type becuase MySQL's int type cannot hold large numbers
    id: str = Field(max_length=25, primary_key=True)
    title: str = Field(max_length=256)
    category: str = Field(max_length=256)
    amount: int = Field()
    cost: float = Field()
    date: str = Field(max_length=25)
    desc: str = Field(max_length=256) 

# If the database and table already exist, it will do nothing to those existing tables
SQLModel.metadata.create_all(engine)



# Helper function: Get a db session based on the existing connection
def get_session():
    """Yields a SQLModel Session instance."""
    with Session(engine) as session:
        yield session


# CRUD operations for Expenses


# # the create_expense endpoint calls this function to insert records
async def db_create_expense(session: Session, expense_create: Expense) -> Expense:
    new_expense = Expense.model_validate(expense_create)
    session.add(new_expense)
    return new_expense


# # the get_expense_by_id endpoint calls this function to fetch a record by its id field
# needed to ensure this was separated from the other get func as there is not overloading here
async def db_get_expense_by_id(session: Session, expense_id: str) -> Optional[Expense]:
    return session.get(Expense, expense_id)


# # the get_expenses endpoint calls this function to fetch multiple records (limited to 100 recrods per fetch)
async def db_get_expenses(session: Session, skip: int = 0, limit: int = 100) -> List[Expense]:
    statement = select(Expense).offset(skip).limit(limit)
    return session.exec(statement).all()


# # the update_expense endpoint calls this function to update a record
async def db_update_expense(
    session: Session, expense_id: str, expense_update: Expense
) -> Optional[Expense]:
    expense = await db_get_expense_by_id(session, expense_id)
    if not expense:
        return None
    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)
    session.add(expense)
    return expense


# # the delete_expense endpoint calls this function to delete a record by its id field
async def db_delete_expense(session: Session, expense_id: str) -> bool:
    expense = await db_get_expense_by_id(session, expense_id)
    if not expense:
        return False
    session.delete(expense)
    session.commit()
    return True
