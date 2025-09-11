// Serviço de Calendário - DL Auto Peças

import { FirestoreService, createFirestoreService } from './firestoreService';
import { CalendarEvent, EventAttachment } from '../types';

// ===== INSTÂNCIAS DOS SERVIÇOS =====
const eventsService = createFirestoreService('calendarEvents');
const attachmentsService = createFirestoreService('eventAttachments');

// ===== SERVIÇOS DE EVENTOS =====
export class CalendarService {
  // Buscar eventos por período
  static async getEventsByDateRange(startDate: Date, endDate: Date, filters?: {
    type?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<CalendarEvent[]> {
    try {
      const queryFilters = [
        { field: 'startDate', operator: '>=' as const, value: startDate },
        { field: 'startDate', operator: '<=' as const, value: endDate }
      ];
      
      // Aplicar filtros adicionais
      if (filters?.type) {
        queryFilters.push({ field: 'type', operator: '==' as const, value: filters.type });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==' as const, value: filters.status });
      }
      
      if (filters?.assignedTo) {
        queryFilters.push({ field: 'assignedTo', operator: '==' as const, value: filters.assignedTo });
      }
      
      const events = await eventsService.readMany({
        filters: queryFilters,
        orderByField: 'startDate',
        orderDirection: 'asc'
      });
      
      return events.map(doc => ({
        ...doc,
        startDate: doc.startDate?.toDate?.() || doc.startDate,
        endDate: doc.endDate?.toDate?.() || doc.endDate,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as CalendarEvent[];
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      throw new Error('Falha ao carregar eventos');
    }
  }
  
  // Buscar todos os eventos
  static async getAllEvents(filters?: {
    type?: string;
    status?: string;
    assignedTo?: string;
    limit?: number;
  }): Promise<CalendarEvent[]> {
    try {
      const queryFilters = [];
      
      // Aplicar filtros
      if (filters?.type) {
        queryFilters.push({ field: 'type', operator: '==' as const, value: filters.type });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==' as const, value: filters.status });
      }
      
      if (filters?.assignedTo) {
        queryFilters.push({ field: 'assignedTo', operator: '==' as const, value: filters.assignedTo });
      }
      
      const events = await eventsService.readMany({
        filters: queryFilters,
        orderByField: 'startDate',
        orderDirection: 'desc',
        limitCount: filters?.limit
      });
      
      return events.map(doc => ({
        ...doc,
        startDate: doc.startDate?.toDate?.() || doc.startDate,
        endDate: doc.endDate?.toDate?.() || doc.endDate,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as CalendarEvent[];
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      throw new Error('Falha ao carregar eventos');
    }
  }
  
  // Buscar evento por ID
  static async getEventById(id: string): Promise<CalendarEvent | null> {
    try {
      const event = await eventsService.readById(id);
      
      if (event) {
        return {
          ...event,
          startDate: event.startDate?.toDate?.() || event.startDate,
          endDate: event.endDate?.toDate?.() || event.endDate,
          createdAt: event.createdAt?.toDate?.() || event.createdAt,
          updatedAt: event.updatedAt?.toDate?.() || event.updatedAt
        } as CalendarEvent;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      throw new Error('Falha ao carregar evento');
    }
  }
  
  // Criar novo evento
  static async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const eventToCreate = {
        ...eventData,
        startDate: eventData.startDate,
        endDate: eventData.endDate || null
      };
      
      return await eventsService.create(eventToCreate);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw new Error('Falha ao criar evento');
    }
  }
  
  // Atualizar evento
  static async updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await eventsService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw new Error('Falha ao atualizar evento');
    }
  }
  
  // Deletar evento
  static async deleteEvent(id: string): Promise<void> {
    try {
      // Primeiro, deletar anexos relacionados
      const attachments = await attachmentsService.readMany({
        filters: [{ field: 'eventId', operator: '==' as const, value: id }]
      });
      
      if (attachments.length > 0) {
        const deleteAttachmentsPromises = attachments.map(attachment => 
          attachmentsService.delete(attachment.id!)
        );
        await Promise.all(deleteAttachmentsPromises);
      }
      
      // Depois, deletar o evento
      await eventsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw new Error('Falha ao deletar evento');
    }
  }
  
  // Buscar eventos próximos (próximos 7 dias)
  static async getUpcomingEvents(limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      
      const events = await eventsService.readMany({
        filters: [
          { field: 'startDate', operator: '>=' as const, value: now },
          { field: 'startDate', operator: '<=' as const, value: nextWeek },
          { field: 'status', operator: '!=' as const, value: 'cancelled' }
        ],
        orderByField: 'startDate',
        orderDirection: 'asc',
        limitCount: limit
      });
      
      return events.map(doc => ({
        ...doc,
        startDate: doc.startDate?.toDate?.() || doc.startDate,
        endDate: doc.endDate?.toDate?.() || doc.endDate,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as CalendarEvent[];
    } catch (error) {
      console.error('Erro ao buscar eventos próximos:', error);
      throw new Error('Falha ao carregar eventos próximos');
    }
  }
  
  // Buscar eventos atrasados
  static async getOverdueEvents(): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      
      const events = await eventsService.readMany({
        filters: [
          { field: 'endDate', operator: '<' as const, value: now },
          { field: 'status', operator: '==' as const, value: 'pending' }
        ],
        orderByField: 'endDate',
        orderDirection: 'asc'
      });
      
      return events.map(doc => ({
        ...doc,
        startDate: doc.startDate?.toDate?.() || doc.startDate,
        endDate: doc.endDate?.toDate?.() || doc.endDate,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as CalendarEvent[];
    } catch (error) {
      console.error('Erro ao buscar eventos atrasados:', error);
      throw new Error('Falha ao carregar eventos atrasados');
    }
  }
}

// ===== SERVIÇOS DE ANEXOS =====
export class EventAttachmentService {
  // Buscar anexos por evento
  static async getAttachmentsByEventId(eventId: string): Promise<EventAttachment[]> {
    try {
      const attachments = await attachmentsService.readMany({
        filters: [{ field: 'eventId', operator: '==' as const, value: eventId }],
        orderByField: 'createdAt',
        orderDirection: 'desc'
      });
      
      return attachments.map(doc => ({
        ...doc,
        createdAt: doc.createdAt?.toDate?.() || doc.createdAt,
        updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt
      })) as EventAttachment[];
    } catch (error) {
      console.error('Erro ao buscar anexos do evento:', error);
      throw new Error('Falha ao carregar anexos');
    }
  }
  
  // Criar novo anexo
  static async createAttachment(attachmentData: Omit<EventAttachment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await attachmentsService.create(attachmentData);
    } catch (error) {
      console.error('Erro ao criar anexo:', error);
      throw new Error('Falha ao criar anexo');
    }
  }
  
  // Atualizar anexo
  static async updateAttachment(id: string, updates: Partial<Omit<EventAttachment, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await attachmentsService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar anexo:', error);
      throw new Error('Falha ao atualizar anexo');
    }
  }
  
  // Deletar anexo
  static async deleteAttachment(id: string): Promise<void> {
    try {
      await attachmentsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      throw new Error('Falha ao deletar anexo');
    }
  }
}