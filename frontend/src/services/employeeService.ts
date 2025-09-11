// Serviço de Funcionários - DL Auto Peças

import { employeesService, permissionsService } from './firestoreService';
import { Employee, Permission } from '../types';

// ===== SERVIÇOS DE FUNCIONÁRIOS =====
export class EmployeeService {
  // Buscar todos os funcionários
  static async getAllEmployees(filters?: {
    department?: string;
    role?: string;
    status?: string;
    limit?: number;
  }): Promise<Employee[]> {
    try {
      const queryFilters = [];
      
      // Aplicar filtros
      if (filters?.department) {
        queryFilters.push({ field: 'department', operator: '==', value: filters.department });
      }
      
      if (filters?.role) {
        queryFilters.push({ field: 'role', operator: '==', value: filters.role });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      const employees = await employeesService.readMany({
        queryFilters,
        orderBy: [{ field: 'name', direction: 'asc' }],
        limit: filters?.limit
      });
      
      return employees.map(employee => ({
        ...employee,
        hireDate: employee.hireDate?.toDate?.() || employee.hireDate,
        createdAt: employee.createdAt?.toDate?.() || employee.createdAt,
        updatedAt: employee.updatedAt?.toDate?.() || employee.updatedAt
      })) as Employee[];
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      throw new Error('Falha ao carregar funcionários');
    }
  }
  
  // Buscar funcionário por ID
  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const employee = await employeesService.readById(id);
      
      if (employee) {
        return {
          ...employee,
          hireDate: employee.hireDate?.toDate?.() || employee.hireDate,
          createdAt: employee.createdAt?.toDate?.() || employee.createdAt,
          updatedAt: employee.updatedAt?.toDate?.() || employee.updatedAt
        } as Employee;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      throw new Error('Falha ao carregar funcionário');
    }
  }
  
  // Buscar funcionário por email
  static async getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      const employees = await employeesService.readMany({
        queryFilters: [{ field: 'email', operator: '==', value: email }],
        limit: 1
      });
      
      if (employees.length > 0) {
        const employee = employees[0];
        return {
          ...employee,
          hireDate: employee.hireDate?.toDate?.() || employee.hireDate,
           createdAt: employee.createdAt?.toDate?.() || employee.createdAt,
           updatedAt: employee.updatedAt?.toDate?.() || employee.updatedAt
        } as Employee;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar funcionário por email:', error);
      throw new Error('Falha ao carregar funcionário');
    }
  }
  
  // Criar novo funcionário
  static async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const result = await employeesService.create({
        ...employeeData,
        hireDate: employeeData.hireDate || now,
        createdAt: now,
        updatedAt: now
      });
      
      return result.id;
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw new Error('Falha ao criar funcionário');
    }
  }
  
  // Atualizar funcionário
  static async updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };
      
      await employeesService.update(id, updateData);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw new Error('Falha ao atualizar funcionário');
    }
  }
  
  // Deletar funcionário
  static async deleteEmployee(id: string): Promise<void> {
    try {
      await employeesService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      throw new Error('Falha ao deletar funcionário');
    }
  }
  
  // Buscar funcionários por departamento
  static async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    try {
      const employees = await employeesService.readMany({
        queryFilters: [
          { field: 'department', operator: '==', value: department },
          { field: 'status', operator: '==', value: 'active' }
        ],
        orderBy: [{ field: 'name', direction: 'asc' }]
      });
      
      return employees.map(employee => ({
        ...employee,
        hireDate: employee.hireDate?.toDate?.() || employee.hireDate,
        createdAt: employee.createdAt?.toDate?.() || employee.createdAt,
        updatedAt: employee.updatedAt?.toDate?.() || employee.updatedAt
      })) as Employee[];
    } catch (error) {
      console.error('Erro ao buscar funcionários por departamento:', error);
      throw new Error('Falha ao carregar funcionários do departamento');
    }
  }
  
  // Buscar vendedores ativos
  static async getActiveSalespeople(): Promise<Employee[]> {
    try {
      const employees = await employeesService.readMany({
        queryFilters: [
          { field: 'role', operator: '==', value: 'vendedor' },
          { field: 'status', operator: '==', value: 'active' }
        ],
        orderBy: [{ field: 'name', direction: 'asc' }]
      });
      
      return employees.map(employee => ({
        ...employee,
        hireDate: employee.hireDate?.toDate?.() || employee.hireDate,
        createdAt: employee.createdAt?.toDate?.() || employee.createdAt,
        updatedAt: employee.updatedAt?.toDate?.() || employee.updatedAt
      })) as Employee[];
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      throw new Error('Falha ao carregar vendedores');
    }
  }
}

// ===== SERVIÇOS DE PERMISSÕES =====
export class PermissionService {
  // Buscar permissões por funcionário
  static async getPermissionsByEmployeeId(employeeId: string): Promise<Permission[]> {
    try {
      const permissions = await permissionsService.readMany({
        queryFilters: [{ field: 'employeeId', operator: '==', value: employeeId }],
        orderBy: [{ field: 'module', direction: 'asc' }]
      });
      
      return permissions.map(permission => ({
        ...permission,
        createdAt: permission.createdAt?.toDate?.() || permission.createdAt,
        updatedAt: permission.updatedAt?.toDate?.() || permission.updatedAt
      })) as Permission[];
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      throw new Error('Falha ao carregar permissões');
    }
  }
  
  // Criar nova permissão
  static async createPermission(permissionData: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const result = await permissionsService.create({
        ...permissionData,
        createdAt: now,
        updatedAt: now
      });
      
      return result.id;
    } catch (error) {
      console.error('Erro ao criar permissão:', error);
      throw new Error('Falha ao criar permissão');
    }
  }
  
  // Atualizar permissão
  static async updatePermission(id: string, updates: Partial<Omit<Permission, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await permissionsService.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      throw new Error('Falha ao atualizar permissão');
    }
  }
  
  // Deletar permissão
  static async deletePermission(id: string): Promise<void> {
    try {
      await permissionsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar permissão:', error);
      throw new Error('Falha ao deletar permissão');
    }
  }
  
  // Deletar todas as permissões de um funcionário
  static async deleteEmployeePermissions(employeeId: string): Promise<void> {
    try {
      const permissions = await permissionsService.readMany({
        queryFilters: [{ field: 'employeeId', operator: '==', value: employeeId }]
      });
      
      const deletePromises = permissions.map(permission => 
        permissionsService.delete(permission.id)
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Erro ao deletar permissões do funcionário:', error);
      throw new Error('Falha ao deletar permissões');
    }
  }
  
  // Verificar se funcionário tem permissão específica
  static async hasPermission(employeeId: string, module: string, action: string): Promise<boolean> {
    try {
      const permissions = await permissionsService.readMany({
        queryFilters: [
          { field: 'employeeId', operator: '==', value: employeeId },
          { field: 'module', operator: '==', value: module },
          { field: 'actions', operator: 'array-contains', value: action }
        ],
        limit: 1
      });
      
      return permissions.length > 0;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }
  
  // Atualizar permissões em lote para um funcionário
  static async updateEmployeePermissions(employeeId: string, permissions: Omit<Permission, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      // Primeiro, deletar permissões existentes
      await this.deleteEmployeePermissions(employeeId);
      
      // Depois, criar novas permissões
      const createPromises = permissions.map(permission => 
        this.createPermission({
          ...permission,
          employeeId
        })
      );
      
      await Promise.all(createPromises);
    } catch (error) {
      console.error('Erro ao atualizar permissões do funcionário:', error);
      throw new Error('Falha ao atualizar permissões');
    }
  }
}