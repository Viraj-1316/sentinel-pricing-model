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
    elements.append(Paragraph("Enterprise Quotation", subtitle))

    # ==========================
    # CLIENT INFO
    # ==========================
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
        colWidths=[260, 260]
    )

    info_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    elements.append(info_table)

    # ==========================
    # DATA
    # ==========================
    storage_used_user = getattr(quotation, "storage_used_user", 0)  # GB/TB
    storage_days = getattr(quotation, "storage_days", 7)
    storage_cost = getattr(quotation, "storage_cost", 0)

    cpu_name = getattr(quotation, "cpu", "CPU")
    cpu_cost = getattr(quotation, "cpu_cost", 0)

    gpu_name = getattr(quotation, "gpu", "GPU")
    gpu_cost = getattr(quotation, "gpu_cost", 0)

    ai_cost = getattr(quotation, "ai_cost", 0)
    total_cost = getattr(quotation, "total_costing", 0)

    # ==========================
    # COST SUMMARY
    # ==========================
    elements.append(Paragraph("Cost Summary", section))

    summary_data = [
        ["Component", "Total Cost"],
        [f"Storage ({storage_days} Days)", f"₹ {storage_cost}"],
        ["CPU", f"₹ {cpu_cost}"],
        ["GPU", f"₹ {gpu_cost}"],
        ["AI Services", f"₹ {ai_cost}"],
    ]

    summary_table = Table(summary_data, colWidths=[350, 150])
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
        [["Component", "Qty", "Cost"], [cpu_name, "1", f"₹ {cpu_cost}"]],
        colWidths=[300, 80, 120]
    )

    cpu_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ]))

    elements.append(cpu_table)

    # ==========================
    # GPU BREAKDOWN
    # ==========================
    elements.append(Paragraph("GPU Breakdown", section))

    gpu_table = Table(
        [["Component", "Qty", "Cost"], [gpu_name, "1", f"₹ {gpu_cost}"]],
        colWidths=[300, 80, 120]
    )

    gpu_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ]))

    elements.append(gpu_table)

    # ==========================
    # AI FEATURE BREAKDOWN
    # ==========================
    elements.append(Paragraph("AI Feature Breakdown", section))

    ai_data = [["Sr No", "Feature", "Cost"]]
    features = quotation.ai_features.all()

    if features.exists():
        for i, ai in enumerate(features, start=1):
            cost = ai.price.costing if getattr(ai, "price", None) else 0
            ai_data.append([i, ai.AI_feature, f"₹ {cost}"])
    else:
        ai_data.append(["-", "No AI features selected", "-"])

    ai_table = Table(ai_data, colWidths=[60, 300, 120])
    ai_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#198754")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
    ]))

    elements.append(ai_table)

    # ==========================
    # GRAND TOTAL
    # ==========================
    elements.append(Spacer(1, 16))

    total_table = Table(
        [["GRAND TOTAL", f"₹ {total_cost}"]],
        colWidths=[360, 120]
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
