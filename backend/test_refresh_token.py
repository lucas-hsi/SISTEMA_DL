import requests
import json
import traceback
import sqlite3

def check_refresh_token_in_db(token):
    """Verifica se o refresh token existe no banco"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, user_id, expires_at, is_revoked FROM refresh_tokens WHERE token = ?",
            (token,)
        )
        result = cursor.fetchone()
        
        if result:
            print(f'✅ Token encontrado no banco:')
            print(f'  ID: {result[0]}')
            print(f'  User ID: {result[1]}')
            print(f'  Expires at: {result[2]}')
            print(f'  Is revoked: {result[3]}')
        else:
            print('❌ Token NÃO encontrado no banco')
            
        conn.close()
        return result
        
    except Exception as e:
        print(f'❌ Erro ao verificar token no banco: {e}')
        return None

def test_refresh_token():
    try:
        # Primeiro fazer login para obter um token válido
        print('🔐 Fazendo login para obter tokens...')
        login_response = requests.post(
             'http://localhost:8000/api/v1/login',
             data={
                 'username': 'gestor@dl.com',
                 'password': 'gestor123'
             }
         )
        
        if login_response.status_code != 200:
            print(f'❌ Erro no login: {login_response.status_code}')
            print(f'Response: {login_response.text}')
            return
            
        login_data = login_response.json()
        refresh_token = login_data['refresh_token']
        print(f'✅ Login realizado com sucesso')
        print(f'Refresh token obtido: {refresh_token[:20]}...')
        
        # Verificar se o token existe no banco
        print('\n🔍 Verificando token no banco de dados...')
        check_refresh_token_in_db(refresh_token)
        
        # Testar endpoint de refresh token
        print('\n🔄 Testando endpoint de refresh...')
        response = requests.post(
            'http://localhost:8000/api/v1/refresh',
            json={'refresh_token': refresh_token}
        )
        
        print(f'Status: {response.status_code}')
        print(f'Headers: {dict(response.headers)}')
        
        if response.status_code == 200:
            print('✅ Refresh realizado com sucesso!')
            print('Response:', json.dumps(response.json(), indent=2))
        else:
            print('❌ Erro no refresh:')
            print('Response Text:', response.text)
            
    except Exception as e:
        print(f'❌ Erro: {str(e)}')
        traceback.print_exc()

if __name__ == '__main__':
    test_refresh_token()