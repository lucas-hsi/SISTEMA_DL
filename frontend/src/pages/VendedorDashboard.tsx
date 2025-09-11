import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import './Dashboard.css';

// Componentes auxiliares para Card
interface CardHeaderProps {
  children: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
}

interface CardTitleProps {
  children: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children }) => (
  <div className="card-header">{children}</div>
);

const CardBody: React.FC<CardBodyProps> = ({ children }) => (
  <div className="card-body">{children}</div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children }) => (
  <h3 className="card-title">{children}</h3>
);

const VendedorDashboard: React.FC = () => {
  const { } = useAuth();

  return (
    <div className="dashboard-container" data-role="vendedor">
      {/* Stats Cards */}
      <div className="dashboard-stats">
          <Card className="stat-card stat-card--success">
            <CardHeader>
              <CardTitle>Vendas do Mês</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="stat-value">R$ 18.750,00</div>
              <div className="stat-change stat-change--positive">+8.2%</div>
            </CardBody>
          </Card>

          <Card className="stat-card stat-card--primary">
            <CardHeader>
              <CardTitle>Clientes Atendidos</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="stat-value">47</div>
              <div className="stat-change stat-change--positive">+12</div>
            </CardBody>
          </Card>

          <Card className="stat-card stat-card--warning">
            <CardHeader>
              <CardTitle>Orçamentos Pendentes</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="stat-value">8</div>
              <div className="stat-change stat-change--neutral">-2</div>
            </CardBody>
          </Card>

          <Card className="stat-card stat-card--info">
            <CardHeader>
              <CardTitle>Meta do Mês</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="stat-value">75%</div>
              <div className="stat-change stat-change--positive">+5%</div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2 className="section-title">Ações Rápidas</h2>
          <div className="quick-actions">
            <Card className="action-card">
              <CardBody>
                <div className="action-icon action-icon--sale">💰</div>
                <h3>Nova Venda</h3>
                <p>Registrar uma nova venda</p>
                <Button variant="primary" size="sm">Iniciar</Button>
              </CardBody>
            </Card>

            <Card className="action-card">
              <CardBody>
                <div className="action-icon action-icon--quote">📋</div>
                <h3>Criar Orçamento</h3>
                <p>Gerar orçamento para cliente</p>
                <Button variant="primary" size="sm">Criar</Button>
              </CardBody>
            </Card>

            <Card className="action-card">
              <CardBody>
                <div className="action-icon action-icon--search">🔍</div>
                <h3>Buscar Produtos</h3>
                <p>Consultar estoque e preços</p>
                <Button variant="primary" size="sm">Buscar</Button>
              </CardBody>
            </Card>

            <Card className="action-card">
              <CardBody>
                <div className="action-icon action-icon--customers">👥</div>
                <h3>Meus Clientes</h3>
                <p>Gerenciar carteira de clientes</p>
                <Button variant="primary" size="sm">Acessar</Button>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Sales Performance */}
        <div className="dashboard-section">
          <h2 className="section-title">Performance de Vendas</h2>
          <div className="performance-grid">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Categoria</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="category-stats">
                  <div className="category-item">
                    <span className="category-name">Pneus</span>
                    <div className="category-bar">
                      <div className="category-progress" style={{ width: '75%' }}></div>
                    </div>
                    <span className="category-value">R$ 8.200</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">Filtros</span>
                    <div className="category-bar">
                      <div className="category-progress" style={{ width: '45%' }}></div>
                    </div>
                    <span className="category-value">R$ 4.850</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">Óleos</span>
                    <div className="category-bar">
                      <div className="category-progress" style={{ width: '60%' }}></div>
                    </div>
                    <span className="category-value">R$ 3.200</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">Peças</span>
                    <div className="category-bar">
                      <div className="category-progress" style={{ width: '30%' }}></div>
                    </div>
                    <span className="category-value">R$ 2.500</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Vendas</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="sales-list">
                  <div className="sale-item">
                    <div className="sale-info">
                      <p className="sale-customer">Carlos Mendes</p>
                      <p className="sale-product">Pneu Michelin 185/65R15</p>
                    </div>
                    <div className="sale-value">R$ 450,00</div>
                  </div>
                  <div className="sale-item">
                    <div className="sale-info">
                      <p className="sale-customer">Ana Silva</p>
                      <p className="sale-product">Filtro de Ar + Óleo 5W30</p>
                    </div>
                    <div className="sale-value">R$ 180,00</div>
                  </div>
                  <div className="sale-item">
                    <div className="sale-info">
                      <p className="sale-customer">Roberto Santos</p>
                      <p className="sale-product">Pastilha de Freio Dianteira</p>
                    </div>
                    <div className="sale-value">R$ 120,00</div>
                  </div>
                  <div className="sale-item">
                    <div className="sale-info">
                      <p className="sale-customer">Lucia Oliveira</p>
                      <p className="sale-product">Bateria 60Ah</p>
                    </div>
                    <div className="sale-value">R$ 280,00</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="dashboard-section">
          <h2 className="section-title">Tarefas Pendentes</h2>
          <Card>
            <CardBody>
              <div className="task-list">
                <div className="task-item">
                  <div className="task-icon task-icon--quote">📋</div>
                  <div className="task-content">
                    <p><strong>Finalizar orçamento</strong></p>
                    <p className="task-meta">Cliente: Pedro Alves - Prazo: Hoje</p>
                  </div>
                  <Button variant="outline" size="sm">Ver</Button>
                </div>

                <div className="task-item">
                  <div className="task-icon task-icon--follow">📞</div>
                  <div className="task-content">
                    <p><strong>Follow-up com cliente</strong></p>
                    <p className="task-meta">Cliente: Maria Costa - Prazo: Amanhã</p>
                  </div>
                  <Button variant="outline" size="sm">Ver</Button>
                </div>

                <div className="task-item">
                  <div className="task-icon task-icon--delivery">🚚</div>
                  <div className="task-content">
                    <p><strong>Confirmar entrega</strong></p>
                    <p className="task-meta">Pedido #1234 - Prazo: Hoje</p>
                  </div>
                  <Button variant="outline" size="sm">Ver</Button>
                </div>
              </div>
            </CardBody>
          </Card>
      </div>
    </div>
  );
};

export default VendedorDashboard;