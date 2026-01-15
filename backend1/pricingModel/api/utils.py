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

    title_style = ParagraphStyle(
        "title_style",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#0d6efd"),
        spaceAfter=10
    )

    section_style = ParagraphStyle(
        "section_style",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.black,
        spaceBefore=14,
        spaceAfter=8
    )

    normal = styles["Normal"]
    elements = []

    # ✅ HEADER
    elements.append(Paragraph("Sentinel Pricing Quotation", title_style))
    elements.append(Paragraph("<i>Enterprise Quotation Document</i>", normal))
    elements.append(Spacer(1, 12))

    # ✅ META TABLE
    meta_data = [
        ["Quotation ID:", str(quotation.id), "Date:", quotation.created_at.strftime("%d-%m-%Y %H:%M")],
        ["Prepared By:", username, "Status:", "Generated"]
    ]
    meta_table = Table(meta_data, colWidths=[90, 180, 60, 140])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(meta_table)
    elements.append(Spacer(1, 16))

    # ✅ SUMMARY TABLE
    elements.append(Paragraph("Quotation Summary", section_style))
    summary_data = [
        ["Item", "Value"],
        ["Cameras", str(quotation.cammera)],
        ["Camera Cost", f"₹ {quotation.camera_cost}"],
        ["AI Cost", f"₹ {quotation.ai_cost}"],
        ["Grand Total", f"₹ {quotation.total_costing}"],
    ]
    summary_table = Table(summary_data, colWidths=[240, 210])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d6efd")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
    ]))

    elements.append(summary_table)
    elements.append(Spacer(1, 16))

    # ✅ AI Features Table
    elements.append(Paragraph("AI Feature Breakdown", section_style))
    ai_data = [["Sr No", "Feature", "Cost"]]

    features = quotation.ai_features.all()
    if features.count() == 0:
        ai_data.append(["-", "No AI features selected", "-"])
    else:
        for i, ai in enumerate(features, start=1):
            ai_data.append([str(i), ai.AI_feature, f"₹ {ai.costing}"])

    ai_table = Table(ai_data, colWidths=[60, 270, 110])
    ai_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#198754")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("ALIGN", (2, 1), (2, -1), "RIGHT"),
    ]))

    elements.append(ai_table)

    doc.build(elements)

    pdf = buffer.getvalue()
    buffer.close()
    return pdf
