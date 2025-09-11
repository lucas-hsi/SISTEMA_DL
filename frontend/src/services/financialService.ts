// Serviço Financeiro - DL Auto Peças

import { financialTransactionsService, financialAttachmentsService } from './firestoreService';
import { FinancialTransaction, FinancialAttachment } from '../types';

// ===== SERVIÇOS DE TRANSAÇÕES FINANCEIRAS =====
export class FinancialService {
  // Buscar todas as transações
  static async getAllTransactions(filters?: {
    type?: 'income' | 'expense';
    status?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<FinancialTransaction[]> {
    try {
      const queryFilters = [];
      
      // Aplicar filtros
      if (filters?.type) {
        queryFilters.push({ field: 'type', operator: '==', value: filters.type });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters?.category) {
        queryFilters.push({ field: 'category', operator: '==', value: filters.category });
      }
      
      if (filters?.dateFrom) {
        queryFilters.push({ field: 'dueDate', operator: '>=', value: filters.dateFrom });
      }
      
      if (filters?.dateTo) {
        queryFilters.push({ field: 'dueDate', operator: '<=', value: filters.dateTo });
      }
      
      const transactions = await financialTransactionsService.readMany({
        queryFilters,
        orderBy: [{ field: 'dueDate', direction: 'desc' }],
        limit: filters?.limit
      });
      
      return transactions.map(transaction => ({
        ...transaction,
        dueDate: transaction.dueDate?.toDate?.() || transaction.dueDate,
        paymentDate: transaction.paymentDate?.toDate?.() || transaction.paymentDate,
        createdAt: transaction.createdAt?.toDate?.() || transaction.createdAt,
        updatedAt: transaction.updatedAt?.toDate?.() || transaction.updatedAt
      })) as FinancialTransaction[];
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw new Error('Falha ao carregar transações');
    }
  }
  
  // Buscar transação por ID
  static async getTransactionById(id: string): Promise<FinancialTransaction | null> {
    try {
      const transaction = await financialTransactionsService.readById(id);
      
      if (transaction) {
        return {
          ...transaction,
          dueDate: transaction.dueDate?.toDate?.() || transaction.dueDate,
          paymentDate: transaction.paymentDate?.toDate?.() || transaction.paymentDate,
          createdAt: transaction.createdAt?.toDate?.() || transaction.createdAt,
          updatedAt: transaction.updatedAt?.toDate?.() || transaction.updatedAt
        } as FinancialTransaction;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw new Error('Falha ao carregar transação');
    }
  }
  
  // Criar nova transação
  static async createTransaction(transactionData: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const result = await financialTransactionsService.create({
        ...transactionData,
        dueDate: transactionData.dueDate,
        paymentDate: transactionData.paymentDate || null,
        createdAt: now,
        updatedAt: now
      });
      
      return result.id;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Falha ao criar transação');
    }
  }
  
  // Atualizar transação
  static async updateTransaction(id: string, updates: Partial<Omit<FinancialTransaction, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };
      
      await financialTransactionsService.update(id, updateData);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw new Error('Falha ao atualizar transação');
    }
  }
  
  // Deletar transação
  static async deleteTransaction(id: string): Promise<void> {
    try {
      // Primeiro, deletar anexos relacionados
      const attachments = await financialAttachmentsService.readMany({
        queryFilters: [{ field: 'transactionId', operator: '==', value: id }]
      });
      
      const deleteAttachmentsPromises = attachments.map(attachment => 
        financialAttachmentsService.delete(attachment.id)
      );
      await Promise.all(deleteAttachmentsPromises);
      
      // Depois, deletar a transação
      await financialTransactionsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      throw new Error('Falha ao deletar transação');
    }
  }
  
