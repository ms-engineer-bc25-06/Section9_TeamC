from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Section9 TeamC Backend API"}
