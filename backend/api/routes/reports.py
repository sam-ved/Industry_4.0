from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import Dict, Any
import io
from backend.services.report_generator import ReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/download/{format}")
async def download_report(format: str, payload: Dict[str, Any] = Body(...)):
    """
    Generate a downloadable industrial analytics report.
    Available formats: pdf, docx, json, csv, excel, html, markdown
    """
    try:
        format = format.lower()
        if format == "pdf":
            bio = ReportGenerator.generate_pdf(payload)
            return StreamingResponse(
                bio,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=industry4_report.pdf"}
            )
        elif format == "docx":
            bio = ReportGenerator.generate_docx(payload)
            return StreamingResponse(
                bio,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": "attachment; filename=industry4_report.docx"}
            )
        elif format == "json":
            bio = ReportGenerator.generate_json(payload)
            return StreamingResponse(
                bio,
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=industry4_report.json"}
            )
        elif format == "csv":
            bio = ReportGenerator.generate_csv(payload)
            return StreamingResponse(
                bio,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=industry4_report.csv"}
            )
        elif format == "excel":
            bio = ReportGenerator.generate_excel(payload)
            return StreamingResponse(
                bio,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": "attachment; filename=industry4_report.xlsx"}
            )
        elif format == "html":
            bio = ReportGenerator.generate_html(payload)
            return StreamingResponse(
                bio,
                media_type="text/html",
                headers={"Content-Disposition": "attachment; filename=industry4_report.html"}
            )
        elif format == "markdown":
            md_text = ReportGenerator.generate_markdown(payload)
            bio = io.BytesIO(md_text.encode('utf-8'))
            return StreamingResponse(
                bio,
                media_type="text/markdown",
                headers={"Content-Disposition": "attachment; filename=industry4_report.md"}
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid format specified")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
