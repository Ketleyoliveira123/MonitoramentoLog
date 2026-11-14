# Vamos criar uma função que recebe o caminho de um arquivo e devolve suas linhas.


def read_log_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.readlines()

