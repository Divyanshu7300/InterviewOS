from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
# This is the base class for all our SQLAlchemy models. It doesn't do anything on its own, but it allows us to define our models in a consistent way and to create the database tables from those models.
