from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BUD Simple")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "BUD Simple API"}


@app.get("/api/children")
def get_children():
    return {"children": [{"id": 1, "name": "ひなた"}, {"id": 2, "name": "ゆうた"}]}
