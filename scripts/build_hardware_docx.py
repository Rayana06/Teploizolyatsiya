from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "docx" / "ЛР5 — расчет аппаратных требований.docx"
FONT = "Times New Roman"
BLACK = "000000"
LIGHT_GRAY = "E7E6E6"
LINE = "808080"


def set_run(run, size=14, bold=False):
    run.font.name = FONT
    fonts = run._element.get_or_add_rPr().get_or_add_rFonts()
    fonts.set(qn("w:ascii"), FONT)
    fonts.set(qn("w:hAnsi"), FONT)
    fonts.set(qn("w:eastAsia"), FONT)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(BLACK)


def set_paragraph(paragraph, *, justify=True, indent=True, line_spacing=1.5, before=0, after=0):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY if justify else WD_ALIGN_PARAGRAPH.LEFT
    fmt = paragraph.paragraph_format
    fmt.first_line_indent = Mm(12.5) if indent else Mm(0)
    fmt.line_spacing = line_spacing
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)


def add_body(doc, parts):
    paragraph = doc.add_paragraph()
    set_paragraph(paragraph)
    for value, bold in parts:
        set_run(paragraph.add_run(value), 14, bold)
    return paragraph


def add_heading(doc, value):
    paragraph = doc.add_paragraph()
    set_paragraph(paragraph, justify=False, indent=False, line_spacing=1.0, before=3, after=1)
    set_run(paragraph.add_run(value), 14, True)
    paragraph.paragraph_format.keep_with_next = True
    return paragraph


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def border_cell(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        node = OxmlElement(f"w:{edge}")
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), "4")
        node.set(qn("w:color"), LINE)
        borders.append(node)


def margin_cell(cell, value=55):
    tc_pr = cell._tc.get_or_add_tcPr()
    margins = OxmlElement("w:tcMar")
    for side in ("top", "start", "bottom", "end"):
        node = OxmlElement(f"w:{side}")
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")
        margins.append(node)
    tc_pr.append(margins)


def format_table(table, widths, font_size=10):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for row_index, row in enumerate(table.rows):
        row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
        for col_index, cell in enumerate(row.cells):
            cell.width = Mm(widths[col_index])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            border_cell(cell)
            margin_cell(cell)
            if row_index == 0:
                shade_cell(cell, LIGHT_GRAY)
            for paragraph in cell.paragraphs:
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_index in (1, 3) else WD_ALIGN_PARAGRAPH.LEFT
                set_paragraph(paragraph, justify=False, indent=False, line_spacing=1.0)
                for run in paragraph.runs:
                    set_run(run, font_size, row_index == 0)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Document()
    section = doc.sections[0]
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width = Mm(297)
    section.page_height = Mm(210)
    section.left_margin = Mm(30)
    section.right_margin = Mm(10)
    section.top_margin = Mm(20)
    section.bottom_margin = Mm(20)
    section.footer_distance = Mm(8)

    normal = doc.styles["Normal"]
    normal.font.name = FONT
    normal._element.rPr.rFonts.set(qn("w:ascii"), FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    normal.font.size = Pt(14)
    normal.font.color.rgb = RGBColor.from_string(BLACK)

    title = doc.add_paragraph()
    set_paragraph(title, justify=False, indent=False, line_spacing=1.0, after=2)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run(title.add_run("РАСЧЕТ АППАРАТНЫХ ТРЕБОВАНИЙ"), 14, True)

    add_heading(doc, "Расчет нагрузки и ресурсов")
    add_body(doc, [
        ("Для расчета приняты 100 000 активных пользователей, 3 просмотра услуг в день и 4 HTTP запроса на одну услугу. ", False),
        ("Количество запросов: ", True),
        ("100 000 × 3 × 4 = 1 200 000 запросов в день. ", False),
        ("Средний RPS: ", True),
        ("1 200 000 / (8 × 60 × 60) = 41,67 RPS. С коэффициентом часа пик 3 получаем 41,67 × 3 = 125 RPS. ", False),
        ("Процессор: ", True),
        ("⌈125 / 50 × 1,30⌉ = 4 ядра. ", False),
        ("Оперативная память: ", True),
        ("4 ядра × 4 ГБ = 16 ГБ.", False),
    ])

    add_heading(doc, "Размер строки таблицы услуг")
    rows = [
        ("Поле", "Байт", "Поле", "Байт"),
        ("insulation_material_id", "4", "insulation_type", "20"),
        ("name", "80", "thickness_mm", "2"),
        ("short_description", "200", "created_at", "8"),
        ("status", "4", "published_at", "8"),
        ("image_url", "180", "completed_at", "8"),
        ("video_url", "180", "creator_id", "4"),
        ("moderator_id", "4", "price_rub_m2", "8"),
        ("Заголовок строки и NULL bitmap", "26", "—", "—"),
    ]
    table = doc.add_table(rows=len(rows), cols=4)
    for row_index, data in enumerate(rows):
        for col_index, value in enumerate(data):
            table.cell(row_index, col_index).text = value
    format_table(table, [93, 22, 120, 22], 10)

    add_body(doc, [
        ("Размер одной услуги: ", True),
        ("710 Б данных + 26 Б служебных данных + 96 Б индексов = 832 Б; с резервом 30 %: ⌈832 × 1,30⌉ = 1 082 Б.", False),
    ])

    add_heading(doc, "Прирост базы данных за 5 лет")
    add_body(doc, [
        ("Количество новых услуг: ", True),
        ("100 000 × 5 % = 5 000 услуг в день; 5 000 × 365 × 5 = 9 125 000 строк. ", False),
        ("Прирост БД: ", True),
        ("9 125 000 × 1 082 = 9 873 250 000 Б = 9,20 ГиБ. ", False),
        ("Требуемый накопитель: ", True),
        ("(9,20 × 3 копии + 20 ГиБ для ОС и логов) × 1,30 = 61,88 ГиБ; принимается SSD 80 ГБ. ", False),
        ("Итог: ", True),
        ("4 ядра CPU, 16 ГБ оперативной памяти и SSD 80 ГБ.", False),
    ])

    footer = section.footer.paragraphs[0]
    set_paragraph(footer, justify=False, indent=False, line_spacing=1.0)
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run(footer.add_run("Лабораторная работа №5"), 10)

    properties = doc.core_properties
    properties.title = "Расчет аппаратных требований"
    properties.subject = "Лабораторная работа №5"
    properties.author = "Теплощит"
    doc.save(OUTPUT)


if __name__ == "__main__":
    build()
