import uvicorn
from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


def run():
    uvicorn.run("sprenity.server.main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    run()
