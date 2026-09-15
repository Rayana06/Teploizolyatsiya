from base64 import b64encode
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design"
MEDIA = ROOT / "media" / "generated"
RED, WHITE, GRAY, BG, BLACK = "#e2000e", "#ffffff", "#666666", "#ededed", "#000000"


def data_image(name):
    path = MEDIA / name
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return f"data:{mime};base64,{b64encode(path.read_bytes()).decode()}"


def text(x, y, value, size=12, fill=BLACK, weight=400, anchor="start"):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(value))}</text>'


def brand():
    return f'<rect x="20" y="20" width="38" height="38" rx="4" fill="{RED}"/>{text(39,46,"Т",18,WHITE,700,"middle")}{text(70,47,"ТЕПЛОЩИТ",21,WHITE,800)}'


def tabs(active):
    parts = [f'<rect x="0" y="772" width="390" height="72" fill="{WHITE}"/>']
    items = [(65, "▶", "Лента", "feed"), (195, "✎", "Черновик", "draft"), (325, "▦", "Каталог", "catalog")]
    for x, icon, label, key in items:
        color = RED if key == active else GRAY
        if key == active:
            parts.append(f'<path d="M{x-65} 773.5h130" stroke="{RED}" stroke-width="3"/>')
        parts += [text(x,807,icon,23,color,400,"middle"), text(x,829,label,11,color,700,"middle")]
    return "".join(parts)


def wrap_words(value, width):
    words, lines, current = value.split(), [], ""
    for word in words:
        test = (current + " " + word).strip()
        if len(test) <= width:
            current = test
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


feed = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
    '<title>Лента теплоизоляционных материалов — макет 390 × 844</title>',
    '<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".38" stop-color="#000" stop-opacity=".05"/><stop offset=".7" stop-color="#000" stop-opacity=".8"/><stop offset="1" stop-color="#000"/></linearGradient></defs>',
    '<g font-family="Arial, sans-serif">',
    f'<image x="0" y="0" width="390" height="772" preserveAspectRatio="xMidYMid slice" href="{data_image("technolight-optima-50-poster.jpg")}"/>',
    '<rect x="0" y="0" width="390" height="772" fill="url(#shade)"/>', brand(),
    '<rect x="277" y="27" width="93" height="30" rx="4" fill="#000" fill-opacity=".72"/>', text(323.5,46,"Лента материалов",10,WHITE,400,"middle"),
    text(20,568,"Технолайт Оптима",25,WHITE,700), text(20,608,"281,60 ₽/м²",24,WHITE,700),
    text(20,644,"Каменная вата для утепления каркасных",12,WHITE), text(20,662,"стен и ненагружаемых перекрытий.",12,WHITE), text(20,697,"Больше",12,WHITE,700), '<path d="M20 702h45" stroke="#fff"/>',
    '<rect x="304" y="520" width="66" height="20" rx="4" fill="#e2000e"/>', text(337,534,"МИНВАТА",8,WHITE,700,"middle"),
    '<circle cx="337" cy="574" r="22" fill="#202020" fill-opacity=".8"/>', text(337,583,"♡",28,WHITE,400,"middle"), text(337,616,"24",13,WHITE,700,"middle"),
    f'<circle cx="337" cy="666" r="24" fill="{RED}"/>', text(337,675,"→",25,WHITE,700,"middle"), text(337,704,"Следующий",9,WHITE,700,"middle"),
    tabs("feed"), '</g></svg>'
]


draft = ['<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">','<title>Черновик теплоизоляционного материала — макет 390 × 844</title>',f'<g font-family="Arial, sans-serif"><rect width="390" height="844" fill="{BG}"/>']
draft += [f'<rect x="20" y="18" width="38" height="38" rx="4" fill="{RED}"/>',text(39,44,"Т",18,WHITE,700,"middle"),text(70,45,"ТЕПЛОЩИТ",21,BLACK,800),f'<rect x="306" y="22" width="64" height="30" rx="4" fill="{RED}"/>',text(338,41,"ЧЕРНОВИК",9,WHITE,700,"middle"),text(20,88,"Черновик материала",23,BLACK,700),f'<rect x="16" y="105" width="358" height="651" rx="4" fill="{WHITE}"/>',text(30,133,"Технолайт Оптима",16,BLACK,700),text(360,133,"♡ 0",10,RED,400,"end")]
for y, title_value, image_name in [(150,"ИЗОБРАЖЕНИЕ","technolight-optima-100-draft.jpg"),(282,"ВИДЕО","technolight-optima-100-draft-poster.jpg")]:
    draft += [f'<rect x="30" y="{y}" width="330" height="124" rx="4" fill="#fff" stroke="#dedede"/>',text(38,y+17,title_value,9,RED,700),f'<image x="38" y="{y+22}" width="314" height="62" preserveAspectRatio="xMidYMid meet" href="{data_image(image_name)}"/>',f'<rect x="38" y="{y+90}" width="314" height="26" rx="4" fill="{RED}"/>',text(195,y+108,"Выбрать файл",9,WHITE,700,"middle")]
