import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import './Dashboard.css';

const GestorDashboard: React.FC = () => {
  const { } = useAuth();

  return (
    <div className="dashboard-container" data-role="gestor">
      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-value">R$ 125.430,00</div>
          <div className="stat-label">Total de Vendas</div>
          <div className="stat-change positive">+12% este mês</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">1.234</div>
          <div className="stat-label">Usuários Ativos</div>
          <div className="stat-change positive">+5% este mês</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">8.567</div>
          <div className="stat-label">Produtos Cadastrados</div>
          <div className="stat-change neutral">Sem alteração</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">23</div>
          <div className="stat-label">Pedidos Pendentes</div>
          <div className="stat-change negative">-8% este mês</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Ações Rápidas</h2>
        <div className="quick-actions">
          <Button variant="primary" className="action-btn">
            Adicionar Usuário
          </Button>
          <Button variant="secondary" className="action-btn">
            Gerar Relatório
          </Button>
          <Button variant="outline" className="action-btn">
            Configurar Sistema
          </Button>
          <Button variant="secondary" className="action-btn">
            Backup de Dados
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2 className="section-title">Atividade Recente</h2>
        <Card>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <p><strong>João Silva</strong> criou uma nova conta</p>
                <span className="activity-time">2 horas atrás</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📦</div>
              <div className="activity-content">
                <p><strong>Maria Santos</strong> adicionou 15 produtos</p>
                <span className="activity-time">4 horas atrás</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💰</div>
              <div className="activity-content">
                <p><strong>Pedro Costa</strong> processou venda de R$ 2.350,00</p>
                <span className="activity-time">6 horas atrás</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GestorDashboard;