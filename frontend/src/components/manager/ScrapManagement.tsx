// Gestão de Sucatas - DL Auto Peças

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit3, 
  FiTrash2, 
  FiEye,
  FiCode,
  FiPackage,
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiDownload,
  FiUpload
} from 'react-icons/fi';
import { Scrap, ScrapSearchFilters } from '../../types/scrap';
import { useScrapManagement, useSuppliers } from '../../hooks/useScrapManagement';
import { useNotification } from '../../contexts/NotificationContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Select } from '../common/Select';

// ===== STYLED COMPONENTS =====
const Container = styled.div`
  padding: 2rem;
  background: ${props => props.theme.colors.background};
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    color: ${props => props.theme.colors.text.primary};
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const FiltersContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid ${props => props.theme.colors.border};
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  align-items: end;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchInput = styled.div`
  position: relative;
  
  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 8px;
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
    }
  }
  
  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const ScrapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const ScrapCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const ScrapImage = styled.div<{ image?: string }>`
  height: 200px;
  background: ${props => props.image 
    ? `url(${props.image}) center/cover` 
    : `linear-gradient(135deg, ${props.theme.colors.primary}20, ${props.theme.colors.secondary}20)`
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 3rem;
`;

const ScrapContent = styled.div`
  padding: 1.5rem;
`;

const ScrapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ScrapTitle = styled.h3`
  color: #1a202c;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

const ScrapCode = styled.span`
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.status) {
      case 'purchased': return '#3b82f620';
      case 'in_dismantling': return '#f59e0b20';
      case 'dismantled': return '#10b98120';
      case 'sold': return '#8b5cf620';
      default: return '#64748b20';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'purchased': return '#3b82f6';
      case 'in_dismantling': return '#f59e0b';
      case 'dismantled': return '#10b981';
      case 'sold': return '#8b5cf6';
      default: return '#64748b';
    }
  }};
`;

const ScrapInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
  
  .icon {
    color: #3b82f6;
  }
  
  .value {
    color: #1a202c;
    font-weight: 500;
  }
`;

const ScrapActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  &:hover {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  &.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    
    &:hover {
      background: #2563eb;
    }
  }
  
  &.danger {
    &:hover {
      background: #ef4444;
      border-color: #ef4444;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  
  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #1a202c;
  }
  
  p {
    margin-bottom: 2rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid ${props => props.theme.colors.border};
  border-top: 3px solid ${props => props.theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;



// ===== COMPONENTE PRINCIPAL =====
export const ScrapManagement: React.FC = () => {
  const [filters, setFilters] = useState<ScrapSearchFilters>({
    search: '',
    status: '',
    supplierId: '',
    vehicleBrand: '',
    dateRange: undefined
  });
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedScrap, setSelectedScrap] = useState<Scrap | null>(null);
  
  const { 
    scraps, 
    loading, 
    error, 
    fetchScraps, 
    deleteScrap 
  } = useScrapManagement();
  
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { addNotification } = useNotification();

  // Carregar dados iniciais
  useEffect(() => {
    fetchScraps();
    fetchSuppliers();
  }, [fetchScraps, fetchSuppliers]);

  // Aplicar filtros
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchScraps(filters);
    }, 500);
    
    return () => clearTimeout(delayedSearch);
  }, [filters, fetchScraps]);

  // Atualizar filtro de busca
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };



  // Abrir modal de detalhes
  const handleViewDetails = (scrap: Scrap) => {
    setSelectedScrap(scrap);
    setShowDetailsModal(true);
  };

  // Deletar sucata
  const handleDelete = async (scrap: Scrap) => {
    if (window.confirm(`Tem certeza que deseja excluir a sucata ${scrap.code}?`)) {
      await deleteScrap(scrap.id);
      addNotification('Sucata excluída com sucesso!', 'success');
    }
  };

  // Gerar QR Code para sucata
  const handleGenerateQRCode = async (scrap: Scrap) => {
    try {
      const qrData = {
        scrapId: scrap.id,
        code: scrap.code,
        vehicle: `${scrap.vehicleInfo.brand} ${scrap.vehicleInfo.model}`,
        year: scrap.vehicleInfo.year,
        status: scrap.status
      };
      
      console.log('QR Code data:', qrData);
      addNotification('QR Code gerado com sucesso!', 'success');
    } catch (error) {
      addNotification('Erro ao gerar QR Code', 'error');
    }
  };

  // Formatar status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'purchased': return 'Comprada';
      case 'in_dismantling': return 'Desmanchando';
      case 'dismantled': return 'Desmanchada';
      case 'sold': return 'Vendida';
      default: return status;
    }
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };



  return (
    <Container>
      <Header>
        <h1>Gestão de Sucatas</h1>
        <ActionButtons>
          <Button variant="secondary" icon={<FiUpload />}>
            Importar
          </Button>
          <Button variant="secondary" icon={<FiDownload />}>
            Exportar
          </Button>
          <Button 
            variant="primary" 
            icon={<FiPlus />}
          >
            Nova Sucata
          </Button>
        </ActionButtons>
      </Header>

      {/* Filtros */}
      <FiltersContainer>
        <FiltersGrid>
          <SearchInput>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por código, marca, modelo..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </SearchInput>
          
          <Select
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            placeholder="Status"
            options={[
              { value: '', label: 'Todos os Status' },
              { value: 'purchased', label: 'Comprada' },
              { value: 'in_dismantling', label: 'Desmanchando' },
              { value: 'dismantled', label: 'Desmanchada' },
              { value: 'sold', label: 'Vendida' }
            ]}
          />
          
          <Select
            value={filters.supplierId}
            onChange={(value) => setFilters(prev => ({ ...prev, supplierId: value }))}
            placeholder="Fornecedor"
            options={[
              { value: '', label: 'Todos os Fornecedores' },
              ...suppliers.map(supplier => ({
                value: supplier.id,
                label: supplier.name
              }))
            ]}
          />
          
          <Select
            value={filters.vehicleBrand}
            onChange={(value) => setFilters(prev => ({ ...prev, vehicleBrand: value }))}
            placeholder="Marca"
            options={[
              { value: '', label: 'Todas as Marcas' },
              { value: 'volkswagen', label: 'Volkswagen' },
              { value: 'ford', label: 'Ford' },
              { value: 'chevrolet', label: 'Chevrolet' },
              { value: 'fiat', label: 'Fiat' },
              { value: 'toyota', label: 'Toyota' }
            ]}
          />
          
          <Button variant="secondary" icon={<FiFilter />}>
            Mais Filtros
          </Button>
        </FiltersGrid>
      </FiltersContainer>

      {/* Lista de Sucatas */}
      {loading ? (
        <LoadingSpinner>
          <div className="spinner" />
        </LoadingSpinner>
      ) : error ? (
        <EmptyState>
          <div className="icon">⚠️</div>
          <h3>Erro ao carregar sucatas</h3>
          <p>{error}</p>
          <Button onClick={() => fetchScraps()}>Tentar Novamente</Button>
        </EmptyState>
      ) : scraps.length === 0 ? (
        <EmptyState>
          <div className="icon"><FiTruck /></div>
          <h3>Nenhuma sucata encontrada</h3>
          <p>Comece cadastrando sua primeira sucata para gerenciar o desmanche e peças.</p>
          <Button 
            variant="primary" 
            icon={<FiPlus />}
          >
            Cadastrar Primeira Sucata
          </Button>
        </EmptyState>
      ) : (
        <ScrapGrid>
          {scraps.map(scrap => {
            const supplier = suppliers.find(s => s.id === scrap.supplierId);
            
            return (
              <ScrapCard key={scrap.id}>
                <ScrapImage image={scrap.photos[0]}>
                  {!scrap.photos[0] && <FiTruck />}
                </ScrapImage>
                
                <ScrapContent>
                  <ScrapHeader>
                    <div>
                      <ScrapTitle>
                        {scrap.vehicleInfo.brand} {scrap.vehicleInfo.model}
                      </ScrapTitle>
                      <ScrapCode>{scrap.code}</ScrapCode>
                    </div>
                    <StatusBadge status={scrap.status}>
                      {getStatusLabel(scrap.status)}
                    </StatusBadge>
                  </ScrapHeader>
                  
                  <ScrapInfo>
                    <InfoItem>
                      <FiCalendar className="icon" />
                      <span className="value">{scrap.vehicleInfo.year}</span>
                    </InfoItem>
                    <InfoItem>
                      <FiDollarSign className="icon" />
                      <span className="value">
                        {formatPrice(scrap.purchaseInfo.totalCost)}
                      </span>
                    </InfoItem>
                    <InfoItem>
                      <FiUser className="icon" />
                      <span className="value">{supplier?.name || 'N/A'}</span>
                    </InfoItem>
                    <InfoItem>
                      <FiPackage className="icon" />
                      <span className="value">{scrap.parts.length} peças</span>
                    </InfoItem>
                  </ScrapInfo>
                  
                  <ScrapActions>
                    <ActionButton onClick={() => handleViewDetails(scrap)}>
                      <FiEye /> Ver
                    </ActionButton>
                    <ActionButton>
                      <FiEdit3 /> Editar
                    </ActionButton>
                    <ActionButton onClick={() => handleGenerateQRCode(scrap)}>
                      <FiCode /> QR Code
                    </ActionButton>
                    <ActionButton 
                      className="danger"
                      onClick={() => handleDelete(scrap)}
                    >
                      <FiTrash2 />
                    </ActionButton>
                  </ScrapActions>
                </ScrapContent>
              </ScrapCard>
            );
          })}
        </ScrapGrid>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedScrap && (
        <Modal
          title={`Detalhes - ${selectedScrap.code}`}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedScrap(null);
          }}
          size="large"
        >
          <div>
            <h3>{selectedScrap.vehicleInfo.brand} {selectedScrap.vehicleInfo.model}</h3>
            <p>Código: {selectedScrap.code}</p>
            <p>Ano: {selectedScrap.vehicleInfo.year}</p>
            <p>Status: {getStatusLabel(selectedScrap.status)}</p>
            <p>Valor: {formatPrice(selectedScrap.purchaseInfo.totalCost)}</p>
          </div>
        </Modal>
      )}
    </Container>
  );
};

export default ScrapManagement;