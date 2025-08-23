from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import os
import uuid
from pathlib import Path
from typing import List
import aiofiles

router = APIRouter(prefix="", tags=["storage"])

# Storage directory
STORAGE_DIR = Path("/tmp/diala_storage")
STORAGE_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to local storage"""
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = STORAGE_DIR / unique_filename
    
    try:
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return JSONResponse({
            "success": True,
            "filename": file.filename,
            "stored_filename": unique_filename,
            "file_path": str(file_path),
            "size": len(content)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.post("/upload-multiple")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """Upload multiple files to local storage"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    uploaded_files = []
    
    for file in files:
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = STORAGE_DIR / unique_filename
        
        try:
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            uploaded_files.append({
                "original_filename": file.filename,
                "stored_filename": unique_filename,
                "file_path": str(file_path),
                "size": len(content)
            })
        
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to upload {file.filename}: {str(e)}"
            )
    
    return JSONResponse({
        "success": True,
        "uploaded_files": uploaded_files,
        "total_files": len(uploaded_files)
    })

@router.get("/files")
async def list_files():
    """List all uploaded files"""
    try:
        files = []
        for file_path in STORAGE_DIR.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                files.append({
                    "filename": file_path.name,
                    "path": str(file_path),
                    "size": stat.st_size,
                    "created": stat.st_ctime
                })
        
        return JSONResponse({"files": files})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download a file from storage"""
    file_path = STORAGE_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=filename)

@router.delete("/delete/{filename}")
async def delete_file(filename: str):
    """Delete a file from storage"""
    file_path = STORAGE_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return JSONResponse({"success": True, "message": f"File {filename} deleted"})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@router.delete("/cleanup")
async def cleanup_storage():
    """Delete all files from storage"""
    try:
        deleted_count = 0
        for file_path in STORAGE_DIR.iterdir():
            if file_path.is_file():
                file_path.unlink()
                deleted_count += 1
        
        return JSONResponse({
            "success": True, 
            "message": f"Deleted {deleted_count} files",
            "deleted_count": deleted_count
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup: {str(e)}")