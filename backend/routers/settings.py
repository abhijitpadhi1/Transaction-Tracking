from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def settings_root():
    return {"message": "settings works"}
