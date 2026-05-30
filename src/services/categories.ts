import { api } from './api';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string;
  is_default: boolean;
}

interface ApiCategory {
  _id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string;
  is_default: boolean;
}

const mapCategory = (c: ApiCategory): Category => ({
  id: c._id,
  name: c.name,
  type: c.type,
  color: c.color,
  is_default: c.is_default,
});

export const getCategories = async (): Promise<Category[]> => {
  const data = await api.get<ApiCategory[]>('/cuentas/categories');
  return data.map(mapCategory);
};

export const addCategory = async (category: Pick<Category, 'name' | 'type' | 'color'>): Promise<Category> => {
  const data = await api.post<ApiCategory>('/cuentas/categories', category);
  return mapCategory(data);
};

export const updateCategory = async (
  categoryId: string,
  updates: Partial<Pick<Category, 'name' | 'type' | 'color'>>
): Promise<Category> => {
  const data = await api.put<ApiCategory>(`/cuentas/categories/${categoryId}`, updates);
  return mapCategory(data);
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await api.delete(`/cuentas/categories/${categoryId}`);
};
