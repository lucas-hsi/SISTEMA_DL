// Componente WorkflowManagement - DL Auto Peças

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FiGitBranch,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiPlay,
  FiPause,
  FiCheck,
  FiX,
  FiClock,
  FiUser,
  FiUsers,
  FiArrowRight,
  FiSettings,
  FiEye,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import { Button, Input, Select, Modal, ModalActions } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { WorkflowStatus, ApprovalStatus, WorkflowFilters } from '../../types/manager';

// ===== TIPOS =====
interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  requiredRole: string;
  order: number;
  isRequired: boolean;
  estimatedDuration: number; // em horas
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  title: string;
  description: string;
  requestedBy: string;
  currentStep: number;
  status: ApprovalStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  steps: WorkflowStepInstance[];
  metadata: Record<string, any>;
}

interface WorkflowStepInstance {
  id: string;
  stepId: string;
  name: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  comments: string;
  attachments: string[];
}

interface WorkflowFormData {
  name: string;
  description: string;
  category: string;
  steps: Omit<WorkflowStep, 'id'>[];
}

// ===== STYLED COMPONENTS =====
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.colors.text.secondary};
  border-radius: 8px 8px 0 0;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? props.theme.colors.primaryDark : props.theme.colors.surfaceHover};
  }
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const WorkflowsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const WorkflowCard = styled.div<{ status?: WorkflowStatus }>`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return props.theme.colors.success;
      case 'draft': return props.theme.colors.warning;
      case 'archived': return props.theme.colors.border;
      default: return props.theme.colors.border;
    }
  }};
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const WorkflowHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const WorkflowTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const WorkflowDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.4;
`;

const WorkflowMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
`;

const StatusBadge = styled.span<{ status: WorkflowStatus | ApprovalStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'active':
      case 'approved':
        return `
          background: ${props.theme.colors.success}20;
          color: ${props.theme.colors.success};
        `;
      case 'draft':
      case 'pending':
        return `
          background: ${props.theme.colors.warning}20;
          color: ${props.theme.colors.warning};
        `;
      case 'archived':
      case 'rejected':
        return `
          background: ${props.theme.colors.error}20;
          color: ${props.theme.colors.error};
        `;
      default:
        return `
          background: ${props.theme.colors.primary}20;
          color: ${props.theme.colors.primary};
        `;
    }
  }}
`;

const PriorityBadge = styled.span<{ priority: 'low' | 'medium' | 'high' | 'urgent' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.priority) {
      case 'urgent':
        return `
          background: ${props.theme.colors.error};
          color: white;
        `;
      case 'high':
        return `
          background: ${props.theme.colors.error}20;
          color: ${props.theme.colors.error};
        `;
      case 'medium':
        return `
          background: ${props.theme.colors.warning}20;
          color: ${props.theme.colors.warning};
        `;
      default:
        return `
          background: ${props.theme.colors.success}20;
          color: ${props.theme.colors.success};
        `;
    }
  }}
`;

const WorkflowSteps = styled.div`
  padding: 1rem 1.5rem;
`;

const StepItem = styled.div<{ completed?: boolean; current?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  
  ${props => props.current && `
    background: ${props.theme.colors.primary}10;
    border-radius: 6px;
    padding: 0.5rem;
    margin: 0 -0.5rem;
  `}
`;