  // Buscar contas a pagar
  static async getAccountsPayable(filters?: {
    status?: string;
    overdue?: boolean;
    limit?: number;
  }): Promise<FinancialTransaction[]> {
    try {
      const queryFilters: any[] = [
        { field: 'type', operator: '==', value: 'expense' }
      ];
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters?.overdue) {
        const today = new Date();
        queryFilters.push(
          { field: 'dueDate', operator: '<', value: today },
          { field: 'status', operator: '==', value: 'pending' }
        );
      }
      
      const transactions = await financialTransactionsService.readMany({
        queryFilters,
        orderBy: [{ field: 'dueDate', direction: 'asc' }],
        limit: filters?.limit
      });
      
      return transactions.map(transaction => ({
        ...transaction,
        dueDate: transaction.dueDate?.toDate ? transaction.dueDate.toDate() : transaction.dueDate,
        paymentDate: transaction.paymentDate?.toDate ? transaction.paymentDate.toDate() : transaction.paymentDate,
        createdAt: transaction.createdAt?.toDate ? transaction.createdAt.toDate() : transaction.createdAt,
        updatedAt: transaction.updatedAt?.toDate ? transaction.updatedAt.toDate() : transaction.updatedAt
      } as FinancialTransaction));
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      throw new Error('Falha ao carregar contas a pagar');
    }
  }
  
  // Buscar contas a receber
  static async getAccountsReceivable(filters?: {
    status?: string;
    overdue?: boolean;
    limit?: number;
  }): Promise<FinancialTransaction[]> {
    try {
      const queryFilters: any[] = [
        { field: 'type', operator: '==', value: 'income' }
      ];
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters?.overdue) {
        const today = new Date();
        queryFilters.push(
          { field: 'dueDate', operator: '<', value: today },
          { field: 'status', operator: '==', value: 'pending' }
        );
      }
      
      const transactions = await financialTransactionsService.readMany({
        queryFilters,
        orderBy: [{ field: 'dueDate', direction: 'asc' }],
        limit: filters?.limit
      });
      
      return transactions.map(transaction => ({
        ...transaction,
        dueDate: transaction.dueDate?.toDate ? transaction.dueDate.toDate() : transaction.dueDate,
        paymentDate: transaction.paymentDate?.toDate ? transaction.paymentDate.toDate() : transaction.paymentDate,
        createdAt: transaction.createdAt?.toDate ? transaction.createdAt.toDate() : transaction.createdAt,
        updatedAt: transaction.updatedAt?.toDate ? transaction.updatedAt.toDate() : transaction.updatedAt
      } as FinancialTransaction));
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error);
      throw new Error('Falha ao carregar contas a receber');
    }
  }
  
  // Marcar transação como paga
  static async markAsPaid(id: string, paymentDate?: Date): Promise<void> {
    try {
      await financialTransactionsService.update(id, {
        status: 'paid',
        paymentDate: paymentDate || new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao marcar transação como paga:', error);
      throw new Error('Falha ao atualizar status da transação');
    }
  }
  
  // Obter resumo financeiro
  static async getFinancialSummary(dateFrom: Date, dateTo: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    pendingIncome: number;
    pendingExpenses: number;
    overdueIncome: number;
    overdueExpenses: number;
  }> {
    try {
      const transactions = await financialTransactionsService.readMany({
        queryFilters: [
          { field: 'dueDate', operator: '>=', value: dateFrom },
          { field: 'dueDate', operator: '<=', value: dateTo }
        ]
      });
      
      const today = new Date();
      
      let totalIncome = 0;
      let totalExpenses = 0;
      let pendingIncome = 0;
      let pendingExpenses = 0;
      let overdueIncome = 0;
      let overdueExpenses = 0;
      
      transactions.forEach((transaction) => {
        const amount = transaction.amount || 0;
        const dueDate = transaction.dueDate?.toDate ? transaction.dueDate.toDate() : transaction.dueDate;
        const isOverdue = dueDate && dueDate < today && transaction.status === 'pending';
        
        if (transaction.type === 'income') {
          totalIncome += amount;
          if (transaction.status === 'pending') {
            pendingIncome += amount;
            if (isOverdue) {
              overdueIncome += amount;
            }
          }
        } else if (transaction.type === 'expense') {
          totalExpenses += amount;
          if (transaction.status === 'pending') {
            pendingExpenses += amount;
            if (isOverdue) {
              overdueExpenses += amount;
            }
          }
        }
      });
      
      return {
        totalIncome,
        totalExpenses,
        pendingIncome,
        pendingExpenses,
        overdueIncome,
        overdueExpenses
      };
    } catch (error) {
      console.error('Erro ao obter resumo financeiro:', error);
      throw new Error('Falha ao carregar resumo financeiro');
    }
  }
}

// ===== SERVIÇOS DE ANEXOS FINANCEIROS =====
export class FinancialAttachmentService {
  // Buscar anexos por transação
  static async getAttachmentsByTransactionId(transactionId: string): Promise<FinancialAttachment[]> {
    try {
      const attachments = await financialAttachmentsService.readMany({
        queryFilters: [{ field: 'transactionId', operator: '==', value: transactionId }],
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      });
      
      return attachments.map(attachment => ({
        ...attachment,
        createdAt: attachment.createdAt?.toDate ? attachment.createdAt.toDate() : attachment.createdAt,
        updatedAt: attachment.updatedAt?.toDate ? attachment.updatedAt.toDate() : attachment.updatedAt
      } as FinancialAttachment));
    } catch (error) {
      console.error('Erro ao buscar anexos da transação:', error);
      throw new Error('Falha ao carregar anexos');
    }
  }
  
  // Criar novo anexo
  static async createAttachment(attachmentData: Omit<FinancialAttachment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const result = await financialAttachmentsService.create({
        ...attachmentData,
        createdAt: now,
        updatedAt: now
      });
      
      return result.id;
    } catch (error) {
      console.error('Erro ao criar anexo:', error);
      throw new Error('Falha ao criar anexo');
    }
  }
  
  // Atualizar anexo
  static async updateAttachment(id: string, updates: Partial<Omit<FinancialAttachment, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await financialAttachmentsService.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar anexo:', error);
      throw new Error('Falha ao atualizar anexo');
    }
  }
  
  // Deletar anexo
  static async deleteAttachment(id: string): Promise<void> {
    try {
      await financialAttachmentsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      throw new Error('Falha ao deletar anexo');
    }
  }
}