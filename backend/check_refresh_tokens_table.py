import sqlite3

def check_refresh_tokens_table():
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        # Verificar se a tabela refresh_tokens existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='refresh_tokens';")
        result = cursor.fetchone()
        
        if result:
            print('✅ Tabela refresh_tokens existe')
            
            # Verificar estrutura da tabela
            cursor.execute("PRAGMA table_info(refresh_tokens);")
            columns = cursor.fetchall()
            print('\n📋 Estrutura da tabela:')
            for col in columns:
                print(f'  - {col[1]} ({col[2]})')
        else:
            print('❌ Tabela refresh_tokens NÃO existe')
            
        conn.close()
        return result is not None
        
    except Exception as e:
        print(f'❌ Erro ao verificar tabela: {e}')
        return False

if __name__ == '__main__':
    check_refresh_tokens_table()