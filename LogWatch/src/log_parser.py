# transformar cada linha bruta em dados estruturados.


import re

def parse_log_line(line):
    pattern = (
        r"(\d{4}-\d{2}-\d{2})\s+"
        r"(\d{2}:\d{2}:\d{2})\s+"
        r"([A-Z]+)\s+"
        r"IP=(\d{1,3}(?:\.\d{1,3}){3})\s+"
        r"USER=(\w+)\s+"
        r"EVENT=(\w+)\s+"
        r"STATUS=(\w+)"
    ) #  isso serve para capturar os diferentes componentes de uma linha de log, como data, hora, nível de log, endereço IP, usuário, evento e status.

    match = re.search(pattern, line) # isso serve para verificar se a linha de log corresponde ao padrão definido. Se houver uma correspondência, os grupos capturados podem ser extraídos.

    if not match:
        return None

    return {
        "date": match.group(1),
        "time": match.group(2),
        "level": match.group(3),
        "ip": match.group(4),
        "user": match.group(5),
        "event": match.group(6),
        "status": match.group(7)
    }

