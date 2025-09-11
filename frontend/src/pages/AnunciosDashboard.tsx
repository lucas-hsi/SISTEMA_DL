import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import './Dashboard.css';

// Componentes auxiliares do Card
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
  <h3 className={`card-title ${className}`}>{children}</h3>
);

const AnunciosDashboard: React.FC = () => {
  const { } = useAuth();

  return (
    <div className="dashboard-container" data-role="anuncios">
      {/* Stats Cards */}
      <div className="dashboard-stats">
            <Card className="stat-card stat-card--warning">
              <CardHeader>
                <CardTitle>Anúncios Ativos</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="stat-value">1.247</div>
                <div className="stat-change stat-change--positive">+23</div>
              </CardBody>
            </Card>

            <Card className="stat-card stat-card--success">
              <CardHeader>
                <CardTitle>Visualizações</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="stat-value">45.892</div>
                <div className="stat-change stat-change--positive">+15.2%</div>
              </CardBody>
            </Card>

            <Card className="stat-card stat-card--primary">
              <CardHeader>
                <CardTitle>Cliques</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="stat-value">3.456</div>
                <div className="stat-change stat-change--positive">+8.7%</div>
              </CardBody>
            </Card>

            <Card className="stat-card stat-card--info">
              <CardHeader>
                <CardTitle>Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="stat-value">7.5%</div>
                <div className="stat-change stat-change--positive">+0.3%</div>
              </CardBody>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section">
            <h2 className="section-title">Ações Rápidas</h2>
            <div className="quick-actions">
              <Card className="action-card">
                <CardBody>
                  <div className="action-icon action-icon--create">➕</div>
                  <h3>Criar Anúncio</h3>
                  <p>Publicar novo anúncio de produto</p>
                  <Button variant="primary" size="sm">Criar</Button>
                </CardBody>
              </Card>

              <Card className="action-card">
                <CardBody>
                  <div className="action-icon action-icon--sync">🔄</div>
                  <h3>Sincronizar ML</h3>
                  <p>Atualizar produtos do Mercado Livre</p>
                  <Button variant="primary" size="sm">Sincronizar</Button>
                </CardBody>
              </Card>

              <Card className="action-card">
                <CardBody>
                  <div className="action-icon action-icon--analytics">📊</div>
                  <h3>Relatórios</h3>
                  <p>Visualizar performance dos anúncios</p>
                  <Button variant="primary" size="sm">Ver</Button>
                </CardBody>
              </Card>

              <Card className="action-card">
                <CardBody>
                  <div className="action-icon action-icon--optimize">⚡</div>
                  <h3>Otimizar Anúncios</h3>
                  <p>Melhorar performance e ranking</p>
                  <Button variant="primary" size="sm">Otimizar</Button>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Platform Performance */}
          <div className="dashboard-section">
            <h2 className="section-title">Performance por Plataforma</h2>
            <div className="platform-grid">
              <Card>
                <CardHeader>
                  <CardTitle>Mercado Livre</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="platform-stats">
                    <div className="platform-metric">
                      <span className="metric-label">Anúncios Ativos</span>
                      <span className="metric-value">847</span>
                    </div>
                    <div className="platform-metric">
                      <span className="metric-label">Visualizações</span>
                      <span className="metric-value">32.456</span>
                    </div>
                    <div className="platform-metric">
                      <span className="metric-label">Vendas</span>
                      <span className="metric-value">156</span>
                    </div>
                    <div className="platform-health platform-health--good">
                      Status: Excelente
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Site Próprio</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="platform-stats">
                    <div className="platform-metric">
                      <span className="metric-label">Produtos</span>
                      <span className="metric-value">400</span>
                    </div>
                    <div className="platform-metric">
                      <span className="metric-label">Visualizações</span>
                      <span className="metric-value">13.436</span>
                    </div>
                    <div className="platform-metric">
                      <span className="metric-label">Conversões</span>
                      <span className="metric-value">89</span>
                    </div>
                    <div className="platform-health platform-health--warning">
                      Status: Bom
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Top Performing Ads */}
          <div className="dashboard-section">
            <h2 className="section-title">Anúncios com Melhor Performance</h2>
            <Card>
              <CardBody>
                <div className="ads-list">
                  <div className="ad-item">
                    <div className="ad-image">
                      <div className="ad-placeholder">📷</div>
                    </div>
                    <div className="ad-info">
                      <h4>Pneu Michelin Energy XM2 185/65R15</h4>
                      <p className="ad-platform">Mercado Livre</p>
                      <div className="ad-metrics">
                        <span>1.234 visualizações</span>
                        <span>•</span>
                        <span>23 vendas</span>
                        <span>•</span>
                        <span className="ad-ctr">CTR: 8.5%</span>
                      </div>
                    </div>
                    <div className="ad-actions">
                      <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm">Ver</Button>
                    </div>
                  </div>

                  <div className="ad-item">
                    <div className="ad-image">
                      <div className="ad-placeholder">📷</div>
                    </div>
                    <div className="ad-info">
                      <h4>Filtro de Óleo Mann W 712/75</h4>
                      <p className="ad-platform">Site Próprio</p>
                      <div className="ad-metrics">
                        <span>892 visualizações</span>
                        <span>•</span>
                        <span>18 vendas</span>
                        <span>•</span>
                        <span className="ad-ctr">CTR: 7.2%</span>
                      </div>
                    </div>
                    <div className="ad-actions">
                      <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm">Ver</Button>
                    </div>
                  </div>

                  <div className="ad-item">
                    <div className="ad-image">
                      <div className="ad-placeholder">📷</div>
                    </div>
                    <div className="ad-info">
                      <h4>Óleo Lubrax Essencial 20W50 1L</h4>
                      <p className="ad-platform">Mercado Livre</p>
                      <div className="ad-metrics">
                        <span>756 visualizações</span>
                        <span>•</span>
                        <span>15 vendas</span>
                        <span>•</span>
                        <span className="ad-ctr">CTR: 6.8%</span>
                      </div>
                    </div>
                    <div className="ad-actions">
                      <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm">Ver</Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-section">
            <h2 className="section-title">Atividade Recente</h2>
            <Card>
              <CardBody>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon activity-icon--publish">📢</div>
                    <div className="activity-content">
                      <p><strong>Anúncio publicado</strong></p>
                      <p className="activity-meta">Pastilha de Freio Bosch - há 15 min</p>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon activity-icon--update">✏️</div>
                    <div className="activity-content">
                      <p><strong>Preço atualizado</strong></p>
                      <p className="activity-meta">Bateria Moura 60Ah - há 1 hora</p>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon activity-icon--sync">🔄</div>
                    <div className="activity-content">
                      <p><strong>Sincronização ML concluída</strong></p>
                      <p className="activity-meta">156 produtos atualizados - há 2 horas</p>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon activity-icon--pause">⏸️</div>
                    <div className="activity-content">
                      <p><strong>Anúncio pausado</strong></p>
                      <p className="activity-meta">Produto fora de estoque - há 3 horas</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
      </div>
    </div>
  );
};

export default AnunciosDashboard;