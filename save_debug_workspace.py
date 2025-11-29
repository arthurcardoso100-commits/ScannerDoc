#!/usr/bin/env python3
"""
Salva HTML de debug da tabela ABEV3 dentro do workspace (Desktop/vscode-chatgpt/debug)
"""
import os, time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
try:
    driver.get('https://opcoes.net.br/opcoes2/bovespa')
    time.sleep(5)
    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.NAME, 'IdAcao')))
    select_acao = Select(driver.find_element(By.NAME, 'IdAcao'))

    target = None
    for o in select_acao.options:
        if o.text.strip().upper().startswith('ABEV3'):
            target = o.get_attribute('value')
            break
    if not target:
        print('ABEV3 não encontrado')
    else:
        select_acao.select_by_value(target)
        time.sleep(6)
        tabela = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, 'tblListaOpc')))
        tabela_html = tabela.get_attribute('outerHTML')
        workspace_debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(workspace_debug_dir, exist_ok=True)
        dest = os.path.join(workspace_debug_dir, 'ABEV3_debug_workspace.html')
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(tabela_html)
        print('HTML salvo em', dest)
finally:
    driver.quit()