fields = [(430,"НАЗВАНИЕ МАТЕРИАЛА","Технолайт Оптима",30,214),(430,"ТИП УТЕПЛИТЕЛЯ","Минвата",252,108),(477,"ПРОИЗВОДИТЕЛЬ","ТЕХНОНИКОЛЬ",30,330),(524,"ДЛИНА ПЛИТЫ, мм","1200",30,158),(524,"ТОЛЩИНА, мм","100",200,160),(571,"ШИРИНА ПЛИТЫ, мм","600",30,158),(571,"ЦЕНА, ₽/м²","563,19",200,160)]
for y,label,value,x,w in fields:
    draft += [text(x,y,label,8,GRAY,700),f'<rect x="{x}" y="{y+6}" width="{w}" height="30" rx="4" fill="#fff" stroke="#b8b8b8"/>',text(x+8,y+26,value,10,BLACK)]
draft += [text(30,624,"ОПИСАНИЕ МАТЕРИАЛА",8,GRAY,700),'<rect x="30" y="630" width="330" height="72" rx="4" fill="#fff" stroke="#b8b8b8"/>',text(38,650,"Каменная вата для каркасных стен и",9,BLACK),text(38,666,"ненагружаемых перекрытий.",9,BLACK),tabs("draft"),'</g></svg>']


materials = [
    ("МИНВАТА","Технолайт Оптима","281,60","24","technolight-optima-50.jpg"),("МИНВАТА","Технолайт Экстра","229,63","15","technolight-extra-50.jpg"),
    ("ПЕНОПЛАСТ","THERM ППС15","322,22","12","rafinad-therm-50.jpg"),("ПЕНОПЛАСТ","THERM FACADE","322,22","9","rafinad-facade-50.jpg"),
    ("PIR-ПЛИТА","LOGICPIR Баня","1 038,60","18","logicpir-banya-50.jpg"),("PIR-ПЛИТА","LOGICPIR СХМ/СХМ","1 570,15","21","logicpir-skhm-50.jpg")]
catalog = ['<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">','<title>Каталог теплоизоляционных материалов — макет 390 × 844</title>',f'<g font-family="Arial, sans-serif"><rect width="390" height="844" fill="{BG}"/>',f'<rect x="20" y="18" width="38" height="38" rx="4" fill="{RED}"/>',text(39,44,"Т",18,WHITE,700,"middle"),text(70,45,"ТЕПЛОЩИТ",21,BLACK,800),text(20,88,"Каталог материалов",22,BLACK,700),text(20,106,"МАКС. ЦЕНА ТЕПЛОИЗОЛЯЦИОННОГО МАТЕРИАЛА ЗА 1 М²",7,GRAY,700),'<path d="M24 127h240" stroke="#b8b8b8" stroke-width="5" stroke-linecap="round"/>',f'<path d="M24 127h240" stroke="{RED}" stroke-width="5" stroke-linecap="round"/>',f'<circle cx="264" cy="127" r="8" fill="{RED}"/>',text(20,149,"229,63 ₽/м²",8,GRAY),text(264,149,"1 570,15 ₽/м²",8,GRAY,"end"),f'<rect x="278" y="112" width="92" height="42" rx="4" fill="{RED}"/>',text(324,138,"Подобрать",11,WHITE,700,"middle"),text(20,173,"Найдено материалов: 6",10,GRAY)]
for index,(kind,name,price,likes,image_name) in enumerate(materials):
    col,row=index%2,index//2
    x,y=16+col*179,184+row*190
    catalog += [f'<rect x="{x}" y="{y}" width="174" height="178" rx="4" fill="#fff"/>',f'<image x="{x}" y="{y+4}" width="174" height="82" preserveAspectRatio="xMidYMid meet" href="{data_image(image_name)}"/>',f'<rect x="{x+5}" y="{y+5}" width="{max(48,len(kind)*5.4)}" height="17" rx="4" fill="{RED}"/>',text(x+9,y+17,kind,7,WHITE,700),text(x+10,y+102,"ТЕХНОНИКОЛЬ",8,GRAY),text(x+10,y+120,name,11,BLACK,700),text(x+10,y+137,"Толщина: 50 мм",9,GRAY),text(x+10,y+161,f"{price} ₽/м²",13,BLACK,700),text(x+164,y+161,f"♡ {likes}",9,RED,400,"end")]
catalog += [tabs("catalog"),'</g></svg>']

outputs = [
    ("01-insulation-material-feed-figma.svg", "01-insulation-material-feed-preview.png", "".join(feed)),
    ("02-insulation-material-draft-figma.svg", "02-insulation-material-draft-preview.png", "".join(draft)),
    ("03-insulation-material-catalog-figma.svg", "03-insulation-material-catalog-preview.png", "".join(catalog)),
]
for svg_name,png_name,content in outputs:
    svg_path=DESIGN/svg_name
    svg_path.write_text(content,encoding="utf-8")
    print(svg_path)

