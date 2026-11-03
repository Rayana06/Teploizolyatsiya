from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "ЛР5 — расчет аппаратных требований.pdf"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")

pdfmetrics.registerFont(TTFont("Arial", str(FONT_DIR / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_DIR / "Arial Bold.ttf")))

PAGE_W, PAGE_H = A4
MARGIN = 34
INK = HexColor("#183B32")
MUTED = HexColor("#65756F")
ORANGE = HexColor("#E97B42")
PAPER = HexColor("#FAF8F2")
PALE = HexColor("#EEF1EA")
LINE = HexColor("#DDE3DD")


def text(c, value, x, y, size=8.3, font="Arial", color=INK):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, y, value)


def wrapped(c, value, x, y, width, size=8.1, leading=11, font="Arial", color=INK):
    words = value.split()
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    for line in lines:
        text(c, line, x, y, size, font, color)
        y -= leading
    return y


def rounded_box(c, x, y, w, h, fill=PAPER, stroke=LINE, radius=10):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.7)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def section_label(c, value, x, y):
    text(c, value.upper(), x, y, 7.2, "Arial-Bold", ORANGE)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("ЛР5 — расчет аппаратных требований")
    c.setAuthor("Теплощит")

    c.setFillColor(PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(INK)
    c.rect(0, PAGE_H - 112, PAGE_W, 112, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.circle(PAGE_W - 50, PAGE_H - 38, 6, fill=1, stroke=0)
    text(c, "ЛАБОРАТОРНАЯ РАБОТА №5", MARGIN, PAGE_H - 34, 7.5, "Arial-Bold", ORANGE)
    text(c, "Расчет аппаратных требований", MARGIN, PAGE_H - 63, 20, "Arial-Bold", HexColor("#FFFFFF"))
    text(c, "SPA «Теплощит» • горизонт расчета 5 лет", MARGIN, PAGE_H - 84, 8.7, "Arial", HexColor("#C9D6D1"))

    y = PAGE_H - 135
    section_label(c, "1. Нагрузка и RPS", MARGIN, y)
    y -= 18
    gap = 10
    card_w = (PAGE_W - 2 * MARGIN - 2 * gap) / 3
    stats = [
        ("100 000", "активных пользователей"),
        ("3", "просмотра услуг в день"),
        ("4", "HTTP-запроса на услугу"),
    ]
    for i, (number, label) in enumerate(stats):
        x = MARGIN + i * (card_w + gap)
        rounded_box(c, x, y - 54, card_w, 54, fill=PALE)
        text(c, number, x + 12, y - 22, 16, "Arial-Bold", INK)
        wrapped(c, label, x + 12, y - 37, card_w - 24, 7.2, 8.5, "Arial", MUTED)
    y -= 70

    rounded_box(c, MARGIN, y - 70, PAGE_W - 2 * MARGIN, 70)
    text(c, "Запросов в день", MARGIN + 14, y - 18, 7.5, "Arial-Bold", MUTED)
    text(c, "100 000 × 3 × 4 = 1 200 000 запросов", MARGIN + 14, y - 36, 10.2, "Arial-Bold", INK)
    text(c, "Средний RPS", MARGIN + 305, y - 18, 7.5, "Arial-Bold", MUTED)
    text(c, "1 200 000 / (8 × 60 × 60) = 41,67", MARGIN + 305, y - 36, 9.2, "Arial-Bold", INK)
    text(c, "Пиковый RPS: 41,67 × 3 = 125", MARGIN + 14, y - 55, 8.2, "Arial", ORANGE)
    y -= 88

    section_label(c, "2. CPU и оперативная память", MARGIN, y)
    y -= 16
    rounded_box(c, MARGIN, y - 54, PAGE_W - 2 * MARGIN, 54, fill=INK, stroke=INK)
    text(c, "CPU", MARGIN + 16, y - 18, 7.2, "Arial-Bold", HexColor("#C9D6D1"))
    text(c, "ceil(125 / 50 × 1,30) = 4 ядра", MARGIN + 16, y - 37, 12, "Arial-Bold", HexColor("#FFFFFF"))
    text(c, "ОПЕРАТИВНАЯ ПАМЯТЬ", MARGIN + 310, y - 18, 7.2, "Arial-Bold", HexColor("#C9D6D1"))
    text(c, "4 × 4 ГБ = 16 ГБ", MARGIN + 310, y - 37, 12, "Arial-Bold", HexColor("#FFFFFF"))
    y -= 73

    section_label(c, "3. Размер строки таблицы insulation_materials", MARGIN, y)
    y -= 15
    table_x = MARGIN
    table_w = PAGE_W - 2 * MARGIN
    row_h = 18
    col_w = [178, 50, 178, 50]
    rows = [
        ("insulation_material_id", "4", "insulation_type", "20"),
        ("name", "80", "thickness_mm", "2"),
        ("short_description", "200", "created_at", "8"),
        ("status", "4", "published_at", "8"),
        ("image_url", "180", "completed_at", "8"),
        ("video_url", "180", "creator_id", "4"),
        ("moderator_id", "4", "price_rub_m2", "8"),
        ("заголовок + NULL bitmap", "26", "—", "—"),
    ]
    total_h = row_h * (len(rows) + 1)
    rounded_box(c, table_x, y - total_h, table_w, total_h, fill=HexColor("#FFFFFF"), radius=7)
    c.setFillColor(PALE)
    c.roundRect(table_x, y - row_h, table_w, row_h, 7, fill=1, stroke=0)
    headers = ["Поле", "Байт", "Поле", "Байт"]
    x = table_x
    for idx, header in enumerate(headers):
        text(c, header, x + 8, y - 13, 7.2, "Arial-Bold", MUTED)
        x += col_w[idx]
    for row_idx, row in enumerate(rows):
        ry = y - row_h * (row_idx + 1)
        c.setStrokeColor(LINE)
        c.line(table_x, ry, table_x + table_w, ry)
        x = table_x
        for idx, value in enumerate(row):
            text(c, value, x + 8, ry - 12.5, 7.4, "Arial-Bold" if idx in (1, 3) else "Arial", INK)
            x += col_w[idx]
    y -= total_h + 14

    text(c, "Данные 710 Б + служебные 26 Б + индексы 96 Б = 832 Б; резерв 30 %: ceil(832 × 1,30) = 1 082 Б/услугу.", MARGIN, y, 7.8, "Arial", INK)
    y -= 23
    section_label(c, "4. Прирост БД и накопитель", MARGIN, y)
    y -= 17
    left_w = 325
    rounded_box(c, MARGIN, y - 77, left_w, 77)
    text(c, "Новые услуги", MARGIN + 13, y - 18, 7.3, "Arial-Bold", MUTED)
    text(c, "100 000 × 5 % = 5 000 в день", MARGIN + 13, y - 34, 9.1, "Arial-Bold", INK)
    text(c, "5 000 × 365 × 5 = 9 125 000 строк", MARGIN + 13, y - 51, 8.5, "Arial", INK)
    text(c, "9 125 000 × 1 082 Б = 9,20 ГиБ за 5 лет", MARGIN + 13, y - 67, 8.5, "Arial-Bold", ORANGE)

    right_x = MARGIN + left_w + gap
    right_w = PAGE_W - MARGIN - right_x
    rounded_box(c, right_x, y - 77, right_w, 77, fill=PALE)
    text(c, "SSD", right_x + 13, y - 18, 7.3, "Arial-Bold", MUTED)
    text(c, "(9,20 × 3 + 20) × 1,30", right_x + 13, y - 35, 8.3, "Arial", INK)
    text(c, "= 61,88 ГиБ", right_x + 13, y - 51, 9.2, "Arial-Bold", INK)
    text(c, "РЕКОМЕНДАЦИЯ: 80 ГБ", right_x + 13, y - 67, 7.8, "Arial-Bold", ORANGE)
    y -= 97

    c.setStrokeColor(LINE)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    y -= 17
    text(c, "ИТОГО", MARGIN, y, 7.5, "Arial-Bold", MUTED)
    text(c, "4 ЯДРА CPU", MARGIN + 88, y, 11, "Arial-Bold", INK)
    text(c, "16 ГБ ОП", MARGIN + 240, y, 11, "Arial-Bold", INK)
    text(c, "SSD 80 ГБ", MARGIN + 362, y, 11, "Arial-Bold", INK)
    y -= 17
    text(c, "Медиа хранятся вне PostgreSQL. SSD учитывает рабочую БД, две полные копии, 20 ГиБ для ОС/логов и 30 % свободного места.", MARGIN, y, 6.8, "Arial", MUTED)

    c.setFillColor(INK)
    c.rect(0, 0, PAGE_W, 24, fill=1, stroke=0)
    text(c, "ТЕПЛОЩИТ  •  ЛАБОРАТОРНАЯ РАБОТА №5", MARGIN, 8, 6.4, "Arial-Bold", HexColor("#C9D6D1"))
    text(c, "1 / 1", PAGE_W - MARGIN - 18, 8, 6.4, "Arial-Bold", HexColor("#C9D6D1"))

    c.showPage()
    c.save()


if __name__ == "__main__":
    build()
