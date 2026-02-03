from io import BytesIO
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors


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

    # 🔒 CANONICAL WIDTH SYSTEM (matches CPU/GPU tables)
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
        spaceAfter=4
    )

    subtitle = ParagraphStyle(
        "subtitle",
        fontSize=11,
        textColor=colors.grey,
        spaceAfter=14
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
    elements.append(Paragraph("", subtitle))

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

    cpu_name = getattr(quotation.cpu, "core_hardware", "CPU") if quotation.cpu else "—"
    cpu_cores = getattr(quotation, "cpu_cores", "-")
    ram_required = getattr(quotation, "ram_required", "-")
    cpu_cost = getattr(quotation, "cpu_cost", 0)

    gpu_name = getattr(quotation.gpu, "AI_Component", "GPU") if quotation.gpu else "—"
    gpu_vram = getattr(quotation.gpu, "VRAM", "-")
    gpu_cost = getattr(quotation, "gpu_cost", 0)

    ai_cost = getattr(quotation, "ai_cost", 0)
    total_cost = getattr(quotation, "total_costing", 0)

    # ==========================
    # COST SUMMARY (FIXED WIDTH)
    # ==========================
    elements.append(Paragraph("Cost Summary", section))

    summary_table = Table(
        [
            ["Component", "Total Cost"],
            [f"Storage ({storage_days} Days)", f"₹ {storage_cost}"],
            ["CPU", f"₹ {cpu_cost}"],
            ["GPU", f"₹ {gpu_cost}"],
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
    # CPU BREAKDOWN (UNCHANGED)
    # ==========================
    elements.append(Paragraph("CPU Breakdown", section))

    cpu_table = Table(
        [
            ["CPU Model", "Cores", "RAM Required (GB)", "Cost"],
            [cpu_name, cpu_cores, ram_required, f"₹ {cpu_cost}"],
        ],
        colWidths=[200, 80, 140, 100]
    )

    cpu_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-2, -1), "CENTER"),
        ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(cpu_table)

    # ==========================
    # GPU BREAKDOWN (UNCHANGED)
    # ==========================
    elements.append(Paragraph("GPU Breakdown", section))

    gpu_table = Table(
        [
            ["GPU Model", "VRAM (GB)", "Cost"],
            [gpu_name, gpu_vram, f"₹ {gpu_cost}"],
        ],
        colWidths=[280, 120, 120]
    )

    gpu_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (1, -1), "CENTER"),
        ("ALIGN", (2, 1), (2, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(gpu_table)

    # ==========================
    # AI FEATURE BREAKDOWN (FIXED WIDTH)
    # ==========================
    elements.append(Paragraph("AI Feature Breakdown", section))

    ai_data = [["Sr No", "Feature", "Cost"]]
    features = quotation.ai_features.all()

    if features.exists():
        for i, ai in enumerate(features, start=1):
            cost = ai.price.costing if hasattr(ai, "price") else 0
            ai_data.append([i, ai.AI_feature, f"₹ {cost}"])
    else:
        ai_data.append(["-", "No AI features selected", "-"])

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
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(ai_table)

    # ==========================
    # GRAND TOTAL (FIXED WIDTH)
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

    # ==========================
    # FOOTER
    # ==========================
    elements.append(Paragraph(
        "This quotation is system generated and valid for 15 days.<br/>"
        "Taxes applicable as per government norms.",
        footer
    ))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
