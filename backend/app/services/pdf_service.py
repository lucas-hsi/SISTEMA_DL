from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
from typing import Dict, List, Any

def generate_quote_pdf(order_data: Dict[str, Any], company_data: Dict[str, Any], client_data: Dict[str, Any]) -> BytesIO:
    """
    Gera um PDF de orçamento profissional com dados da empresa, cliente e itens.
    
    Args:
        order_data: Dados do pedido incluindo items e total
        company_data: Dados da empresa (nome, cnpj, endereço, telefone)
        client_data: Dados do cliente (nome, contato)
    
    Returns:
        BytesIO: Buffer contendo o PDF gerado
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=6,
        alignment=TA_LEFT
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.darkblue
    )
    
    # Elementos do documento
    elements = []
    
    # Título
    title = Paragraph("ORÇAMENTO", title_style)
    elements.append(title)
    
    # Data atual
    current_date = datetime.now().strftime("%d/%m/%Y")
    date_para = Paragraph(f"<b>Data:</b> {current_date}", header_style)
    elements.append(date_para)
    elements.append(Spacer(1, 12))
    
    # Dados da Empresa
    company_section = Paragraph("DADOS DA EMPRESA", section_style)
    elements.append(company_section)
    
    company_name = Paragraph(f"<b>Empresa:</b> {company_data.get('name', 'N/A')}", header_style)
    elements.append(company_name)
    
    if company_data.get('cnpj'):
        company_cnpj = Paragraph(f"<b>CNPJ:</b> {company_data['cnpj']}", header_style)
        elements.append(company_cnpj)
    
    if company_data.get('address'):
        company_address = Paragraph(f"<b>Endereço:</b> {company_data['address']}", header_style)
        elements.append(company_address)
    
    if company_data.get('phone'):
        company_phone = Paragraph(f"<b>Telefone:</b> {company_data['phone']}", header_style)
        elements.append(company_phone)
    
    elements.append(Spacer(1, 12))
    
    # Dados do Cliente
    client_section = Paragraph("DADOS DO CLIENTE", section_style)
    elements.append(client_section)
    
    client_name = Paragraph(f"<b>Cliente:</b> {client_data.get('name', 'N/A')}", header_style)
    elements.append(client_name)
    
    if client_data.get('contact'):
        client_contact = Paragraph(f"<b>Contato:</b> {client_data['contact']}", header_style)
        elements.append(client_contact)
    
    elements.append(Spacer(1, 20))
    
    # Tabela de Itens
    items_section = Paragraph("ITENS DO ORÇAMENTO", section_style)
    elements.append(items_section)
    
    # Cabeçalho da tabela
    table_data = [['Item', 'Descrição', 'Qtd', 'Valor Unit.', 'Subtotal']]
    
    # Dados dos itens
    total_geral = 0
    for i, item in enumerate(order_data.get('items', []), 1):
        produto = item.get('product', {})
        quantidade = item.get('quantity', 0)
        preco_unitario = item.get('unit_price', 0)
        subtotal = quantidade * preco_unitario
        total_geral += subtotal
        
        table_data.append([
            str(i),
            produto.get('name', 'Produto'),
            str(quantidade),
            f"R$ {preco_unitario:.2f}",
            f"R$ {subtotal:.2f}"
        ])
    
    # Criar tabela
    table = Table(table_data, colWidths=[0.8*inch, 3*inch, 0.8*inch, 1.2*inch, 1.2*inch])
    table.setStyle(TableStyle([
        # Cabeçalho
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        
        # Dados
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        
        # Bordas
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        
        # Alinhamento específico
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),  # Descrição à esquerda
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),  # Valores à direita
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    # Total
    total_style = ParagraphStyle(
        'Total',
        parent=styles['Normal'],
        fontSize=16,
        spaceAfter=6,
        alignment=TA_RIGHT,
        textColor=colors.darkblue
    )
    
    total_para = Paragraph(f"<b>TOTAL GERAL: R$ {total_geral:.2f}</b>", total_style)
    elements.append(total_para)
    
    # Rodapé
    elements.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    footer = Paragraph("Este orçamento tem validade de 30 dias.", footer_style)
    elements.append(footer)
    
    # Gerar PDF
    doc.build(elements)
    buffer.seek(0)
    
    return buffer