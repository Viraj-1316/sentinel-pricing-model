from io import BytesIO
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from pricingModel.models import Component


def generate_enterprise_quotation_pdf(quotation, username: str) -> bytes:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    PAGE_WIDTH = A4[0] - doc.leftMargin - doc.rightMargin

    LEFT_COL = PAGE_WIDTH * 0.65
    RIGHT_COL = PAGE_WIDTH * 0.35

    styles = getSampleStyleSheet()
    elements = []

    # ==========================
    # STYLES
    # ==========================
    title = ParagraphStyle(
        "title",
        fontSize=20,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0d6efd"),
        spaceAfter=0
    )

    section = ParagraphStyle(
        "section",
        fontSize=12,
        fontName="Helvetica-Bold",
        spaceBefore=18,
        spaceAfter=8
    )

    normal = ParagraphStyle(
        "normal",
        fontSize=10,
        leading=14
    )

    footer = ParagraphStyle(
        "footer",
        fontSize=9,
        textColor=colors.grey,
        spaceBefore=20
    )

    # ==========================
    # HEADER
    # ==========================
    elements.append(Paragraph("SENTINEL", title))
    elements.append(Spacer(1, 12))


    info_table = Table(
                [[
                    Paragraph("<b>Client</b><br/>Enterprise Customer", normal),
                    Paragraph(
                        f"<b>Quotation ID:</b> {quotation.id}<br/>"
                        f"<b>Date:</b> {quotation.created_at.strftime('%d-%m-%Y')}<br/>"
                        f"<b>Prepared By:</b> {username}",
                        normal
                    )
                ]],
                colWidths=[LEFT_COL, RIGHT_COL]
            )
    info_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    elements.append(info_table)

    # ==========================
    # SAFE DATA FETCH
    # ==========================
    storage_days = getattr(quotation, "storage_days", 7)
    storage_cost = getattr(quotation, "storage_cost", 0)

    cpu_name = getattr(quotation.cpu, "core_hardware", "—") if getattr(quotation, "cpu", None) else "—"
    CPUcores = getattr(quotation.cpu, "CPUcores", "-") if getattr(quotation, "cpu", None) else "-"
    ram_required = getattr(quotation, "ram_required", "-")
    cpu_cost = getattr(quotation, "cpu_cost", 0)

    gpu_name = getattr(quotation.gpu, "AI_Component", "—") if getattr(quotation, "gpu", None) else "—"
    gpu_vram = getattr(quotation.gpu, "VRAM", "-") if getattr(quotation, "gpu", None) else "-"
    gpu_cost = getattr(quotation, "gpu_cost", 0)

    ai_cost = getattr(quotation, "ai_cost", 0)
    total_cost = getattr(quotation, "total_costing", 0)

    # ==========================
    # LICENCE FETCH (MODEL-CORRECT)
    # ==========================
    duration_value = "-"
    licence_cost = getattr(quotation, "licenceCostU", 0)

    if getattr(quotation, "DurationU", None):
        licence_obj = Component.objects.filter(id=quotation.DurationU).first()

        if licence_obj:
            duration_value = getattr(licence_obj, "Duration", "-")

            if hasattr(licence_obj, "price"):
                licence_cost = licence_obj.price.costing

    if duration_value != "-":
        try:
            years = int(duration_value)
            duration_value = f"{years} Year" if years == 1 else f"{years} Years"
        except Exception:
            pass

    # ==========================
    # COST SUMMARY
    # ==========================
    elements.append(Paragraph("Cost Summary", section))

    summary_table = Table(
        [
            ["Component", "Total Cost"],
            [f"Storage ({storage_days} Days)", f"₹ {storage_cost}"],
            ["CPU", f"₹ {cpu_cost}"],
            ["GPU", f"₹ {gpu_cost}"],
            ["Licences", f"₹ {licence_cost}"],
            ["AI Services", f"₹ {ai_cost}"],
        ],
        colWidths=[LEFT_COL, RIGHT_COL]
    )

    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d6efd")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(summary_table)

    # ==========================
    # CPU BREAKDOWN
    # ==========================
    elements.append(Paragraph("CPU Breakdown", section))

    cpu_table = Table(
        [
            ["CPU Model", "Cores", "RAM (GB)", "Cost"],
            [cpu_name, CPUcores, ram_required, f"₹ {cpu_cost}"],
        ],
        colWidths=[LEFT_COL * 0.5, LEFT_COL * 0.2, LEFT_COL * 0.3, RIGHT_COL]
    )

    cpu_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(cpu_table)

    # ==========================
    # GPU BREAKDOWN
    # ==========================
    elements.append(Paragraph("GPU Breakdown", section))

    gpu_table = Table(
        [
            ["GPU Model", "VRAM (GB)", "Cost"],
            [gpu_name, gpu_vram, f"₹ {gpu_cost}"],
        ],
        colWidths=[LEFT_COL * 0.7, LEFT_COL * 0.3, RIGHT_COL]
    )

    gpu_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(gpu_table)

    # ==========================
    # LICENCE BREAKDOWN
    # ==========================
    elements.append(Paragraph("Licence Breakdown", section))

    duration_value = "-"
    licence_cost = 0

    try:
       duration_value = getattr(quotation, "DurationU", "-")
       licence_cost = getattr(quotation, "licenceCostU", 0)


    except Exception:
        duration_value = "-"
        licence_cost = 0


    # ✅ Human-friendly duration formatting
    if duration_value != "-":
        try:
            duration_int = int(duration_value)
            duration_value = (
                f"{duration_int} Year"
                if duration_int == 1
                else f"{duration_int} Years"
            )
        except Exception:
            pass


    licence_table = Table(
        [
            ["Duration", "Cost"],
            [duration_value, f"₹ {licence_cost}"],
        ],
        colWidths=[LEFT_COL, RIGHT_COL]
    )

    licence_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(licence_table)
# ==========================
# AI FEATURE BREAKDOWN
# ==========================
    elements.append(Paragraph("AI Feature Breakdown", section))

    ai_data = [["Sr No", "Feature", "Cost"]]

    features = quotation.ai_features.all()

    if features.exists():
        for i, ai in enumerate(features, start=1):

            try:
                cost = ai.price.costing
            except Exception:
                cost = 0

            ai_data.append([
                i,
                getattr(ai, "AI_feature", "—"),
                f"₹ {cost}"
            ])
    else:
        ai_data.append(["-", "No AI Features Selected", "-"])


    ai_table = Table(
        ai_data,
        colWidths=[
            PAGE_WIDTH * 0.10,
            LEFT_COL - (PAGE_WIDTH * 0.10),
            RIGHT_COL,
        ]
    )

    ai_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#198754")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(ai_table)

    # ==========================
    # GRAND TOTAL
    # ==========================
    elements.append(Spacer(1, 16))

    total_table = Table(
        [["GRAND TOTAL", f"₹ {total_cost}"]],
        colWidths=[LEFT_COL, RIGHT_COL]
    )

    total_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#198754")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 10),
    ]))

    elements.append(total_table)

    elements.append(Paragraph(
        "This quotation is system generated and valid for 15 days.<br/>"
        "Taxes applicable as per government norms.",
        footer
    ))

    doc.build(elements)

    pdf = buffer.getvalue()
    buffer.close()

    return pdf