const StepIcon = styled.div<{ completed?: boolean; current?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  
  ${props => {
    if (props.completed) {
      return `
        background: ${props.theme.colors.success};
        color: white;
      `;
    } else if (props.current) {
      return `
        background: ${props.theme.colors.primary};
        color: white;
      `;
    } else {
      return `
        background: ${props.theme.colors.border};
        color: ${props.theme.colors.text.secondary};
      `;
    }
  }}
`;

const StepText = styled.span<{ completed?: boolean; current?: boolean }>`
  font-size: 0.875rem;
  color: ${props => {
    if (props.completed) return props.theme.colors.success;
    if (props.current) return props.theme.colors.primary;
    return props.theme.colors.text.secondary;
  }};
  font-weight: ${props => props.current ? 500 : 400};
`;

const WorkflowActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StepsSection = styled.div`
  margin-top: 2rem;
`;

const StepFormCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
`;

// ===== DADOS MOCK =====
const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Aprovação de Desconto',
    description: 'Fluxo para aprovação de descontos acima de 10%',
    category: 'Vendas',
    status: 'active',
    createdBy: 'admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    isActive: true,
    steps: [
      {
        id: '1',
        name: 'Solicitação',
        description: 'Vendedor solicita desconto',
        assignedTo: 'vendedor',
        requiredRole: 'vendedor',
        order: 1,
        isRequired: true,
        estimatedDuration: 0.5
      },
      {
        id: '2',
        name: 'Análise Gerencial',
        description: 'Gerente analisa a solicitação',
        assignedTo: 'gerente',
        requiredRole: 'gerente',
        order: 2,
        isRequired: true,
        estimatedDuration: 2
      },
      {
        id: '3',
        name: 'Aprovação Final',
        description: 'Diretor aprova desconto',
        assignedTo: 'diretor',
        requiredRole: 'diretor',
        order: 3,
        isRequired: true,
        estimatedDuration: 4
      }
    ]
  },
  {
    id: '2',
    name: 'Compra de Sucata',
    description: 'Processo de aprovação para compra de sucatas',
    category: 'Compras',
    status: 'active',
    createdBy: 'admin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
    steps: [
      {
        id: '1',
        name: 'Avaliação',
        description: 'Avaliação técnica da sucata',
        assignedTo: 'tecnico',
        requiredRole: 'tecnico',
        order: 1,
        isRequired: true,
        estimatedDuration: 1
      },
      {
        id: '2',
        name: 'Aprovação Financeira',
        description: 'Análise financeira da compra',
        assignedTo: 'financeiro',
        requiredRole: 'financeiro',
        order: 2,
        isRequired: true,
        estimatedDuration: 3
      }
    ]
  }
];

const mockInstances: WorkflowInstance[] = [
  {
    id: '1',
    workflowId: '1',
    workflowName: 'Aprovação de Desconto',
    title: 'Desconto 15% - Cliente Premium',
    description: 'Solicitação de desconto para cliente premium',
    requestedBy: 'João Silva',
    currentStep: 1,
    status: 'pending',
    priority: 'high',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    metadata: {
      clienteId: 'cliente123',
      valorOriginal: 5000,
      valorDesconto: 750,
      percentualDesconto: 15
    },
    steps: [
      {
        id: '1',
        stepId: '1',
        name: 'Solicitação',
        assignedTo: 'João Silva',
        status: 'completed',
        startedAt: new Date('2024-01-20T09:00:00'),
        completedAt: new Date('2024-01-20T09:30:00'),
        comments: 'Cliente premium com histórico de compras',
        attachments: []
      },
      {
        id: '2',
        stepId: '2',
        name: 'Análise Gerencial',
        assignedTo: 'Maria Santos',
        status: 'in_progress',
        startedAt: new Date('2024-01-20T10:00:00'),
        comments: '',
        attachments: []
      },
      {
        id: '3',
        stepId: '3',
        name: 'Aprovação Final',
        assignedTo: 'Carlos Lima',
        status: 'pending',
        comments: '',
        attachments: []
      }
    ]
  }
];

const categoryOptions = [
  { value: 'Vendas', label: 'Vendas' },
  { value: 'Compras', label: 'Compras' },
  { value: 'Financeiro', label: 'Financeiro' },
  { value: 'RH', label: 'Recursos Humanos' },
  { value: 'Operacional', label: 'Operacional' }
];

const roleOptions = [
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'admin', label: 'Administrador' }
];

