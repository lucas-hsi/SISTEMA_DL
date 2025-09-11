// Serviço de Workflows - DL Auto Peças

import { FirestoreService, createFirestoreService } from './firestoreService';
import { Workflow, WorkflowStep, WorkflowExecution } from '../types';

// ===== INSTÂNCIAS DOS SERVIÇOS =====
const workflowsService = createFirestoreService('workflows');
const workflowStepsService = createFirestoreService('workflowSteps');
const workflowExecutionsService = createFirestoreService('workflowExecutions');

// ===== SERVIÇOS DE WORKFLOWS =====
export class WorkflowService {
  // Buscar todos os workflows
  static async getAllWorkflows(filters?: {
    status?: string;
    category?: string;
    limit?: number;
  }): Promise<Workflow[]> {
    try {
      const queryFilters = [];
      
      // Aplicar filtros
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==' as const, value: filters.status });
      }
      
      if (filters?.category) {
        queryFilters.push({ field: 'category', operator: '==' as const, value: filters.category });
      }
      
      const workflows = await workflowsService.readMany({
        filters: queryFilters,
        orderByField: 'name',
        orderDirection: 'asc',
        limitCount: filters?.limit
      });
      
      return workflows.map(doc => ({
        ...doc,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as Workflow[];
    } catch (error) {
      console.error('Erro ao buscar workflows:', error);
      throw new Error('Falha ao carregar workflows');
    }
  }
  
  // Buscar workflow por ID
  static async getWorkflowById(id: string): Promise<Workflow | null> {
    try {
      const workflow = await workflowsService.readById(id);
      
      if (workflow) {
        return {
          ...workflow,
          createdAt: workflow.createdAt?.toDate?.() || workflow.createdAt,
          updatedAt: workflow.updatedAt?.toDate?.() || workflow.updatedAt
        } as Workflow;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar workflow:', error);
      throw new Error('Falha ao carregar workflow');
    }
  }
  
  // Criar novo workflow
  static async createWorkflow(workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await workflowsService.create(workflowData);
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      throw new Error('Falha ao criar workflow');
    }
  }
  
  // Atualizar workflow
  static async updateWorkflow(id: string, updates: Partial<Omit<Workflow, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await workflowsService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar workflow:', error);
      throw new Error('Falha ao atualizar workflow');
    }
  }
  
  // Deletar workflow
  static async deleteWorkflow(id: string): Promise<void> {
    try {
      // Usar transação para garantir consistência
      await workflowsService.runTransaction(async (transaction) => {
        // Buscar e deletar etapas relacionadas
        const steps = await workflowStepsService.readMany({
          filters: [{ field: 'workflowId', operator: '==', value: id }]
        });
        
        const stepOperations = steps.map(step => ({
          type: 'delete' as const,
          id: step.id
        }));
        
        // Buscar e deletar execuções relacionadas
        const executions = await workflowExecutionsService.readMany({
          filters: [{ field: 'workflowId', operator: '==', value: id }]
        });
        
        const executionOperations = executions.map(execution => ({
          type: 'delete' as const,
          id: execution.id
        }));
        
        // Executar operações em lote
        if (stepOperations.length > 0) {
          await workflowStepsService.batchOperations(stepOperations);
        }
        
        if (executionOperations.length > 0) {
          await workflowExecutionsService.batchOperations(executionOperations);
        }
        
        // Deletar o workflow
        await workflowsService.delete(id);
        
        return true;
      }, ['workflowSteps', 'workflowExecutions']);
    } catch (error) {
      console.error('Erro ao deletar workflow:', error);
      throw new Error('Falha ao deletar workflow');
    }
  }
}

// ===== SERVIÇOS DE ETAPAS DE WORKFLOW =====
export class WorkflowStepService {
  // Buscar etapas por workflow
  static async getStepsByWorkflowId(workflowId: string): Promise<WorkflowStep[]> {
    try {
      const steps = await workflowStepsService.readMany({
        filters: [{ field: 'workflowId', operator: '==', value: workflowId }],
        orderByField: 'order',
        orderDirection: 'asc'
      });
      
      return steps.map(doc => ({
        ...doc,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as WorkflowStep[];
    } catch (error) {
      console.error('Erro ao buscar etapas do workflow:', error);
      throw new Error('Falha ao carregar etapas');
    }
  }
  
  // Criar nova etapa
  static async createStep(stepData: Omit<WorkflowStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await workflowStepsService.create(stepData);
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
      throw new Error('Falha ao criar etapa');
    }
  }
  
  // Atualizar etapa
  static async updateStep(id: string, updates: Partial<Omit<WorkflowStep, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await workflowStepsService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      throw new Error('Falha ao atualizar etapa');
    }
  }
  
  // Deletar etapa
  static async deleteStep(id: string): Promise<void> {
    try {
      await workflowStepsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar etapa:', error);
      throw new Error('Falha ao deletar etapa');
    }
  }
  
  // Reordenar etapas
  static async reorderSteps(workflowId: string, stepIds: string[]): Promise<void> {
    try {
      const operations = stepIds.map((stepId, index) => ({
        type: 'update' as const,
        id: stepId,
        data: { order: index + 1 }
      }));
      
      await workflowStepsService.batchOperations(operations);
    } catch (error) {
      console.error('Erro ao reordenar etapas:', error);
      throw new Error('Falha ao reordenar etapas');
    }
  }
}

// ===== SERVIÇOS DE EXECUÇÕES DE WORKFLOW =====
export class WorkflowExecutionService {
  // Buscar execuções por workflow
  static async getExecutionsByWorkflowId(workflowId: string, filters?: {
    status?: string;
    limit?: number;
  }): Promise<WorkflowExecution[]> {
    try {
      const queryFilters = [{ field: 'workflowId', operator: '==' as const, value: workflowId }];
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==' as const, value: filters.status });
      }
      
      const executions = await workflowExecutionsService.readMany({
        filters: queryFilters,
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: filters?.limit
      });
      
      return executions.map(doc => ({
        ...doc,
        startedAt: doc.startedAt?.toDate?.() || doc.startedAt,
        completedAt: doc.completedAt?.toDate?.() || doc.completedAt,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as WorkflowExecution[];
    } catch (error) {
      console.error('Erro ao buscar execuções do workflow:', error);
      throw new Error('Falha ao carregar execuções');
    }
  }
  
  // Buscar todas as execuções
  static async getAllExecutions(filters?: {
    status?: string;
    assignedTo?: string;
    limit?: number;
  }): Promise<WorkflowExecution[]> {
    try {
      const queryFilters = [];
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==' as const, value: filters.status });
      }
      
      if (filters?.assignedTo) {
        queryFilters.push({ field: 'assignedTo', operator: '==' as const, value: filters.assignedTo });
      }
      
      const executions = await workflowExecutionsService.readMany({
        filters: queryFilters,
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: filters?.limit
      });
      
      return executions.map(doc => ({
        ...doc,
        startedAt: doc.startedAt?.toDate?.() || doc.startedAt,
        completedAt: doc.completedAt?.toDate?.() || doc.completedAt,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as WorkflowExecution[];
    } catch (error) {
      console.error('Erro ao buscar execuções:', error);
      throw new Error('Falha ao carregar execuções');
    }
  }
  
  // Buscar execução por ID
  static async getExecutionById(id: string): Promise<WorkflowExecution | null> {
    try {
      const execution = await workflowExecutionsService.readById(id);
      
      if (execution) {
        return {
          ...execution,
          startedAt: execution.startedAt?.toDate?.() || execution.startedAt,
          completedAt: execution.completedAt?.toDate?.() || execution.completedAt,
          createdAt: execution.createdAt?.toDate?.() || execution.createdAt,
          updatedAt: execution.updatedAt?.toDate?.() || execution.updatedAt
        } as WorkflowExecution;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar execução:', error);
      throw new Error('Falha ao carregar execução');
    }
  }
  
  // Iniciar nova execução
  static async startExecution(executionData: Omit<WorkflowExecution, 'id' | 'startedAt' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const dataWithStartTime = {
        ...executionData,
        status: 'running' as const,
        startedAt: new Date()
      };
      
      return await workflowExecutionsService.create(dataWithStartTime);
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
      throw new Error('Falha ao iniciar execução');
    }
  }
  
  // Atualizar execução
  static async updateExecution(id: string, updates: Partial<Omit<WorkflowExecution, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await workflowExecutionsService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar execução:', error);
      throw new Error('Falha ao atualizar execução');
    }
  }
  
  // Completar execução
  static async completeExecution(id: string, result?: any): Promise<void> {
    try {
      await workflowExecutionsService.update(id, {
        status: 'completed',
        completedAt: new Date(),
        result: result || null
      });
    } catch (error) {
      console.error('Erro ao completar execução:', error);
      throw new Error('Falha ao completar execução');
    }
  }
  
  // Cancelar execução
  static async cancelExecution(id: string, reason?: string): Promise<void> {
    try {
      await workflowExecutionsService.update(id, {
        status: 'cancelled',
        completedAt: new Date(),
        result: { cancelled: true, reason: reason || 'Cancelado pelo usuário' }
      });
    } catch (error) {
      console.error('Erro ao cancelar execução:', error);
      throw new Error('Falha ao cancelar execução');
    }
  }
  
  // Buscar execuções pendentes
  static async getPendingExecutions(assignedTo?: string): Promise<WorkflowExecution[]> {
    try {
      const queryFilters = [
        { field: 'status', operator: 'in' as const, value: ['pending', 'running'] }
      ];
      
      if (assignedTo) {
        queryFilters.push({ field: 'assignedTo', operator: '==' as const, value: assignedTo });
      }
      
      const executions = await workflowExecutionsService.readMany({
        filters: queryFilters,
        orderByField: 'createdAt',
        orderDirection: 'asc'
      });
      
      return executions.map(doc => ({
        ...doc,
        startedAt: doc.startedAt?.toDate?.() || doc.startedAt,
        completedAt: doc.completedAt?.toDate?.() || doc.completedAt,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as WorkflowExecution[];
    } catch (error) {
      console.error('Erro ao buscar execuções pendentes:', error);
      throw new Error('Falha ao carregar execuções pendentes');
    }
  }
}