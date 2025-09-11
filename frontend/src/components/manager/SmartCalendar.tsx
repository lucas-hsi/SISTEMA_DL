// Componente SmartCalendar - DL Auto Peças

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FiCalendar,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiUpload,
  FiFile,
  FiClock,
  FiUser,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import { Button, Input, Select, Modal } from '../common';
import { useAuth } from '../../hooks';
import { useNotification } from '../../contexts/NotificationContext';
import { CalendarEvent, EventType, EventPriority } from '../../types/manager';

// ===== TIPOS =====
interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  priority: EventPriority;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  assignedTo: string;
  location: string;
  attachments: File[];
}

interface CalendarFilters {
  type: EventType | '';
  priority: EventPriority | '';
  assignedTo: string;
  month: number;
  year: number;
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
  color: #1a1a1a;
  margin: 0;
`;

const CalendarContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FiltersCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
`;

const FilterTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CalendarMain = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
`;

const MonthNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const MonthTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  min-width: 200px;
  text-align: center;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #1a1a1a;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const DayHeader = styled.div`
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
`;

const DayCell = styled.div<{ 
  isToday?: boolean;
  isOtherMonth?: boolean;
  hasEvents?: boolean;
}>`
  min-height: 120px;
  padding: 0.5rem;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  background: ${props => {
    if (props.isOtherMonth) return '#ffffff';
    if (props.isToday) return '#3b82f610';
    return '#f9fafb';
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
  
  &:nth-child(7n) {
    border-right: none;
  }
`;

const DayNumber = styled.div<{ isToday?: boolean; isOtherMonth?: boolean }>`
  font-weight: ${props => props.isToday ? 600 : 500};
  color: ${props => {
    if (props.isToday) return '#3b82f6';
    if (props.isOtherMonth) return '#6b7280';
    return '#1a1a1a';
  }};
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const EventItem = styled.div<{ priority?: EventPriority; type?: EventType }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => {
    if (props.priority === 'high') return '#ef444420';
    if (props.priority === 'medium') return '#f59e0b20';
    return '#3b82f620';
  }};
  
  color: ${props => {
    if (props.priority === 'high') return '#ef4444';
    if (props.priority === 'medium') return '#f59e0b';
    return '#3b82f6';
  }};
  
  border-left: 3px solid ${props => {
    if (props.priority === 'high') return '#ef4444';
    if (props.priority === 'medium') return '#f59e0b';
    return '#3b82f6';
  }};
  
  &:hover {
    opacity: 0.8;
    transform: translateX(2px);
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const AttachmentsSection = styled.div`
  margin-top: 1.5rem;
`;

const AttachmentsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border-radius: 6px;
  font-size: 0.875rem;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
  }
`;

// ===== DADOS MOCK =====
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Reunião com Fornecedor',
    description: 'Discussão sobre novos produtos e preços',
    type: 'meeting',
    priority: 'high',
    startDate: new Date(2024, 0, 15, 9, 0),
    endDate: new Date(2024, 0, 15, 10, 30),
    assignedTo: 'João Silva',
    location: 'Sala de Reuniões',
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Vencimento Boleto Fornecedor X',
    description: 'Pagamento de R$ 15.000,00',
    type: 'payment',
    priority: 'high',
    startDate: new Date(2024, 0, 20, 0, 0),
    endDate: new Date(2024, 0, 20, 23, 59),
    assignedTo: 'Maria Santos',
    location: '',
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Inventário Mensal',
    description: 'Contagem de estoque do mês',
    type: 'task',
    priority: 'medium',
    startDate: new Date(2024, 0, 25, 8, 0),
    endDate: new Date(2024, 0, 25, 17, 0),
    assignedTo: 'Carlos Oliveira',
    location: 'Estoque',
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const eventTypeOptions = [
  { value: 'meeting', label: 'Reunião' },
  { value: 'task', label: 'Tarefa' },
  { value: 'payment', label: 'Pagamento' },
  { value: 'reminder', label: 'Lembrete' },
  { value: 'appointment', label: 'Compromisso' }
];

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' }
];

const employeeOptions = [
  { value: 'João Silva', label: 'João Silva' },
  { value: 'Maria Santos', label: 'Maria Santos' },
  { value: 'Carlos Oliveira', label: 'Carlos Oliveira' }
];

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ===== COMPONENTE =====
export const SmartCalendar: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>(mockEvents);
  const [filters, setFilters] = useState<CalendarFilters>({
    type: '',
    priority: '',
    assignedTo: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    assignedTo: '',
    location: '',
    attachments: []
  });
  
  const [loading, setLoading] = useState(false);
  
  // Aplicar filtros
  useEffect(() => {
    let filtered = events;
    
    if (filters.type) {
      filtered = filtered.filter(event => event.type === filters.type);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(event => event.priority === filters.priority);
    }
    
    if (filters.assignedTo) {
      filtered = filtered.filter(event => event.assignedTo === filters.assignedTo);
    }
    
    // Filtrar por mês/ano
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getMonth() === filters.month && eventDate.getFullYear() === filters.year;
    });
    
    setFilteredEvents(filtered);
  }, [events, filters]);
  

  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setFilters(prev => {
      let newMonth = prev.month;
      let newYear = prev.year;
      
      if (direction === 'next') {
        newMonth++;
        if (newMonth > 11) {
          newMonth = 0;
          newYear++;
        }
      } else {
        newMonth--;
        if (newMonth < 0) {
          newMonth = 11;
          newYear--;
        }
      }
      
      return { ...prev, month: newMonth, year: newYear };
    });
  };
  
  const openModal = (event?: CalendarEvent, date?: Date) => {
    if (event) {
      setEditingEvent(event);
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      setFormData({
        title: event.title,
        description: event.description,
        type: event.type,
        priority: event.priority,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        assignedTo: event.assignedTo,
        location: event.location,
        attachments: []
      });
    } else {
      setEditingEvent(null);
      const selectedDateStr = date ? date.toISOString().split('T')[0] : '';
      
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        startDate: selectedDateStr,
        endDate: selectedDateStr,
        startTime: '09:00',
        endTime: '10:00',
        assignedTo: '',
        location: '',
        attachments: []
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };
  
  const handleFormChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };
  
  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!formData.title || !formData.startDate) {
        addNotification({ type: 'error', title: 'Preencha os campos obrigatórios' });
        return;
      }
      
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      const eventData: CalendarEvent = {
        id: editingEvent?.id || Date.now().toString(),
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        startDate: startDateTime,
        endDate: endDateTime,
        assignedTo: formData.assignedTo,
        location: formData.location,
        attachments: formData.attachments.map(file => file.name),
        createdAt: editingEvent?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      if (editingEvent) {
        setEvents(prev => prev.map(event => 
          event.id === editingEvent.id ? eventData : event
        ));
        addNotification({ type: 'success', title: 'Evento atualizado com sucesso!' });
      } else {
        setEvents(prev => [...prev, eventData]);
        addNotification({ type: 'success', title: 'Evento criado com sucesso!' });
      }
      
      closeModal();
    } catch (error) {
      addNotification({ type: 'error', title: 'Erro ao salvar evento' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (eventId: string) => {
    try {
      setEvents(prev => prev.filter(event => event.id !== eventId));
      addNotification({ type: 'success', title: 'Evento removido com sucesso!' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Erro ao remover evento' });
    }
  };
  
  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Dias do mês anterior
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        isOtherMonth: true
      });
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isOtherMonth: false
      });
    }
    
    // Dias do próximo mês
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(nextYear, nextMonth, day),
        isOtherMonth: true
      });
    }
    
    return days;
  };
  
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const days = getDaysInMonth(filters.month, filters.year);
  
  return (
    <Container>
      <Header>
        <Title>
          <FiCalendar />
          Calendário Inteligente
        </Title>
        <Button
          onClick={() => openModal()}
          icon={<FiPlus />}
        >
          Novo Evento
        </Button>
      </Header>
      
      <CalendarContainer>
        <Sidebar>
          <FiltersCard>
            <FilterTitle>Filtros</FilterTitle>
            <FilterGroup>
              <Select
                placeholder="Tipo de evento"
                options={[{ value: '', label: 'Todos os tipos' }, ...eventTypeOptions]}
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              />
              
              <Select
                placeholder="Prioridade"
                options={[{ value: '', label: 'Todas as prioridades' }, ...priorityOptions]}
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              />
              
              <Select
                placeholder="Responsável"
                options={[{ value: '', label: 'Todos os responsáveis' }, ...employeeOptions]}
                value={filters.assignedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              />
            </FilterGroup>
          </FiltersCard>
        </Sidebar>
        
        <CalendarMain>
          <CalendarHeader>
            <MonthNavigation>
              <NavButton onClick={() => navigateMonth('prev')}>
                <FiChevronLeft />
              </NavButton>
              <MonthTitle>
                {monthNames[filters.month]} {filters.year}
              </MonthTitle>
              <NavButton onClick={() => navigateMonth('next')}>
                <FiChevronRight />
              </NavButton>
            </MonthNavigation>
          </CalendarHeader>
          
          <CalendarGrid>
            {dayNames.map(day => (
              <DayHeader key={day}>{day}</DayHeader>
            ))}
            
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.date);
              return (
                <DayCell
                  key={index}
                  isToday={isToday(day.date)}
                  isOtherMonth={day.isOtherMonth}
                  hasEvents={dayEvents.length > 0}
                  onClick={() => openModal(undefined, day.date)}
                >
                  <DayNumber 
                    isToday={isToday(day.date)}
                    isOtherMonth={day.isOtherMonth}
                  >
                    {day.date.getDate()}
                  </DayNumber>
                  
                  <EventsList>
                    {dayEvents.slice(0, 3).map(event => (
                      <EventItem
                        key={event.id}
                        priority={event.priority}
                        type={event.type}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(event);
                        }}
                      >
                        {event.title}
                      </EventItem>
                    ))}
                    {dayEvents.length > 3 && (
                      <EventItem>
                        +{dayEvents.length - 3} mais
                      </EventItem>
                    )}
                  </EventsList>
                </DayCell>
              );
            })}
          </CalendarGrid>
        </CalendarMain>
      </CalendarContainer>
      
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEvent ? 'Editar Evento' : 'Novo Evento'}
        size="large"
        loading={loading}
        footer={
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} loading={loading}>
              {editingEvent ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        }
      >
        <FormGrid>
          <Input
            label="Título *"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            placeholder="Digite o título do evento"
          />
          
          <Select
            label="Tipo *"
            options={eventTypeOptions}
            value={formData.type}
            onChange={(e) => handleFormChange('type', e.target.value)}
          />
          
          <Select
            label="Prioridade *"
            options={priorityOptions}
            value={formData.priority}
            onChange={(e) => handleFormChange('priority', e.target.value)}
          />
          
          <Select
            label="Responsável"
            options={employeeOptions}
            value={formData.assignedTo}
            onChange={(e) => handleFormChange('assignedTo', e.target.value)}
            placeholder="Selecione o responsável"
          />
          
          <Input
            label="Data de Início *"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleFormChange('startDate', e.target.value)}
          />
          
          <Input
            label="Data de Fim"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleFormChange('endDate', e.target.value)}
          />
        </FormGrid>
        
        <TimeGrid>
          <Input
            label="Hora de Início"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleFormChange('startTime', e.target.value)}
          />
          
          <Input
            label="Hora de Fim"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleFormChange('endTime', e.target.value)}
          />
        </TimeGrid>
        
        <Input
          label="Local"
          value={formData.location}
          onChange={(e) => handleFormChange('location', e.target.value)}
          placeholder="Digite o local do evento"
        />
        
        <Input
          label="Descrição"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Digite a descrição do evento"
        />
        
        <AttachmentsSection>
          <h3>Anexos</h3>
          <UploadButton>
            <FiUpload />
            Adicionar Arquivos
            <FileInput
              type="file"
              multiple
              onChange={handleFileUpload}
            />
          </UploadButton>
          
          {formData.attachments.length > 0 && (
            <AttachmentsList>
              {formData.attachments.map((file, index) => (
                <AttachmentItem key={index}>
                  <FiFile />
                  {file.name}
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => removeAttachment(index)}
                  >
                    <FiTrash2 size={14} />
                  </Button>
                </AttachmentItem>
              ))}
            </AttachmentsList>
          )}
        </AttachmentsSection>
      </Modal>
    </Container>
  );
};

export default SmartCalendar;