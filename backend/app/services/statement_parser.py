import re
import csv
import io
import unicodedata
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import Transaction, Category

def normalize_text(text: str) -> str:
    """Remove accents, convert to lowercase and strip whitespaces."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("ASCII")
    return text.lower().strip()

# Keyword mapping to category patterns (matched against normalized category names)
KEYWORD_MAPPINGS = {
    "Alimentação & Mercado": [
        "ifood", "rappi", "mercado", "supermercado", "pao de acucar", "carrefour", "extra", 
        "assai", "atacadao", "bar", "restaurante", "lanchonete", "padaria", "mcdonalds", 
        "burger king", "subway", "habibs", "acougue", "hortifruti", "sacolao", "bistrô",
        "cafe", "confeitaria", "pizza", "pizzaria", "churrascaria", "sorvete", "chocolat",
        "emporio", "horti fruti", "costela", "doceria", "alimentos", "mercearia"
    ],
    "Transporte & Combustível": [
        "uber", "99app", "99pop", "99 corrida", "taxi", "combustivel", "gasolina", "posto",
        "ipiranga", "shell", "petrobras", "auto posto", "pedagio", "conectcar", "sem parar", 
        "veloe", "bilhete unico", "metro", "passagem", "estacionamento", "zona azul", 
        "estapar", "combust", "etanol", "gnv", "mecanico", "oficina", "pneu", "alinhamento"
    ],
    "Moradia & Contas": [
        "aluguel", "condominio", "cond.", "enel", "cpfl", "celesc", "sabesp", "copasa", 
        "compesa", "saneago", "luz", "eletropaulo", "agua", "gas", "comgas", "ultragaz", 
        "vivo", "claro", "tim", "oi", "internet", "fibra", "telecom", "iptu", "taxa de lixo",
        "energia", "imobiliaria", "quintoandar", "zap", "seguro residencial", "eletricidade"
    ],
    "Saúde & Farmácia": [
        "farmacia", "drogaria", "drogasil", "raia", "pacheco", "sao paulo", "panvel", "dpsp", 
        "consulta", "medico", "clinica", "exame", "laboratorio", "hospital", "dentista", 
        "odonto", "remedio", "farm", "psicolog", "terapia", "otica", "oftalmo", "vacina", 
        "droga", "manipulacao", "fisioterapia", "unimed", "bradesco saude", "amil", "sulamerica"
    ],
    "Educação & Cursos": [
        "faculdade", "universidade", "escola", "colegio", "curso", "udemy", "coursera", 
        "alura", "livros", "livraria", "mensalidade", "idiomas", "ingles", "espanhol", 
        "pos gradua", "mba", "treinamento", "workshop", "cultura inglesa", "wizard"
    ],
    "Lazer & Restaurantes": [
        "cinema", "cinemark", "cinepolis", "ingresso", "show", "teatro", "evento", "sympla",
        "ingresse", "parque", "viagem", "hotel", "airbnb", "booking", "decolar", "gol", 
        "latam", "azul linhas", "resort", "passeio", "praia", "barretos", "balada", "choperia"
    ],
    "Assinaturas & Serviços": [
        "netflix", "spotify", "amazon prime", "disney", "hbo", "max", "youtube", "steam", 
        "playstation", "xbox", "deezer", "apple.com", "google storage", "cloud", "icloud", 
        "chatgpt", "openai", "github", "microsoft", "notion", "canva", "globo play", "paramount",
        "starz", "crunchyroll"
    ],
    "Compras Pessoais": [
        "amazon", "mercado livre", "mercadolivre", "shopee", "shein", "magalu", "magazine luiza", 
        "americanas", "zara", "renner", "riachuelo", "c&a", "centauro", "netshoes", "nike", 
        "adidas", "aliexpress", "eletronico", "roupa", "calcado", "kabum", "terabyte", "pichau",
        "dafiti", "marisa", "amaro", "leroy merlin", "telhanorte", "loja"
    ],
    "Salário Mensal": [
        "salario", "proventos", "folha", "folha de pagto", "remuneracao", "pgto salario",
        "deposito de salario", "empresa ltda", "s/a"
    ],
    "Adiantamento Salarial": [
        "adiantamento", "vale", "antecipacao salarial", "quinzena"
    ],
    "Renda Extra & Freelance": [
        "freelance", "freela", "consultoria", "servico prestado", "bico", "comissao", "bonus",
        "reembolso", "cashback"
    ],
    "Rendimentos & Investimentos": [
        "rendimento", "dividendo", "jcp", "juros s/ capital", "cdb", "lci", "lca", "tesouro",
        "b3", "rico", "clear", "xp", "nu invest", "inter dtvm", "aplicacao", "resgate"
    ]
}

def parse_brazilian_number(value_str: str) -> float:
    """Parses numbers in both formats: '1.234,56' or '1234.56' or with R$."""
    if not value_str:
        return 0.0
    cleaned = str(value_str).strip().replace("R$", "").replace(" ", "").replace("Â", "")
    
    # Check if uses brazilian format like 1.234,56 or 45,90
    if "," in cleaned and "." in cleaned:
        # 1.234,56 -> 1234.56
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        # 45,90 -> 45.90
        cleaned = cleaned.replace(",", ".")
    
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def parse_date_str(date_str: str) -> Optional[str]:
    """Parses various date formats to YYYY-MM-DD."""
    if not date_str:
        return None
    cleaned = date_str.strip()
    
    # YYYYMMDD (typical in OFX DTPOSTED)
    m = re.match(r"^(\d{4})(\d{2})(\d{2})", cleaned)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    
    # DD/MM/YYYY or DD-MM-YYYY
    m = re.match(r"^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", cleaned)
    if m:
        d, m_val, y = m.group(1).zfill(2), m.group(2).zfill(2), m.group(3)
        return f"{y}-{m_val}-{d}"
        
    # YYYY/MM/DD or YYYY-MM-DD
    m = re.match(r"^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})", cleaned)
    if m:
        y, m_val, d = m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)
        return f"{y}-{m_val}-{d}"
        
    return None

def suggest_category(description: str, tx_type: str, categories: List[Category]) -> Optional[Category]:
    """Suggests the best category matching the description and type using word-boundary matching and scoring."""
    norm_desc = normalize_text(description)
    if not norm_desc:
        return None
        
    matching_type_cats = [c for c in categories if c.type == tx_type]
    if not matching_type_cats:
        return None
        
    best_cat = None
    best_score = 0
    
    # 1. Match against KEYWORD_MAPPINGS with word boundaries
    for target_cat_name, keywords in KEYWORD_MAPPINGS.items():
        norm_target_name = normalize_text(target_cat_name)
        matched_cat = next((c for c in matching_type_cats if normalize_text(c.name) == norm_target_name), None)
        if not matched_cat:
            matched_cat = next((c for c in matching_type_cats if norm_target_name in normalize_text(c.name) or normalize_text(c.name) in norm_target_name), None)
            
        if matched_cat:
            for kw in keywords:
                # Word boundary check
                pattern = rf"(^|[\s\*\-_/.,;:]){re.escape(kw)}([\s\*\-_/.,;:]|$)"
                if re.search(pattern, norm_desc):
                    # Higher score for longer, more specific keywords
                    score = len(kw) + 10
                    # Brand priority boost
                    if kw in ["uber", "99app", "99pop", "99 corrida", "ifood", "rappi", "drogasil", "netflix", "spotify"]:
                        score += 50
                    if score > best_score:
                        best_score = score
                        best_cat = matched_cat
                        
    if best_cat:
        return best_cat
                    
    # 2. Check if any DB category name directly appears as whole word in description
    for c in matching_type_cats:
        norm_cat_name = normalize_text(c.name)
        words = [w for w in re.split(r"[\s&/\-]+", norm_cat_name) if len(w) >= 4]
        for w in words:
            pattern = rf"(^|[\s\*\-_/.,;:]){re.escape(w)}([\s\*\-_/.,;:]|$)"
            if re.search(pattern, norm_desc):
                score = len(w)
                if score > best_score:
                    best_score = score
                    best_cat = c

    if best_cat:
        return best_cat

    # 3. No keyword match found: return None so it remains empty/unassigned for the user
    return None

def parse_ofx_content(content: str) -> List[Dict[str, Any]]:
    """Parses OFX text content into raw transaction dictionaries."""
    transactions = []
    
    # Split into STMTTRN blocks
    # Support both <STMTTRN>...</STMTTRN> and unclosed SGML <STMTTRN>
    pattern = re.compile(r"<STMTTRN>(.*?)(?=(?:<STMTTRN>|</BANKTRANLIST>|\Z))", re.DOTALL | re.IGNORECASE)
    matches = pattern.findall(content)
    
    for block in matches:
        def get_tag(tag: str) -> str:
            m = re.search(rf"<{tag}>([^<\r\n]+)", block, re.IGNORECASE)
            return m.group(1).strip() if m else ""
            
        trntype = get_tag("TRNTYPE").upper()
        dtposted = get_tag("DTPOSTED")
        trnamt_raw = get_tag("TRNAMT")
        fitid = get_tag("FITID")
        memo = get_tag("MEMO")
        name = get_tag("NAME")
        
        # Build description
        desc_parts = [p for p in [name, memo] if p]
        description = " - ".join(desc_parts) if desc_parts else "Transação Bancária"
        
        # Clean description from extra spaces
        description = re.sub(r"\s+", " ", description).strip()
        
        # Parse date
        formatted_date = parse_date_str(dtposted)
        if not formatted_date:
            continue
            
        amount_val = parse_brazilian_number(trnamt_raw)
        
        # Negative amount or DEBIT = EXPENSE; Positive amount or CREDIT = INCOME
        if amount_val < 0 or trntype in ("DEBIT", "PAYMENT", "CHECK"):
            tx_type = "EXPENSE"
            amount = abs(amount_val)
        else:
            tx_type = "INCOME"
            amount = abs(amount_val)
            
        if amount == 0:
            continue
            
        transactions.append({
            "fitid": fitid,
            "date": formatted_date,
            "description": description,
            "amount": round(amount, 2),
            "type": tx_type,
            "payment_method": "CARTAO" if "cartao" in normalize_text(description) else ("PIX" if "pix" in normalize_text(description) else "OUTRO"),
            "raw_type": trntype
        })
        
    return transactions

def parse_csv_content(content: str) -> List[Dict[str, Any]]:
    """Parses CSV content with automatic delimiter and column detection."""
    # Split lines and remove empty lines
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    if not lines:
        return []
        
    # Detect delimiter: usually ; or ,
    first_few = "\n".join(lines[:5])
    delimiter = ";" if first_few.count(";") > first_few.count(",") else ","
    
    reader = csv.reader(io.StringIO(content), delimiter=delimiter)
    rows = list(reader)
    if not rows:
        return []
        
    header_idx = -1
    date_col = -1
    desc_col = -1
    val_col = -1
    type_col = -1
    
    # Find header row
    for idx, row in enumerate(rows[:10]):
        norm_row = [normalize_text(cell) for cell in row]
        d_col = next((i for i, c in enumerate(norm_row) if any(k in c for k in ["data", "date", "dt."])), -1)
        desc_candidates = ["descricao", "historico", "memo", "titulo", "estabelecimento", "detalhe", "description"]
        s_col = next((i for i, c in enumerate(norm_row) if any(k in c for k in desc_candidates)), -1)
        v_col = next((i for i, c in enumerate(norm_row) if any(k in c for k in ["valor", "amount", "montante", "total"]) and "saldo" not in c), -1)
        if v_col == -1:
            v_col = next((i for i, c in enumerate(norm_row) if "valor" in c or "amount" in c), -1)
            
        if d_col != -1 and s_col != -1 and v_col != -1:
            header_idx = idx
            date_col = d_col
            desc_col = s_col
            val_col = v_col
            type_col = next((i for i, c in enumerate(norm_row) if any(k in c for k in ["tipo", "type", "d/c", "natureza"])), -1)
            break
            
    # If no header detected, try guessing by first row data
    if header_idx == -1:
        start_row = 0
        date_col = 0
        desc_col = 1
        val_col = 2
    else:
        start_row = header_idx + 1
        
    transactions = []
    for row in rows[start_row:]:
        if len(row) <= max(date_col, desc_col, val_col):
            continue
            
        date_str = parse_date_str(row[date_col])
        if not date_str:
            continue
            
        description = re.sub(r"\s+", " ", row[desc_col].strip())
        if not description:
            description = "Lançamento Bancário"
            
        val_str = row[val_col]
        # Ignore header rows that might be repeated
        if any(h in normalize_text(val_str) for h in ["valor", "amount"]):
            continue
            
        amount_num = parse_brazilian_number(val_str)
        if amount_num == 0:
            continue
            
        # Check type column if present
        is_negative = amount_num < 0 or "-" in val_str
        tx_type = "EXPENSE" if is_negative else "INCOME"
        
        if type_col != -1 and len(row) > type_col:
            t_cell = normalize_text(row[type_col])
            if any(k in t_cell for k in ["debito", "debit", "d", "saida", "despesa"]):
                tx_type = "EXPENSE"
            elif any(k in t_cell for k in ["credito", "credit", "c", "entrada", "receita"]):
                tx_type = "INCOME"
                
        amount = abs(amount_num)
        
        transactions.append({
            "fitid": f"csv-{date_str}-{amount}-{len(transactions)}",
            "date": date_str,
            "description": description,
            "amount": round(amount, 2),
            "type": tx_type,
            "payment_method": "PIX" if "pix" in normalize_text(description) else ("CARTAO" if "cartao" in normalize_text(description) else "OUTRO"),
            "raw_type": tx_type
        })
        
    return transactions

def process_statement_file(file_bytes: bytes, filename: str, db: Session) -> List[Dict[str, Any]]:
    """Decodes file, parses OFX/CSV, applies keyword categorization and checks duplicates."""
    # Decode with multiple encodings
    content = ""
    for enc in ["utf-8-sig", "utf-8", "latin-1", "iso-8859-1", "cp1252"]:
        try:
            content = file_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue
            
    if not content:
        raise ValueError("Não foi possível decodificar o arquivo. Formato de texto inválido.")
        
    # Check if OFX or CSV
    is_ofx = "<OFX>" in content.upper() or filename.lower().endswith(".ofx")
    if is_ofx:
        raw_txs = parse_ofx_content(content)
    else:
        raw_txs = parse_csv_content(content)
        
    if not raw_txs:
        raise ValueError("Nenhuma transação válida encontrada no arquivo. Verifique o formato.")
        
    # Load all categories for matching
    categories = db.query(Category).all()
    
    # Load recent transactions to flag duplicates
    existing_txs = db.query(Transaction).all()
    
    processed = []
    for item in raw_txs:
        # Categorize
        sug_cat = suggest_category(item["description"], item["type"], categories)
        
        # Check duplicate (same date and same amount, and similar description)
        norm_desc = normalize_text(item["description"])
        is_dup = False
        for ex in existing_txs:
            if ex.date == item["date"] and abs(ex.amount - item["amount"]) < 0.01 and ex.type == item["type"]:
                ex_desc = normalize_text(ex.description)
                # If descriptions match or overlap
                if ex_desc in norm_desc or norm_desc in ex_desc or ex_desc[:10] == norm_desc[:10]:
                    is_dup = True
                    break
                    
        processed.append({
            "id": item["fitid"],
            "date": item["date"],
            "description": item["description"],
            "amount": item["amount"],
            "type": item["type"],
            "sub_type": "SALARY" if "salario" in norm_desc else "REGULAR",
            "payment_method": item["payment_method"],
            "category_id": sug_cat.id if sug_cat else None,
            "category_name": sug_cat.name if sug_cat else "Sem categoria",
            "category_color": sug_cat.color if sug_cat else "#94A3B8",
            "is_duplicate": is_dup,
            "selected": not is_dup  # Pre-select if not duplicate
        })
        
    return processed