// ===== COMPONENTE =====
export const WorkflowManagement: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const showSuccess = (message: string) => {
    showNotification(message, 'success');
  };
  
  const showError = (message: string) => {
    showNotification(message, 'error');
  };
  
  const [activeTab, setActiveTab] = useState<'workflows' | 'instances'>('workflows');
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [instances, setInstances] = useState<WorkflowInstance[]>(mockInstances);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [filteredInstances, setFilteredInstances] = useState<WorkflowInstance[]>(mockInstances);
  
  const [filters, setFilters] = useState<WorkflowFilters>({
    search: '',
    status: undefined,
    category: '',
    assignedTo: ''
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    category: '',
    steps: []
  });
  
  const [loading, setLoading] = useState(false);
  
  // Aplicar filtros
  useEffect(() => {
    if (activeTab === 'workflows') {
      let filtered = workflows;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(wf => 
          wf.name.toLowerCase().includes(searchLower) ||
          wf.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.status) {
        filtered = filtered.filter(wf => wf.status === filters.status);
      }
      
      if (filters.category) {
        filtered = filtered.filter(wf => wf.category === filters.category);
      }
      
      setFilteredWorkflows(filtered);
    } else {
      let filtered = instances;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(inst => 
          inst.title.toLowerCase().includes(searchLower) ||
          inst.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.status) {
        filtered = filtered.filter(inst => inst.status === filters.status);
      }
      
      if (filters.assignedTo) {
        filtered = filtered.filter(inst => 
          inst.steps.some(step => 
            step.assignedTo.toLowerCase().includes(filters.assignedTo.toLowerCase())
          )
        );
      }
      
      setFilteredInstances(filtered);
    }
  }, [workflows, instances, filters, activeTab]);
  
  const handleFilterChange = (key: keyof WorkflowFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const openModal = (workflow?: Workflow) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setFormData({
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        steps: workflow.steps.map(step => ({
          name: step.name,
          description: step.description,
          assignedTo: step.assignedTo,
          requiredRole: step.requiredRole,
          order: step.order,
          isRequired: step.isRequired,
          estimatedDuration: step.estimatedDuration
        }))
      });
    } else {
      setEditingWorkflow(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        steps: []
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWorkflow(null);
  };
  
  const handleFormChange = (field: keyof WorkflowFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const addStep = () => {
    const newStep = {
      name: '',
      description: '',
      assignedTo: '',
      requiredRole: '',
      order: formData.steps.length + 1,
      isRequired: true,
      estimatedDuration: 1
    };
    setFormData(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
  };
  
  const updateStep = (index: number, field: string, value: any) => {
    const updatedSteps = [...formData.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setFormData(prev => ({ ...prev, steps: updatedSteps }));
  };
  
  const removeStep = (index: number) => {
    const updatedSteps = formData.steps.filter((_, i) => i !== index);
    // Reordenar os steps
    updatedSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    setFormData(prev => ({ ...prev, steps: updatedSteps }));
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!formData.name || !formData.description || formData.steps.length === 0) {
        showError('Preencha todos os campos obrigatórios');
        return;
      }
      
      const workflowData: Workflow = {
        id: editingWorkflow?.id || Date.now().toString(),
        ...formData,
        status: 'draft',
        createdBy: user?.name || 'admin',
        createdAt: editingWorkflow?.createdAt || new Date(),
        updatedAt: new Date(),
        isActive: false,
        steps: formData.steps.map((step, index) => ({
          ...step,
          id: Date.now().toString() + index,
          order: index + 1
        }))
      };
      
      if (editingWorkflow) {
        setWorkflows(prev => prev.map(wf => 
          wf.id === editingWorkflow.id ? workflowData : wf
        ));
        showSuccess('Fluxo de trabalho atualizado com sucesso!');
      } else {
        setWorkflows(prev => [...prev, workflowData]);
        showSuccess('Fluxo de trabalho criado com sucesso!');
      }
      
      closeModal();
    } catch (error) {
      showError('Erro ao salvar fluxo de trabalho');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleWorkflowStatus = async (workflowId: string) => {
    try {
      setWorkflows(prev => prev.map(wf => 
        wf.id === workflowId 
          ? { 
              ...wf, 
              status: wf.status === 'active' ? 'draft' : 'active',
              isActive: wf.status !== 'active',
              updatedAt: new Date()
            }
          : wf
      ));
      showSuccess('Status do fluxo atualizado!');
    } catch (error) {
      showError('Erro ao atualizar status');
    }
  };
  
  const deleteWorkflow = async (workflowId: string) => {
    try {
      setWorkflows(prev => prev.filter(wf => wf.id !== workflowId));
      showSuccess('Fluxo de trabalho removido com sucesso!');
    } catch (error) {
      showError('Erro ao remover fluxo de trabalho');
    }
  };
  
  const approveStep = async (instanceId: string, stepId: string) => {
    try {
      setInstances(prev => prev.map(inst => {
        if (inst.id === instanceId) {
          const updatedSteps = inst.steps.map(step => {
            if (step.id === stepId) {
              return {
                ...step,
                status: 'completed' as const,
                completedAt: new Date()
              };
            }
            return step;
          });
          
          const nextStep = updatedSteps.find(step => step.status === 'pending');
          if (nextStep) {
            nextStep.status = 'in_progress';
            nextStep.startedAt = new Date();
          }
          
          const allCompleted = updatedSteps.every(step => step.status === 'completed');
          
          return {
            ...inst,
            steps: updatedSteps,
            status: allCompleted ? 'approved' as ApprovalStatus : inst.status,
            completedAt: allCompleted ? new Date() : inst.completedAt,
            updatedAt: new Date()
          };
        }
        return inst;
      }));
      
      showSuccess('Etapa aprovada com sucesso!');
    } catch (error) {
      showError('Erro ao aprovar etapa');
    }
  };
  
  const rejectStep = async (instanceId: string, stepId: string) => {
    try {
      setInstances(prev => prev.map(inst => 
        inst.id === instanceId 
          ? {
              ...inst,
              status: 'rejected' as ApprovalStatus,
              updatedAt: new Date(),
              steps: inst.steps.map(step => 
                step.id === stepId 
                  ? { ...step, status: 'rejected' as const, completedAt: new Date() }
                  : step
              )
            }
          : inst
      ));
      
      showSuccess('Etapa rejeitada!');
    } catch (error) {
      showError('Erro ao rejeitar etapa');
    }
  };
  
  const getStatusLabel = (status: WorkflowStatus | ApprovalStatus) => {
    const labels = {
      active: 'Ativo',
      draft: 'Rascunho',
      archived: 'Arquivado',
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      in_progress: 'Em Andamento'
    };
    return labels[status] || status;
  };
  
  const getStatusIcon = (status: WorkflowStatus | ApprovalStatus) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <FiCheckCircle />;
      case 'pending':
      case 'in_progress':
        return <FiClock />;
      case 'rejected':
        return <FiX />;
      case 'draft':
        return <FiEdit3 />;
      default:
        return <FiAlertCircle />;
    }
  };
  
  const getPriorityLabel = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority];
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FiGitBranch />
          Fluxos de Trabalho
        </Title>
        {activeTab === 'workflows' && (
          <Button
            onClick={() => openModal()}
            icon={<FiPlus />}
          >
            Novo Fluxo
          </Button>
        )}
      </Header>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'workflows'}
          onClick={() => setActiveTab('workflows')}
        >
          Fluxos de Trabalho
        </Tab>
        <Tab 
          active={activeTab === 'instances'}
          onClick={() => setActiveTab('instances')}
        >
          Solicitações
        </Tab>
      </TabsContainer>
      
      <FiltersContainer>
        <Input
          placeholder="Buscar..."
          leftIcon={<FiSearch />}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        
        <Select
          placeholder="Status"
          options={[
            { value: '', label: 'Todos os status' },
            { value: 'active', label: 'Ativo' },
            { value: 'draft', label: 'Rascunho' },
            { value: 'pending', label: 'Pendente' },
            { value: 'approved', label: 'Aprovado' },
            { value: 'rejected', label: 'Rejeitado' }
          ]}
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
        />
        
        {activeTab === 'workflows' && (
          <Select
            placeholder="Categoria"
            options={[{ value: '', label: 'Todas as categorias' }, ...categoryOptions]}
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          />
        )}
        
        {activeTab === 'instances' && (
          <Input
            placeholder="Responsável"
            leftIcon={<FiUser />}
            value={filters.assignedTo}
            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
          />
        )}
      </FiltersContainer>
      
      {activeTab === 'workflows' ? (
        <WorkflowsGrid>
          {filteredWorkflows.map(workflow => (
            <WorkflowCard key={workflow.id} status={workflow.status}>
              <WorkflowHeader>
                <WorkflowTitle>{workflow.name}</WorkflowTitle>
                <WorkflowDescription>{workflow.description}</WorkflowDescription>
                <WorkflowMeta>
                  <StatusBadge status={workflow.status}>
                    {getStatusIcon(workflow.status)}
                    {getStatusLabel(workflow.status)}
                  </StatusBadge>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    {workflow.category}
                  </span>
                </WorkflowMeta>
              </WorkflowHeader>
              
              <WorkflowSteps>
                {workflow.steps.map((step, index) => (
                  <StepItem key={step.id}>
                    <StepIcon>
                      {index + 1}
                    </StepIcon>
                    <StepText>{step.name}</StepText>
                  </StepItem>
                ))}
              </WorkflowSteps>
              
              <WorkflowActions>
                <Button
                  size="small"
                  variant={workflow.status === 'active' ? 'warning' : 'success'}
                  icon={workflow.status === 'active' ? <FiPause /> : <FiPlay />}
                  onClick={() => toggleWorkflowStatus(workflow.id)}
                >
                  {workflow.status === 'active' ? 'Pausar' : 'Ativar'}
                </Button>
                
                <Button
                  size="small"
                  variant="secondary"
                  icon={<FiEdit3 />}
                  onClick={() => openModal(workflow)}
                />
                
                <Button
                  size="small"
                  variant="error"
                  icon={<FiTrash2 />}
                  onClick={() => deleteWorkflow(workflow.id)}
                />
              </WorkflowActions>
            </WorkflowCard>
          ))}
        </WorkflowsGrid>
      ) : (
        <WorkflowsGrid>
          {filteredInstances.map(instance => (
            <WorkflowCard key={instance.id} status={instance.status}>
              <WorkflowHeader>
                <WorkflowTitle>{instance.title}</WorkflowTitle>
                <WorkflowDescription>{instance.description}</WorkflowDescription>
                <WorkflowMeta>
                  <StatusBadge status={instance.status}>
                    {getStatusIcon(instance.status)}
                    {getStatusLabel(instance.status)}
                  </StatusBadge>
                  <PriorityBadge priority={instance.priority}>
                    {getPriorityLabel(instance.priority)}
                  </PriorityBadge>
                </WorkflowMeta>
              </WorkflowHeader>
              
              <WorkflowSteps>
                {instance.steps.map((step, index) => (
                  <StepItem 
                    key={step.id} 
                    completed={step.status === 'completed'}
                    current={step.status === 'in_progress'}
                  >
                    <StepIcon 
                      completed={step.status === 'completed'}
                      current={step.status === 'in_progress'}
                    >
                      {step.status === 'completed' ? <FiCheck /> : index + 1}
                    </StepIcon>
                    <div>
                      <StepText 
                        completed={step.status === 'completed'}
                        current={step.status === 'in_progress'}
                      >
                        {step.name}
                      </StepText>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {step.assignedTo}
                      </div>
                    </div>
                  </StepItem>
                ))}
              </WorkflowSteps>
              
              <WorkflowActions>
                {instance.status === 'pending' && (
                  <>
                    <Button
                      size="small"
                      variant="success"
                      icon={<FiCheck />}
                      onClick={() => {
                        const currentStep = instance.steps.find(s => s.status === 'in_progress');
                        if (currentStep) {
                          approveStep(instance.id, currentStep.id);
                        }
                      }}
                    >
                      Aprovar
                    </Button>
                    
                    <Button
                      size="small"
                      variant="error"
                      icon={<FiX />}
                      onClick={() => {
                        const currentStep = instance.steps.find(s => s.status === 'in_progress');
                        if (currentStep) {
                          rejectStep(instance.id, currentStep.id);
                        }
                      }}
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
                
                <Button
                  size="small"
                  variant="secondary"
                  icon={<FiEye />}
                >
                  Detalhes
                </Button>
              </WorkflowActions>
            </WorkflowCard>
          ))}
        </WorkflowsGrid>
      )}
      
      {((activeTab === 'workflows' && filteredWorkflows.length === 0) || 
        (activeTab === 'instances' && filteredInstances.length === 0)) && (
        <EmptyState>
          <FiGitBranch size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhum {activeTab === 'workflows' ? 'fluxo de trabalho' : 'solicitação'} encontrado</h3>
          <p>
            {activeTab === 'workflows' 
              ? 'Crie seu primeiro fluxo de trabalho para automatizar processos.'
              : 'Não há solicitações pendentes no momento.'
            }
          </p>
        </EmptyState>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingWorkflow ? 'Editar Fluxo' : 'Novo Fluxo de Trabalho'}
        size="large"
        loading={loading}
        footer={
          <ModalActions
            onCancel={closeModal}
            onConfirm={handleSave}
            cancelText="Cancelar"
            confirmText={editingWorkflow ? 'Atualizar' : 'Criar'}
            loading={loading}
          />
        }
      >
        <FormGrid>
          <Input
            label="Nome *"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="Digite o nome do fluxo"
          />
          
          <Select
            label="Categoria *"
            options={categoryOptions}
            value={formData.category}
            onChange={(e) => handleFormChange('category', e.target.value)}
            placeholder="Selecione a categoria"
          />
        </FormGrid>
        
        <Input
          label="Descrição *"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Descreva o objetivo do fluxo de trabalho"
        />
        
        <StepsSection>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Etapas do Fluxo</h3>
            <Button
              size="small"
              onClick={addStep}
              icon={<FiPlus />}
            >
              Adicionar Etapa
            </Button>
          </div>
          
          {formData.steps.map((step, index) => (
            <StepFormCard key={index}>
              <StepHeader>
                <h4>Etapa {index + 1}</h4>
                <Button
                  size="small"
                  variant="error"
                  icon={<FiTrash2 />}
                  onClick={() => removeStep(index)}
                />
              </StepHeader>
              
              <FormGrid>
                <Input
                  label="Nome da Etapa"
                  value={step.name}
                  onChange={(e) => updateStep(index, 'name', e.target.value)}
                  placeholder="Ex: Análise Gerencial"
                />
                
                <Select
                  label="Função Responsável"
                  options={roleOptions}
                  value={step.requiredRole}
                  onChange={(e) => updateStep(index, 'requiredRole', e.target.value)}
                  placeholder="Selecione a função"
                />
                
                <Input
                  label="Responsável"
                  value={step.assignedTo}
                  onChange={(e) => updateStep(index, 'assignedTo', e.target.value)}
                  placeholder="Nome do responsável"
                />
                
                <Input
                  label="Duração Estimada (horas)"
                  type="number"
                  value={step.estimatedDuration}
                  onChange={(e) => updateStep(index, 'estimatedDuration', Number(e.target.value))}
                  placeholder="1"
                />
              </FormGrid>
              
              <Input
                label="Descrição"
                value={step.description}
                onChange={(e) => updateStep(index, 'description', e.target.value)}
                placeholder="Descreva o que deve ser feito nesta etapa"
              />
            </StepFormCard>
          ))}
        </StepsSection>
      </Modal>
    </Container>
  );
};

export default WorkflowManagement;